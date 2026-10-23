/**
 * Contract types for the New CP service-instance API.
 *
 * Source: docs/openapi/newcp-v1.openapi.yaml (Bishoy, v1.0.0, NOT_FINAL),
 * `components.schemas`. Names and optionality follow the YAML exactly;
 * nothing here is invented. When the contract changes, change this file
 * first.
 */

/** Error body for 400/422 (and, by convention, other 4xx/5xx when present). */
export interface Problem {
  code: string;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export interface FormOption {
  code: string;
  label: string;
  active?: boolean;
}

export interface CatalogService {
  uuid: string;
  code: string;
  name: string;
  itemKind: 'service';
  isDigital?: boolean;
  workflowCode?: string | null;
}

export interface FormField {
  uuid: string;
  code: string;
  label: string;
  type?: string;
  required: boolean;
  defaultValue?: string | null;
  validation?: Record<string, unknown>;
  conditionalRules?: Record<string, unknown>[];
  options: FormOption[];
}

export interface FormDefinition {
  service: CatalogService;
  fields: FormField[];
  /** Whether tenant runtime mapping is verified. */
  evidence?: string;
}

/**
 * One answer (v1 model): choice fields send `optionCodes` (exactly one code
 * for single-select, several for multi-select, `[]` when cleared); free-form
 * fields send `value` (text or ISO date as a string, number, or boolean).
 */
export interface FormAnswer {
  /** Stable machine code of the form question (catalog.fields.code). */
  fieldCode: string;
  value?: string | number | boolean;
  optionCodes?: string[];
}

export interface CreateServiceItem {
  sellableItemUuid: string;
  answers: FormAnswer[];
  isRedo?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  /** Payer for THIS item only; omitted = order default copied once (F07). */
  billedToContactUuid?: string;
  /** Strictly positive; default 1 (decimals: Q-B13). */
  quantity?: number;
  /** Default true; false = unbilled internal remake or courtesy (meaning: Q-B14). */
  isBillable?: boolean;
  /** Required by the server when the line total is zero (code from /lookups/zero-charge-reasons). */
  zeroChargeReasonCode?: string;
  zeroChargeNote?: string;
}

export type HoldType = 'customer' | 'internal';

/**
 * PATCH body (at least one property). Never includes billedPartyOrigin or
 * tenantId, and never a status: status changes go through transitions.
 */
export interface PatchServiceItem {
  answers?: FormAnswer[];
  isRedo?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  pendingReason?: string;
  billedToContactUuid?: string;
  quantity?: number;
  isBillable?: boolean;
  /** Only meaningful while the item is on hold (flow: Q-B9). */
  holdType?: HoldType;
  /** Code from /lookups/hold-reasons. */
  holdReasonCode?: string;
  zeroChargeReasonCode?: string;
  zeroChargeNote?: string;
}

export type BilledPartyOrigin =
  | 'legacy_explicit'
  | 'order_default'
  | 'manual_resolution'
  | 'user_selected'
  | 'unresolved_legacy';

export interface ServiceItem {
  uuid: string;
  orderUuid: string;
  sellableItemUuid: string;
  lineNumber: number;
  quantity: number;
  /** Status value from the workflow; mapped for display by shared/status. */
  status: string;
  isBillable: boolean;
  isRedo?: boolean;
  isInvoiced?: boolean;
  currencyCode?: string;
  /** Money amounts are decimal strings, not floating point. */
  unitPrice?: string;
  lineTotal?: string;
  fieldsAmount?: string;
  discountAmount?: string;
  voucherAmount?: string;
  answers: FormAnswer[];
  serviceNotes?: string;
  billedToContactUuid: string;
  billedPartyOrigin: BilledPartyOrigin;
  /** Server hint only; the backend always enforces the rule. */
  canEditBilledParty?: boolean;
  /** Item this line remakes. */
  redoOfItemUuid?: string | null;
  pendingReason?: string | null;
  holdType?: HoldType | null;
  holdReasonCode?: string | null;
  zeroChargeReasonCode?: string | null;
  zeroChargeNote?: string | null;
  /** ISO date-time. */
  createdAt: string;
  updatedAt: string;
}

export interface AvailableTransition {
  transitionId: number;
  fromCode: string;
  toCode: string;
  label?: string;
  requiresCapability?: string;
  guard?: Record<string, unknown>;
}

export interface TransitionRequest {
  transitionId: number;
  comment?: string;
}

export interface TransitionResult {
  serviceItemUuid: string;
  fromCode: string;
  toCode: string;
  /** ISO date-time. */
  changedAt: string;
  actorUserUuid?: string;
}

/** Every property is optional in the contract. */
export interface HistoryEvent {
  fromCode?: string;
  toCode?: string;
  actorUserUuid?: string;
  occurredAt?: string;
  comment?: string;
}

export interface BilledPartyChoice {
  contactUuid: string;
  role: 'doctor' | 'scanning_center';
  /** Approved display label; no PHI. */
  label: string;
}

export interface ZeroChargeReason {
  code: string;
  label: string;
  description?: string | null;
  active: boolean;
}

export interface HoldReason {
  code: string;
  label: string;
  holdType: HoldType;
  active: boolean;
}
