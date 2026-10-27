/**
 * SYNTHETIC fixtures for the service-instance mock. No real identifiers or
 * V3 data. Order, contact and payer UUIDs are the package's F07 synthetic
 * examples (references/f07/fixtures/f07_synthetic_contract_examples.json);
 * the catalog UUIDs and codes are invented placeholders until R01.
 *
 * - Status values use the V3 order-item summary vocabulary (V3 docs,
 *   `orders.order_items.status`, D-17); the transitions are illustrative,
 *   not the real workflow (R03, Q-B1).
 * - Price: the package's own acceptance example (V092 rollout guide: initial
 *   contract $20, authorized override $18), labelled mock; currency USD from
 *   the same example (G9). No other price is invented.
 * - Hold reasons: copied verbatim from the package fixture
 *   references/f07/fixtures/temporary_hold_reasons_demo_mock.json ("Demo
 *   only", synthetic, never real historical reasons; Q-B9).
 * - Zero-charge reasons: the reference contract has no endpoint (Q-B17);
 *   the labels are the examples in Bishoy's v1 draft, codes `mock-*`.
 */

import type {
  AvailableTransition,
  BilledPartyChoice,
  CatalogService,
  HoldReasonOption,
  ServiceItem,
  ZeroChargeReason,
} from '@/shared/api';

export const MOCK_ORDER_UUID = '00000000-0000-0000-0000-000000000001';
export const MOCK_DOCTOR_UUID = '00000000-0000-0000-0000-000000000011';
export const MOCK_SCAN_CENTER_UUID = '00000000-0000-0000-0000-000000000012';

export const MOCK_BIOMODEL_UUID = '00000000-0000-0000-0000-000000000003';
export const MOCK_CONVERSION_UUID = '00000000-0000-0000-0000-000000000004';

export const MOCK_CATALOG: readonly CatalogService[] = [
  {
    uuid: MOCK_BIOMODEL_UUID,
    code: 'mock-biomodel',
    name: 'Biomodel',
    itemKind: 'service',
    isDigital: false,
    workflowCode: null,
  },
  {
    uuid: MOCK_CONVERSION_UUID,
    code: 'mock-conversion',
    name: 'Conversion',
    itemKind: 'service',
    isDigital: true,
    workflowCode: null,
  },
];

export const MOCK_BILLED_PARTIES: readonly BilledPartyChoice[] = [
  { contactUuid: MOCK_DOCTOR_UUID, role: 'doctor', label: 'Synthetic Doctor' },
  { contactUuid: MOCK_SCAN_CENTER_UUID, role: 'scanning_center', label: 'Synthetic Scanning Center' },
];

/** Initial contract price for every mock service (package acceptance example). */
export const MOCK_CONTRACT_UNIT_PRICE = '20.00';
export const MOCK_CURRENCY = 'USD';

/** A19: services of the other synthetic orders (orderFixtures), so the orders list has more than one order. */
function extraItem(uuidSuffix: string, orderSuffix: string, service: 'biomodel' | 'conversion', lineNumber: number, status: string): ServiceItem {
  return {
    uuid: `00000000-0000-0000-0000-0000000000${uuidSuffix}`,
    orderUuid: `00000000-0000-0000-0000-0000000000${orderSuffix}`,
    sellableItemUuid: service === 'biomodel' ? MOCK_BIOMODEL_UUID : MOCK_CONVERSION_UUID,
    lineNumber,
    quantity: 1,
    status,
    isBillable: true,
    canEditBillability: true,
    isRedo: false,
    isInvoiced: false,
    currencyCode: MOCK_CURRENCY,
    unitPrice: MOCK_CONTRACT_UNIT_PRICE,
    lineTotal: MOCK_CONTRACT_UNIT_PRICE,
    canEditPrice: true,
    answers: [],
    billedToContactUuid: MOCK_DOCTOR_UUID,
    billedPartyOrigin: 'order_default',
    canEditBilledParty: true,
  };
}

/**
 * One order with two same-type Biomodel items (different payers, as in the
 * F07 example `sameTypeInstancesDifferentPayers`; the second one's clerk may
 * not change price) and one invoiced Conversion item, which is financially
 * locked.
 */
