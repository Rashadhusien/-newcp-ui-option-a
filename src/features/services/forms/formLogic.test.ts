import { describe, expect, it } from 'vitest';
import type { CatalogService, FormDefinition } from '@/shared/api';
import {
  definedValues,
  dependentChanges,
  initialValues,
  keyForServerField,
  optionsFor,
  resolveFields,
  toAnswers,
  unsupportedFields,
  validate,
  warnings,
} from './formLogic';
import { BIOMODEL_SPEC, CONVERSION_SPEC, type FormSpec, type FormValues } from './formSpecs';
import { mockFormDefinition } from './mockFormDefinition';

const SERVICE: CatalogService = { uuid: 's', code: 'mock-x', name: 'X', itemKind: 'service' };

function fieldsOf(spec: FormSpec) {
  return resolveFields(spec, mockFormDefinition(SERVICE, spec));
}

function valuesOf(spec: FormSpec, overrides: FormValues = {}): FormValues {
  return { ...initialValues(fieldsOf(spec)), ...overrides };
}

describe('resolveFields', () => {
  it('renders every Connect control the definition sends: 15 Biomodel, 11 Conversion', () => {
    expect(fieldsOf(BIOMODEL_SPEC)).toHaveLength(15);
    expect(fieldsOf(CONVERSION_SPEC)).toHaveLength(11);
  });

  it('shows only fields the server sent, with its label and options winning', () => {
    const definition: FormDefinition = {
      service: SERVICE,
      fields: [
        {
          uuid: 'u1',
          code: 'software',
          label: 'Server software',
          type: 'single_select',
          required: true,
          options: [{ code: '1', label: 'S' }],
        },
        { uuid: 'u2', code: 'brandNew', label: 'Server-only field', type: 'text', required: false, options: [] },
        { uuid: 'u3', code: 'teeth', label: 'Teeth chart', type: 'tooth_chart', required: false, options: [] },
      ],
    };
    const fields = resolveFields(CONVERSION_SPEC, definition);
    expect(fields.map((field) => field.spec.code)).toEqual(['software', 'brandNew']);
    expect(fields[0]).toMatchObject({ label: 'Server software', options: [{ code: '1', label: 'S' }] });
    expect(fields[1]?.spec).toMatchObject({ key: 'extra_brandNew', control: 'text', section: 'Other' });
    // A canonical type with no demo widget is listed, not rendered.
    expect(unsupportedFields(CONVERSION_SPEC, definition).map((field) => field.code)).toEqual(['teeth']);
  });

  it('serves canonical field types (Q-B11)', () => {
    const types = new Set(mockFormDefinition(SERVICE, BIOMODEL_SPEC).fields.map((field) => field.type));
    expect([...types].sort()).toEqual(['boolean', 'single_select', 'text']);
  });
});

describe('validate: only source-attached rules', () => {
  it('VAL-BIO-001: both Biomodel arches at None is blocked', () => {
    const fields = fieldsOf(BIOMODEL_SPEC);
    expect(validate('biomodel', fields, valuesOf(BIOMODEL_SPEC))).toEqual([
      { key: 'customizationMaxilla', message: 'Choose a customization for at least one arch.' },
    ]);
    expect(validate('biomodel', fields, valuesOf(BIOMODEL_SPEC, { customizationMandible: '2' }))).toEqual([]);
  });

  it('VAL-NEST-001/002 are not enforced: a software file without software passes', () => {
    const values = valuesOf(BIOMODEL_SPEC, {
      customizationMaxilla: '1',
      isDigitalDesign: 'true',
      deliverSoftwareFile: true,
    });
    expect(validate('biomodel', fieldsOf(BIOMODEL_SPEC), values)).toEqual([]);
  });

  it('VAL-CONV-005: the intra-oral question is required only while model scan is Yes', () => {
    const fields = fieldsOf(CONVERSION_SPEC);
    expect(validate('conversion', fields, valuesOf(CONVERSION_SPEC))).toEqual([]);
    expect(validate('conversion', fields, valuesOf(CONVERSION_SPEC, { modelScan: '1' }))).toEqual([
      { key: 'oral', message: 'Choose an option.' },
    ]);
  });

  it('VAL-CONV-003 is a warning, not a blocker', () => {
    const values = valuesOf(CONVERSION_SPEC);
    expect(validate('conversion', fieldsOf(CONVERSION_SPEC), values)).toEqual([]);
    expect(warnings('conversion', values)).toHaveLength(1);
    expect(warnings('conversion', { ...values, maxilla: '21' })).toEqual([]);
  });
});

