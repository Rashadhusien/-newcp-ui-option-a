/**
 * Pure form logic for the service forms: merging the local specs with the
 * server's FormDefinition, visibility, validation, dependent resets and the
 * conversion to and from the contract's answers. No React here, so every
 * rule is unit-tested.
 */

import { z } from 'zod';
import type { CanonicalFieldType, FormAnswer, FormDefinition, FormField, FormOption } from '@/shared/api';
import {
  FORMAT_FOR_SOFTWARE,
  type ControlType,
  type FieldSpec,
  type FieldValue,
  type FormKey,
  type FormSpec,
  type FormValues,
} from './formSpecs';

/** A field ready to render: the spec, with the server's label, options and data type. */
export interface RenderField {
  spec: FieldSpec;
  label: string;
  options: readonly FormOption[];
  /** The server's canonical type (Q-B11); decides the answer's JSON type. */
  type: CanonicalFieldType;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface FieldIssue {
  key: string;
  message: string;
}

/**
 * Widget for a server field the local specs don't know, by canonical type
 * (Q-B11). Types this demo cannot edit (multi-select, file, tooth chart)
 * have no widget and are listed by `unsupportedFields`.
 */
const CONTROL_FOR_TYPE: Readonly<Partial<Record<CanonicalFieldType, ControlType>>> = {
  single_select: 'select',
  boolean: 'checkbox',
  text: 'text',
  number: 'text',
  date: 'text',
};

/** Canonical data type of a local control (Q-B11: radio vs select is presentation only). */
export function canonicalTypeOf(control: ControlType): CanonicalFieldType {
  if (control === 'radio' || control === 'select') return 'single_select';
  if (control === 'checkbox') return 'boolean';
  return 'text';
}

/** Server fields the specs don't know and this demo has no widget for. */
export function unsupportedFields(spec: FormSpec, definition: FormDefinition): FormField[] {
  const specCodes = new Set(spec.fields.map((fieldSpec) => fieldSpec.code));
  return definition.fields.filter((field) => !specCodes.has(field.code) && CONTROL_FOR_TYPE[field.type] === undefined);
}

/** Field key for a server field the local specs don't know (dots are not allowed in form keys). */
function keyFor(code: string): string {
  return `extra_${code.replace(/[^A-Za-z0-9]/g, '_')}`;
}

/**
 * Only fields the server's definition contains are rendered (the server
 * rejects unknown fields), in spec order; server fields the spec doesn't
 * know are appended with no local rules.
 */
export function resolveFields(spec: FormSpec, definition: FormDefinition): RenderField[] {
  const byCode = new Map<string, FormField>(definition.fields.map((field) => [field.code, field]));
  const known = spec.fields.flatMap((fieldSpec): RenderField[] => {
    const server = byCode.get(fieldSpec.code);
    if (!server) return [];
    return [
      {
        spec: fieldSpec,
        label: server.label || fieldSpec.label,
        options: server.options.length > 0 ? server.options : (fieldSpec.options ?? []),
        type: server.type,
      },
    ];
  });
  const specCodes = new Set(spec.fields.map((fieldSpec) => fieldSpec.code));
  const extra = definition.fields
    .filter((field) => !specCodes.has(field.code) && CONTROL_FOR_TYPE[field.type] !== undefined)
    .map((field): RenderField => {
      const control = CONTROL_FOR_TYPE[field.type] ?? 'text';
      return {
        spec: {
          key: keyFor(field.code),
          code: field.code,
          label: field.label,
          control,
          section: 'Other',
          defaultValue: control === 'checkbox' ? false : (field.defaultValue ?? ''),
          required: field.required,
        },
        label: field.label,
        options: field.options,
        type: field.type,
      };
    });
  return [...known, ...extra];
}

/** useWatch returns a partial record; every key has a default, so this only drops undefined entries. */
export function definedValues(partial: Readonly<Record<string, FieldValue | undefined>>): FormValues {
  const values: FormValues = {};
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) values[key] = value;
  }
  return values;
}

export function isVisible(field: FieldSpec, values: FormValues): boolean {
  return field.visible ? field.visible(values) : true;
}

export function optionsFor(field: RenderField, values: FormValues): FormOption[] {
  const active = field.options.filter((option) => option.active !== false);
  return field.spec.filterOptions ? field.spec.filterOptions(active, values) : active;
}

/** Form values from the server's answers (Q-B16: `optionCodes` for choices, `value` for the rest). */
export function initialValues(fields: readonly RenderField[], answers?: readonly FormAnswer[]): FormValues {
  const byCode = new Map((answers ?? []).map((answer) => [answer.fieldCode, answer]));
  const values: FormValues = {};
  for (const { spec } of fields) {
    const answer = byCode.get(spec.code);
    if (!answer) {
      values[spec.key] = spec.defaultValue;
    } else if (spec.control === 'radio' || spec.control === 'select') {
      values[spec.key] = answer.optionCodes?.[0] ?? '';
    } else if (spec.control === 'checkbox') {
      values[spec.key] = answer.value === true;
    } else {
      values[spec.key] = answer.value === undefined ? '' : String(answer.value);
    }
  }
  return values;
}

