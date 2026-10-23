/**
 * Builds the mock's contract-shaped FormDefinition from the local specs, so
 * the UI renders from `GET /catalog/services/{uuid}/form-schema` exactly as
 * it will against the real API. Field UUIDs are synthetic; `type` uses the
 * spec's control name until the contract lists its types (Q-B11).
 */

import type { CatalogService, FormDefinition, FormField } from '@/shared/api';
import { MOCK_RUNTIME_OPTIONS } from '@/mocks/formOptions';
import type { FormSpec } from './formSpecs';

export function mockFormDefinition(service: CatalogService, spec: FormSpec): FormDefinition {
  const prefix = spec.key === 'biomodel' ? 'b' : 'c';
  const fields = spec.fields.map((field, index): FormField => {
    const runtime = field.runtimeOptions ? (MOCK_RUNTIME_OPTIONS[field.code] ?? []) : undefined;
    return {
      uuid: `00000000-0000-4000-9000-${prefix}${index.toString(16).padStart(11, '0')}`,
      code: field.code,
      label: field.label,
      type: field.control,
      required: field.required === true,
      defaultValue: typeof field.defaultValue === 'string' ? field.defaultValue : String(field.defaultValue),
      options: [...(runtime ?? field.options ?? [])],
    };
  });
  return {
    service,
    fields,
    evidence: 'MOCK: fields from the v0.6 Connect form specs; tenant catalog mapping unresolved (R01, R02)',
  };
}
