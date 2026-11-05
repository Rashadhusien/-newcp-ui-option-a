import { describe, expect, it } from 'vitest';
import type { CatalogService } from '@/shared/api';
import { conversionFamilyDefinition, resolveFormSpec, serviceChoices, serviceLabel } from './catalogFormBridge';
import { BIOMODEL_SPEC, CONVERSION_SPEC } from './formSpecs';

function row(code: string, serviceFamily?: CatalogService['serviceFamily'], uuid = `uuid-${code}`): CatalogService {
  return { uuid, code, name: code, itemKind: 'service', ...(serviceFamily ? { serviceFamily } : {}) };
}

const BIOMODEL_ROW = row('biomodel_other_services', 'biomodel');
const CONVERSION_ROWS = [
  row('legacy_price_convcostbsbbasicfull', 'conversion'),
  row('legacy_price_convcostcodxcustomquad', 'conversion'),
  row('legacy_price_convcostsimplantbasicquad', 'conversion'),
];

describe('resolveFormSpec (by serviceFamily, PR #28)', () => {
  it('maps the biomodel family to the Biomodel form and the conversion family to the Conversion form', () => {
    expect(resolveFormSpec(BIOMODEL_ROW)).toBe(BIOMODEL_SPEC);
    for (const conversion of CONVERSION_ROWS) expect(resolveFormSpec(conversion)).toBe(CONVERSION_SPEC);
  });

  it('leaves rows without a family unsupported, whatever their code', () => {
    for (const code of ['legacy_price_convcostbsbbasicfull', 'biomodel_other_services', 'legacy_price_convcostoneshot']) {
      expect(resolveFormSpec(row(code))).toBeUndefined();
    }
  });
});

describe('serviceChoices', () => {
  it('collapses every Conversion row into one choice with no row picked, and shows Biomodel once', () => {
    const choices = serviceChoices([...CONVERSION_ROWS, row('crown_final_restoration'), BIOMODEL_ROW]);
    expect(choices.map((choice) => choice.family)).toEqual(['biomodel', 'conversion']);
    expect(choices[0]?.service).toBe(BIOMODEL_ROW);
    expect(choices[1]).toMatchObject({ family: 'conversion', spec: CONVERSION_SPEC, service: null });
  });

  it('offers nothing for a catalog without known families', () => {
    expect(serviceChoices([row('crown_final_restoration'), row('legacy_price_convcostoneshot')])).toEqual([]);
  });

  it('labels a resolved Conversion variant by its family, other rows by their name', () => {
    expect(serviceLabel(CONVERSION_ROWS[1])).toBe('Conversion');
    expect(serviceLabel(row('crown_final_restoration'))).toBe('crown_final_restoration');
    expect(serviceLabel(undefined)).toBeUndefined();
  });

  it('builds the Conversion family form from the existing Conversion form, with no catalog row', () => {
    const definition = conversionFamilyDefinition();
    expect(definition.service).toMatchObject({ uuid: '', serviceFamily: 'conversion', name: 'Conversion' });
    expect(definition.fields.map((field) => field.code)).toEqual(CONVERSION_SPEC.fields.map((field) => field.code));
  });
});