/** Values to set after `key` changed (source behaviour: dependent resets). */
export function dependentChanges(formKey: FormKey, key: string, value: FieldValue): FormValues {
  if (formKey === 'conversion' && key === 'software' && typeof value === 'string') {
    return Object.hasOwn(FORMAT_FOR_SOFTWARE, value) ? { format: FORMAT_FOR_SOFTWARE[value] } : {};
  }
  if (formKey === 'biomodel' && key === 'printerBrand') {
    // Source: the model resets when the brand changes (VAL-NEST-002 notes).
    return { printerModel: '' };
  }
  return {};
}

// Typed `unknown`: a key can be missing at runtime even though the record type says otherwise.
function isEmpty(value: unknown): boolean {
  return value === undefined || value === '';
}

/**
 * Blocking problems: source-attached required fields and group validators,
 * plus the wire format of number and date fields (the server rejects a
 * wrong JSON type with 422 INVALID_FIELD_TYPE, D-79).
 */
export function validate(formKey: FormKey, fields: readonly RenderField[], values: FormValues): FieldIssue[] {
  const issues: FieldIssue[] = [];
  for (const { spec, type } of fields) {
    const value = values[spec.key];
    if (!isVisible(spec, values)) continue;
    if (spec.required && isEmpty(value)) {
      const choice = spec.control === 'radio' || spec.control === 'select';
      issues.push({ key: spec.key, message: choice ? 'Choose an option.' : 'Enter a value.' });
    } else if (typeof value === 'string' && value.trim() !== '') {
      if (type === 'number' && !Number.isFinite(Number(value))) {
        issues.push({ key: spec.key, message: 'Enter a number.' });
      } else if (type === 'date' && !DATE_PATTERN.test(value.trim())) {
        issues.push({ key: spec.key, message: 'Enter a date as YYYY-MM-DD.' });
      }
    }
  }
  const has = (key: string) => fields.some((field) => field.spec.key === key);
  // VAL-BIO-001: the group validator rejects both arches at None.
  if (
    formKey === 'biomodel' &&
    has('customizationMaxilla') &&
    has('customizationMandible') &&
    values.customizationMaxilla === '0' &&
    values.customizationMandible === '0'
  ) {
    issues.push({ key: 'customizationMaxilla', message: 'Choose a customization for at least one arch.' });
  }
  return issues;
}

export interface SectionWarning {
  section: string;
  message: string;
}

/** Non-blocking warnings the source shows without blocking submit. */
export function warnings(formKey: FormKey, values: FormValues): SectionWarning[] {
  // VAL-CONV-003: the source shows an error for both arches at None but does not prove it blocks submit.
  if (formKey === 'conversion' && values.maxilla === '20' && values.mandible === '20') {
    return [
      {
        section: 'Arches',
        message:
          'Both arches are set to None. Choose at least one arch unless this conversion is linked to another service.',
      },
    ];
  }
  return [];
}

/** react-hook-form resolver input: a zod schema that runs `validate`. */
export function formSchema(formKey: FormKey, fields: readonly RenderField[]) {
  return z.record(z.string(), z.union([z.string(), z.boolean()])).superRefine((values, ctx) => {
    for (const issue of validate(formKey, fields, values)) {
      ctx.addIssue({ code: 'custom', path: [issue.key], message: issue.message });
    }
  });
}

/**
 * Answers in the canonical format (Q-B16, D-79): a single choice sends
 * `optionCodes: [code]` (omitted when nothing is chosen), a checkbox
 * `value: true|false`, a number field a JSON number, text and date fields a
 * string (dates `YYYY-MM-DD`); empty text is omitted. Never both `value`
 * and `optionCodes`. Hidden fields are not sent, except values the source
 * sets programmatically (`sendWhenHidden`). A PATCH sends this full list:
 * it replaces the saved answers. This and `initialValues` are the ONE place
 * that knows the wire format. File and tooth-chart fields have no confirmed
 * payload and are never rendered, so never sent.
 */
export function toAnswers(fields: readonly RenderField[], values: FormValues): FormAnswer[] {
  const answers: FormAnswer[] = [];
  for (const { spec, type } of fields) {
    const shown = isVisible(spec, values) || (spec.sendWhenHidden?.(values) ?? false);
    if (!shown) continue;
    const value = values[spec.key];
    if (spec.control === 'radio' || spec.control === 'select') {
      if (typeof value === 'string' && value !== '') answers.push({ fieldCode: spec.code, optionCodes: [value] });
    } else if (spec.control === 'checkbox') {
      answers.push({ fieldCode: spec.code, value: value === true });
    } else if (typeof value === 'string' && value.trim() !== '') {
      answers.push({ fieldCode: spec.code, value: type === 'number' ? Number(value) : value.trim() });
    }
  }
  return answers;
}

/** Field key for a server 422 `details.field` (fieldCode or key), if the form shows it. */
export function keyForServerField(fields: readonly RenderField[], field: unknown): string | undefined {
  if (typeof field !== 'string') return undefined;
  return fields.find(({ spec }) => spec.code === field || spec.key === field)?.spec.key;
}
