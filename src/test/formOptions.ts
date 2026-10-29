/**
 * SYNTHETIC runtime option lists for the Biomodel form. The source says
 * these come "from runtime" (softwareList, printersList, models per brand);
 * no values are given anywhere, so these are invented placeholders, marked
 * "(mock)", until the tenant catalog is known (R02).
 *
 * Printer models carry their brand as `<brandCode>:<model>` so the form can
 * narrow them by brand (mock convention; the contract cannot express the
 * dependency yet, Q-B12).
 */

import type { FormOption } from '@/shared/api';

export const MOCK_RUNTIME_OPTIONS: Readonly<Record<string, readonly FormOption[]>> = {
  'deliverablesgroup.softwareDesign': [
    { code: 'mock-sw-1', label: 'Design software 1 (mock)' },
    { code: 'mock-sw-2', label: 'Design software 2 (mock)' },
  ],
  'printerGroup.printerBrand': [
    { code: 'mock-brand-a', label: 'Printer brand A (mock)' },
    { code: 'mock-brand-b', label: 'Printer brand B (mock)' },
  ],
  'printerGroup.printerModel': [
    { code: 'mock-brand-a:m1', label: 'Brand A, model 1 (mock)' },
    { code: 'mock-brand-a:m2', label: 'Brand A, model 2 (mock)' },
    { code: 'mock-brand-b:m1', label: 'Brand B, model 1 (mock)' },
  ],
};
