/**
 * Catalog service -> v0.6 FormSpec: the one place that knows real catalog codes.
 *
 * TODO(schema-driven forms): temporary compatibility bridge. Remove it once the
 * forms render from `GET /api/v1/catalog/services/{serviceUuid}/form-schema`.
 *
 * Codes are exact matches from the test server's `GET /api/v1/catalog/services`
 * (29 Oct 2026). Never matched by name or prefix: a code not listed here, now or
 * later, has no form (unsupported).
 */

import type { CatalogService } from '@/shared/api';
import { BIOMODEL_SPEC, CONVERSION_SPEC, type FormSpec } from './formSpecs';

const BIOMODEL_SERVICE_CODES: ReadonlySet<string> = new Set(['biomodel_other_services']);

/** Demo assumption (developer, A40): every listed code uses the current Conversion form. */
const CONVERSION_SERVICE_CODES: ReadonlySet<string> = new Set([
  'legacy_price_convcostbsbbasicfull',
  'legacy_price_convcostbsbbasicquad',
  'legacy_price_convcostbsbcustomfull',
  'legacy_price_convcostbsbcustomquad',
  'legacy_price_convcostcodxbasicfull',
  'legacy_price_convcostcodxbasicquad',
  'legacy_price_convcostcodxcustomfull',
  'legacy_price_convcostcodxcustomquad',
  'legacy_price_convcostcustomdoublefullarch',
  'legacy_price_convcostimplantstudiobasicfull',
  'legacy_price_convcostimplantstudiobasicquad',
  'legacy_price_convcostimplantstudiocustomfull',
  'legacy_price_convcostimplantstudiocustomquad',
  'legacy_price_convcostoneshot',
  'legacy_price_convcostrealguidebasicfull',
  'legacy_price_convcostrealguidebasicquad',
  'legacy_price_convcostrealguidecustomfull',
  'legacy_price_convcostrealguidecustomquad',
  'legacy_price_convcostsimplantbasicfull',
  'legacy_price_convcostsimplantbasicquad',
  'legacy_price_convcostsimplantcustomfull',
  'legacy_price_convcostsimplantcustomquad',
]);

export function resolveFormSpec(service: Pick<CatalogService, 'code'>): FormSpec | undefined {
  if (BIOMODEL_SERVICE_CODES.has(service.code)) return BIOMODEL_SPEC;
  if (CONVERSION_SERVICE_CODES.has(service.code)) return CONVERSION_SPEC;
  return undefined;
}
