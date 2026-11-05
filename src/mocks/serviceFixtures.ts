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
 * - Zero-charge reasons: served by the mock for GET /lookups/zero-charge-reasons
 *   (Q-B17); the labels are the contract's own examples, codes `mock-*`.
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
    code: 'biomodel_other_services',
    name: 'Biomodel',
    itemKind: 'service',
    serviceFamily: 'biomodel',
    isDigital: false,
    workflowCode: null,
  },
  {
    uuid: MOCK_CONVERSION_UUID,
    code: 'legacy_price_convcostbsbbasicfull',
    name: 'Conversion',
    itemKind: 'service',
    serviceFamily: 'conversion',
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

/** Fixed synthetic timestamp for every fixture item. */
const MOCK_CREATED_AT = '2026-10-20T09:00:00.000Z';

type ItemOverrides = Partial<ServiceItem> & Pick<ServiceItem, 'uuid' | 'orderUuid' | 'sellableItemUuid' | 'lineNumber' | 'status'>;

/**
 * A complete item (the 24 fields the canonical contract guarantees, D-79):
 * contract price, quantity 1, no surcharge, discount or voucher, payer the
 * order default. The mock replaces `etag` with the live revision.
 */
function mockItem(overrides: ItemOverrides): ServiceItem {
  return {
    quantity: 1,
    isBillable: true,
    canEditBillability: true,
    isRedo: false,
    redoOfItemUuid: null,
    isInvoiced: false,
    currencyCode: MOCK_CURRENCY,
    unitPrice: MOCK_CONTRACT_UNIT_PRICE,
    fieldsAmount: '0.00',
    discountAmount: '0.00',
    voucherAmount: '0.00',
    lineTotal: MOCK_CONTRACT_UNIT_PRICE,
    canEditPrice: true,
    answers: [],
    billedToContactUuid: MOCK_DOCTOR_UUID,
    billedPartyOrigin: 'order_default',
    canEditBilledParty: true,
    pendingReason: null,
    holdType: null,
    holdReasonCode: null,
    etag: '"rev-1"',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    ...overrides,
  };
}

/** A19: services of the other synthetic orders (orderFixtures), so the orders list has more than one order. */
function extraItem(
  uuidSuffix: string,
  orderSuffix: string,
  service: 'biomodel' | 'conversion',
  lineNumber: number,
  status: string,
  more: Partial<ServiceItem> = {},
): ServiceItem {
  return mockItem({
    uuid: `00000000-0000-0000-0000-0000000000${uuidSuffix}`,
    orderUuid: `00000000-0000-0000-0000-0000000000${orderSuffix}`,
    sellableItemUuid: service === 'biomodel' ? MOCK_BIOMODEL_UUID : MOCK_CONVERSION_UUID,
    lineNumber,
    status,
    ...more,
  });
}

/**
 * One order with two same-type Biomodel items (different payers, as in the
 * F07 example `sameTypeInstancesDifferentPayers`; the second one's clerk may
 * not change price) and one invoiced Conversion item, which is financially
 * locked. The held and pending items carry their details (Q-B18), with a
 * synthetic "Demo only" hold reason and an invented pending reason.
 */
export const MOCK_SERVICE_ITEMS: readonly ServiceItem[] = [
  mockItem({
    uuid: '00000000-0000-0000-0000-000000000014',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_BIOMODEL_UUID,
    lineNumber: 1,
    status: 'submitted',
  }),
  mockItem({
    uuid: '00000000-0000-0000-0000-000000000015',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_BIOMODEL_UUID,
    lineNumber: 2,
    status: 'in_design',
    canEditPrice: false,
    billedToContactUuid: MOCK_SCAN_CENTER_UUID,
    billedPartyOrigin: 'user_selected',
  }),
  mockItem({
    uuid: '00000000-0000-0000-0000-000000000016',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_CONVERSION_UUID,
    lineNumber: 3,
    status: 'completed',
    canEditBillability: false,
    isInvoiced: true,
    canEditPrice: false,
    canEditBilledParty: false,
  }),
  extraItem('d1', 'c2', 'biomodel', 1, 'in_production'),
  extraItem('d2', 'c2', 'conversion', 2, 'pending_information', {
    pendingReason: 'Waiting for the scan files (mock)',
  }),
  extraItem('d3', 'c3', 'conversion', 1, 'on_hold', {
    holdType: 'customer',
    holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
  }),
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
