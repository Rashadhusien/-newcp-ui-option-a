/**
 * Catalog -> v0.6 FormSpec, by the backend's `CatalogService.serviceFamily` (PR #28).
 * The one place that turns catalog rows into user-facing service choices.
 *
 * TODO(schema-driven forms): temporary compatibility bridge. Remove it once the
 * forms render from `GET /api/v1/catalog/services/{serviceUuid}/form-schema`.
 *
 * No catalog code, name or prefix is interpreted here: a row without a known
 * `serviceFamily` has no form (unsupported).
 */

import type { CatalogService, FormDefinition, FormField, ServiceFamily } from '@/shared/api';
import { canonicalTypeOf } from './formLogic';
import { BIOMODEL_SPEC, CONVERSION_SPEC, type FormSpec } from './formSpecs';

export function resolveFormSpec(service: Pick<CatalogService, 'serviceFamily'>): FormSpec | undefined {
  switch (service.serviceFamily) {
    case 'biomodel':
      return BIOMODEL_SPEC;
    case 'conversion':
      return CONVERSION_SPEC;
    default:
      return undefined;
  }
}

/** One user-facing service, however many catalog rows belong to its family. */
export interface ServiceChoice {
  family: ServiceFamily;
  spec: FormSpec;
  /**
   * Biomodel: the catalog row created directly (`sellableItemUuid`).
   * Conversion: null; create sends `serviceFamily: 'conversion'` and the backend resolves the variant.
   */
  service: CatalogService | null;
}

/** Biomodel then Conversion, each at most once. */
export function serviceChoices(catalog: readonly CatalogService[]): ServiceChoice[] {
  const choices: ServiceChoice[] = [];
  const biomodel = catalog.filter((service) => service.serviceFamily === 'biomodel');
  // The contract creates Biomodel only by sellableItemUuid; with several rows there is no defined choice.
  if (biomodel.length === 1) choices.push({ family: 'biomodel', spec: BIOMODEL_SPEC, service: biomodel[0] ?? null });
  if (catalog.some((service) => service.serviceFamily === 'conversion')) {
    choices.push({ family: 'conversion', spec: CONVERSION_SPEC, service: null });
  }
  return choices;
}

/** User-facing name of a catalog row: its family's form title, else the row's own name. */
export function serviceLabel(service: CatalogService | undefined): string | undefined {
  return service ? (resolveFormSpec(service)?.title ?? service.name) : undefined;
}

/**
 * Form definition for creating a Conversion: the contract has no family-level
 * form schema and no row may be picked for it, so the fields are the existing
 * Conversion form's own (labels, options, required). `uuid` and `code` stay
 * empty: no single catalog row applies, and neither is ever sent.
 */
export function conversionFamilyDefinition(): FormDefinition {
  const fields = CONVERSION_SPEC.fields.map(
    (field): FormField => ({
      uuid: '',
      code: field.code,
      label: field.label,
      type: canonicalTypeOf(field.control),
      required: field.required === true,
      defaultValue: typeof field.defaultValue === 'string' ? field.defaultValue : String(field.defaultValue),
      options: [...(field.options ?? [])],
    }),
  );
  return {
    service: { uuid: '', code: '', name: CONVERSION_SPEC.title, itemKind: 'service', serviceFamily: 'conversion' },
    fields,
    evidence:
      'Conversion fields from the existing form; the server picks the Conversion variant from the answers when it creates the service.',
  };
}
