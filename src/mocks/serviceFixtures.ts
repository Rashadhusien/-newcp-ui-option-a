/**
 * SYNTHETIC fixtures for the service-instance mock. No real identifiers or
 * V3 data. Order, contact and payer UUIDs are the package's F07 synthetic
 * examples (references/f07/fixtures/f07_synthetic_contract_examples.json);
 * the catalog UUIDs and codes are invented placeholders until R01.
 *
 * Status values use the V3 order-item summary vocabulary (V3 docs,
 * `orders.order_items.status`, D-17). Whether the API sends summary or
 * workflow values is Q-B1; the mock transitions are illustrative, not the
 * real workflow (R03). No prices are invented: money fields stay empty.
 * Lookup codes are `mock-*`; the zero-charge labels are the examples given
 * in the v1 contract's `ZeroChargeReason.label` description.
 */

import type {
  AvailableTransition,
  BilledPartyChoice,
  CatalogService,
  HoldReason,
  ServiceItem,
  ZeroChargeReason,
} from '@/shared/api';

export const MOCK_ORDER_UUID = '00000000-0000-0000-0000-000000000001';
export const MOCK_DOCTOR_UUID = '00000000-0000-0000-0000-000000000011';
export const MOCK_SCAN_CENTER_UUID = '00000000-0000-0000-0000-000000000012';

export const MOCK_CATALOG: readonly CatalogService[] = [
  {
    uuid: '00000000-0000-0000-0000-000000000003',
    code: 'mock-biomodel',
    name: 'Biomodel',
    itemKind: 'service',
    isDigital: false,
    workflowCode: null,
  },
  {
    uuid: '00000000-0000-0000-0000-000000000004',
    code: 'mock-conversion',
    name: 'Conversion',
    itemKind: 'service',
    isDigital: true,
    workflowCode: null,
  },
];

export const MOCK_BIOMODEL_UUID = '00000000-0000-0000-0000-000000000003';
export const MOCK_CONVERSION_UUID = '00000000-0000-0000-0000-000000000004';

export const MOCK_BILLED_PARTIES: readonly BilledPartyChoice[] = [
  { contactUuid: MOCK_DOCTOR_UUID, role: 'doctor', label: 'Synthetic Doctor' },
  { contactUuid: MOCK_SCAN_CENTER_UUID, role: 'scanning_center', label: 'Synthetic Scanning Center' },
];

/**
 * One order with two same-type Biomodel items (different payers, as in the
 * F07 example `sameTypeInstancesDifferentPayers`) and one invoiced
 * Conversion item, whose payer can no longer change.
 */
const CREATED_AT = '2026-10-20T09:00:00.000Z';

export const MOCK_SERVICE_ITEMS: readonly ServiceItem[] = [
  {
    uuid: '00000000-0000-0000-0000-000000000014',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_BIOMODEL_UUID,
    lineNumber: 1,
    quantity: 1,
    isBillable: true,
    status: 'submitted',
    isRedo: false,
    isInvoiced: false,
    answers: [],
    billedToContactUuid: MOCK_DOCTOR_UUID,
    billedPartyOrigin: 'order_default',
    canEditBilledParty: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    uuid: '00000000-0000-0000-0000-000000000015',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_BIOMODEL_UUID,
    lineNumber: 2,
    quantity: 1,
    isBillable: true,
    status: 'in_design',
    isRedo: false,
    isInvoiced: false,
    answers: [],
    billedToContactUuid: MOCK_SCAN_CENTER_UUID,
    billedPartyOrigin: 'user_selected',
    canEditBilledParty: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    uuid: '00000000-0000-0000-0000-000000000016',
    orderUuid: MOCK_ORDER_UUID,
    sellableItemUuid: MOCK_CONVERSION_UUID,
    lineNumber: 3,
    quantity: 1,
    isBillable: true,
    status: 'completed',
    isRedo: false,
    isInvoiced: true,
    answers: [],
    billedToContactUuid: MOCK_DOCTOR_UUID,
    billedPartyOrigin: 'order_default',
    canEditBilledParty: false,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
];

export const MOCK_ZERO_CHARGE_REASONS: readonly ZeroChargeReason[] = [
  { code: 'mock-redo', label: 'Redo / Remake', description: null, active: true },
  { code: 'mock-courtesy', label: 'Promotional Courtesy', description: null, active: true },
  { code: 'mock-voucher', label: 'Voucher Full Coverage', description: null, active: true },
];

export const MOCK_HOLD_REASONS: readonly HoldReason[] = [
  { code: 'mock-hold-client-files', label: 'Waiting for client files (mock)', holdType: 'customer', active: true },
  { code: 'mock-hold-client-approval', label: 'Waiting for client approval (mock)', holdType: 'customer', active: true },
  { code: 'mock-hold-internal-review', label: 'Internal review (mock)', holdType: 'internal', active: true },
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
