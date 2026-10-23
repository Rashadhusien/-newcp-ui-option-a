/**
 * Pure form logic for the service forms: merging the local specs with the
 * server's FormDefinition, visibility, validation, dependent resets and the
 * conversion to and from the contract's answers. No React here, so every
 * rule is unit-tested.
 */

import { z } from 'zod';
import type { FormAnswer, FormDefinition, FormField, FormOption } from '@/shared/api';
import {
  FORMAT_FOR_SOFTWARE,
  type ControlType,
  type FieldSpec,
  type FieldValue,
  type FormKey,
  type FormSpec,
  type FormValues,
} from './formSpecs';

/** A field ready to render: the spec, with the server's label and options when it sent them. */
export interface RenderField {
  spec: FieldSpec;
  label: string;
  options: readonly FormOption[];
}

export interface FieldIssue {
  key: string;
  message: string;
}

const CONTROL_FOR_TYPE: Readonly<Record<string, ControlType>> = {
  radio: 'radio',
  select: 'select',
  checkbox: 'checkbox',
  boolean: 'checkbox',
  textarea: 'textarea',
  text: 'text',
};

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
      },
    ];
  });
  const specCodes = new Set(spec.fields.map((fieldSpec) => fieldSpec.code));
  const extra = definition.fields
    .filter((field) => !specCodes.has(field.code))
    .map((field): RenderField => {
      const control = CONTROL_FOR_TYPE[field.type ?? ''] ?? (field.options.length > 0 ? 'select' : 'text');
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
      values[spec.key] = typeof answer.value === 'string' ? answer.value : '';
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

/** Blocking problems: source-attached required fields and group validators. */
export function validate(formKey: FormKey, fields: readonly RenderField[], values: FormValues): FieldIssue[] {
  const issues: FieldIssue[] = [];
  for (const { spec } of fields) {
    if (spec.required && isVisible(spec, values) && isEmpty(values[spec.key])) {
      const choice = spec.control === 'radio' || spec.control === 'select';
      issues.push({ key: spec.key, message: choice ? 'Choose an option.' : 'Enter a value.' });
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
 * Contract v1 answers: choice fields send `optionCodes` (one code, or `[]`
 * when nothing is chosen), checkboxes a boolean `value`, text a string
 * `value` (omitted when empty). Hidden fields are not sent, except values
 * the source sets programmatically (`sendWhenHidden`).
 */
export function toAnswers(fields: readonly RenderField[], values: FormValues): FormAnswer[] {
  const answers: FormAnswer[] = [];
  for (const { spec } of fields) {
    const shown = isVisible(spec, values) || (spec.sendWhenHidden?.(values) ?? false);
    if (!shown) continue;
    const value = values[spec.key];
    if (spec.control === 'radio' || spec.control === 'select') {
      answers.push({ fieldCode: spec.code, optionCodes: typeof value === 'string' && value !== '' ? [value] : [] });
    } else if (spec.control === 'checkbox') {
      answers.push({ fieldCode: spec.code, value: value === true });
    } else if (typeof value === 'string' && value.trim() !== '') {
      answers.push({ fieldCode: spec.code, value });
    }
  }
  return answers;
}

/** Field key for a server 422 `details.field` (fieldCode or key), if the form shows it. */
export function keyForServerField(fields: readonly RenderField[], field: unknown): string | undefined {
  if (typeof field !== 'string') return undefined;
  return fields.find(({ spec }) => spec.code === field || spec.key === field)?.spec.key;
}