export const MOCK_SERVICE_ITEMS: readonly ServiceItem[] = [
  {
    uuid: '00000000-0000-0000-0000-000000000014',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_BIOMODEL_UUID,
    lineNumber: 1,
    quantity: 1,
    status: 'submitted',
    isBillable: true,
    canEditBillability: true,
    isRedo: false,
    isInvoiced: false,
    currencyCode: MOCK_CURRENCY,
    unitPrice: MOCK_CONTRACT_UNIT_PRICE,
    lineTotal: MOCK_CONTRACT_UNIT_PRICE,
    canEditPrice: true,
    answers: [],
    billedToContactUuid: MOCK_DOCTOR_UUID,
    billedPartyOrigin: 'order_default',
    canEditBilledParty: true,
  },
  {
    uuid: '00000000-0000-0000-0000-000000000015',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_BIOMODEL_UUID,
    lineNumber: 2,
    quantity: 1,
    status: 'in_design',
    isBillable: true,
    canEditBillability: true,
    isRedo: false,
    isInvoiced: false,
    currencyCode: MOCK_CURRENCY,
    unitPrice: MOCK_CONTRACT_UNIT_PRICE,
    lineTotal: MOCK_CONTRACT_UNIT_PRICE,
    canEditPrice: false,
    answers: [],
    billedToContactUuid: MOCK_SCAN_CENTER_UUID,
    billedPartyOrigin: 'user_selected',
    canEditBilledParty: true,
  },
  {
    uuid: '00000000-0000-0000-0000-000000000016',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_CONVERSION_UUID,
    lineNumber: 3,
    quantity: 1,
    status: 'completed',
    isBillable: true,
    canEditBillability: false,
    isRedo: false,
    isInvoiced: true,
    currencyCode: MOCK_CURRENCY,
    unitPrice: MOCK_CONTRACT_UNIT_PRICE,
    lineTotal: MOCK_CONTRACT_UNIT_PRICE,
    canEditPrice: false,
    answers: [],
    billedToContactUuid: MOCK_DOCTOR_UUID,
    billedPartyOrigin: 'order_default',
    canEditBilledParty: false,
  },
  extraItem('d1', 'c2', 'biomodel', 1, 'in_production'),
  extraItem('d2', 'c2', 'conversion', 2, 'pending_information'),
  extraItem('d3', 'c3', 'conversion', 1, 'on_hold'),
  extraItem('d4', 'c4', 'biomodel', 1, 'completed'),
  extraItem('d5', 'c4', 'biomodel', 2, 'in_design'),
  extraItem('d6', 'c4', 'conversion', 3, 'submitted'),
  extraItem('d7', 'c5', 'biomodel', 1, 'submitted'),
];

export const MOCK_ZERO_CHARGE_REASONS: readonly ZeroChargeReason[] = [
  { code: 'mock-redo', label: 'Redo / Remake (mock)', description: null, active: true },
  { code: 'mock-courtesy', label: 'Promotional Courtesy (mock)', description: null, active: true },
  { code: 'mock-voucher', label: 'Voucher Full Coverage (mock)', description: null, active: true },
];

/** Verbatim from the package fixture temporary_hold_reasons_demo_mock.json. */
export const MOCK_HOLD_REASONS: readonly HoldReasonOption[] = [
  {
    code: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
    label: 'Demo only — Awaiting customer input',
    holdType: 'customer',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_CUSTOMER_FILE_REUPLOAD',
    label: 'Demo only — Awaiting file resubmission',
    holdType: 'customer',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_INTERNAL_REVIEW',
    label: 'Demo only — Internal review',
    holdType: 'internal',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_INTERNAL_CAPACITY',
    label: 'Demo only — Internal capacity',
    holdType: 'internal',
    isTemporary: true,
  },
];

/** Illustrative manual moves per current status (not the real workflow, R03). */
export const MOCK_TRANSITIONS: Readonly<Record<string, readonly Omit<AvailableTransition, 'transitionId'>[]>> = {
  submitted: [
    { fromCode: 'submitted', toCode: 'in_design', label: 'Start design' },
    { fromCode: 'submitted', toCode: 'on_hold', label: 'Put on hold' },
  ],
  in_design: [
    { fromCode: 'in_design', toCode: 'in_production', label: 'Send to production' },
    { fromCode: 'in_design', toCode: 'on_hold', label: 'Put on hold' },
  ],
  in_production: [{ fromCode: 'in_production', toCode: 'completed', label: 'Complete' }],
  on_hold: [{ fromCode: 'on_hold', toCode: 'in_design', label: 'Resume' }],
  completed: [],
};
