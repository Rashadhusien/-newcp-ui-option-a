import { describe, expect, it } from 'vitest';
import { resolveFormSpec } from './catalogFormBridge';
import { BIOMODEL_SPEC, CONVERSION_SPEC } from './formSpecs';

const CONVERSION_CODES = [
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
];

describe('resolveFormSpec (catalog compatibility bridge)', () => {
  it('maps the real Biomodel code to the Biomodel form', () => {
    expect(resolveFormSpec({ code: 'biomodel_other_services' })).toBe(BIOMODEL_SPEC);
  });

  it.each(CONVERSION_CODES)('maps %s to the Conversion form', (code) => {
    expect(resolveFormSpec({ code })).toBe(CONVERSION_SPEC);
  });

  it('leaves unknown, prefix-only, name-like and old mock codes unsupported', () => {
    for (const code of [
      'legacy_price_convcostnewsoftwarefull',
      'legacy_price_xtracostbiomodel',
      'biomodel',
      'mock-biomodel',
      'mock-conversion',
      '',
    ]) {
      expect(resolveFormSpec({ code })).toBeUndefined();
    }
  });
});