describe('dependent options and resets', () => {
  it('VAL-CONV-002: format follows software', () => {
    expect(dependentChanges('conversion', 'software', '3')).toEqual({ format: '8' });
    expect(dependentChanges('conversion', 'software', '6')).toEqual({ format: '13' });
    const format = fieldsOf(CONVERSION_SPEC).find((field) => field.spec.key === 'format');
    if (!format) throw new Error('no format field');
    expect(optionsFor(format, valuesOf(CONVERSION_SPEC, { software: '3' })).map((o) => o.code)).toEqual(['8', '9']);
  });

  it('a new printer brand clears the model, and models are narrowed by brand', () => {
    expect(dependentChanges('biomodel', 'printerBrand', 'mock-brand-a')).toEqual({ printerModel: '' });
    const model = fieldsOf(BIOMODEL_SPEC).find((field) => field.spec.key === 'printerModel');
    if (!model) throw new Error('no model field');
    expect(optionsFor(model, { printerBrand: 'mock-brand-b' }).map((o) => o.code)).toEqual(['mock-brand-b:m1']);
    expect(optionsFor(model, { printerBrand: '' })).toEqual([]);
  });
});

describe('answers (reference carriers, D-41)', () => {
  it('sends choices as optionCode, checkboxes as valueBoolean, text only when filled, and skips hidden fields', () => {
    const fields = fieldsOf(BIOMODEL_SPEC);
    const answers = toAnswers(fields, valuesOf(BIOMODEL_SPEC, { customizationMaxilla: '1', rxNote: '  ' }));
    expect(answers).toContainEqual({ fieldCode: 'customizationMaxilla', optionCode: '1' });
    expect(answers).toContainEqual({ fieldCode: 'hasRequiredFiles', valueBoolean: false });
    expect(answers.find((answer) => answer.fieldCode === 'rxNote')).toBeUndefined();
    // Digital-only fields are hidden while digital design is No.
    expect(answers.find((answer) => answer.fieldCode === 'printerGroup.printerBrand')).toBeUndefined();
  });

  it('omits an unchosen single choice (one carrier per field)', () => {
    const answers = toAnswers(fieldsOf(BIOMODEL_SPEC), valuesOf(BIOMODEL_SPEC, { isDigitalDesign: 'true' }));
    expect(answers.find((answer) => answer.fieldCode === 'printerGroup.printerBrand')).toBeUndefined();
  });

  it('sends the hidden BSB format 13 the source sets programmatically', () => {
    const answers = toAnswers(fieldsOf(CONVERSION_SPEC), valuesOf(CONVERSION_SPEC, { software: '6', format: '13' }));
    expect(answers).toContainEqual({ fieldCode: 'format', optionCode: '13' });
  });

  it('reopens saved answers as the same values', () => {
    const fields = fieldsOf(BIOMODEL_SPEC);
    const values = valuesOf(BIOMODEL_SPEC, {
      customizationMaxilla: '1',
      isDigitalDesign: 'true',
      printerBrand: 'mock-brand-a',
      printerModel: 'mock-brand-a:m2',
      printerResin: 'Synthetic resin',
      deliverStl: false,
    });
    const reopened = initialValues(fields, toAnswers(fields, values));
    for (const key of ['customizationMaxilla', 'isDigitalDesign', 'printerBrand', 'printerModel', 'printerResin', 'deliverStl']) {
      expect(reopened[key]).toBe(values[key]);
    }
  });
});

describe('helpers', () => {
  it('maps a server 422 field (code or key) to the form key', () => {
    const fields = fieldsOf(BIOMODEL_SPEC);
    expect(keyForServerField(fields, 'printerGroup.printerResin')).toBe('printerResin');
    expect(keyForServerField(fields, 'rxNote')).toBe('rxNote');
    expect(keyForServerField(fields, 'unknown')).toBeUndefined();
    expect(keyForServerField(fields, 42)).toBeUndefined();
  });

  it('drops undefined watch values', () => {
    expect(definedValues({ a: 'x', b: undefined, c: false })).toEqual({ a: 'x', c: false });
  });
});
