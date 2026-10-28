/**
 * Contract types for the New CP service-instance API.
 *
 * Source: the backend's canonical contract docs/openapi/newcp.openapi.yaml
 * (1.0.0, NOT_FINAL; D-79), `components.schemas`. It replaces the package
 * reference (Q-B15, D-40). Names and optionality follow the YAML exactly;
 * nothing here is invented. IAM admin schemas are left out: the UI has no
 * IAM screen.
 * When the contract changes, change this file first.
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

/** Q-B11: data types of V3 catalog.field_types; radio vs select is presentation only. */
export type CanonicalFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'single_select'
  | 'multi_select'
  | 'file'
  | 'tooth_chart';

/** Known V3 validation keys; the backend may send more. */
export interface FormValidation {
  min?: number;
  max?: number;
  max_length?: number;
  pattern?: string;
  [key: string]: unknown;
}

/** Exactly one of `field` / `attribute`; `value` vs `values` depends on `op`. */
export interface FieldConditionLeaf {
  field?: string;
  attribute?: string;
  op: 'eq' | 'ne' | 'in' | 'not_in' | 'is_set' | 'is_not_set' | 'gt' | 'gte' | 'lt' | 'lte';
  value?: unknown;
  values?: unknown[];
}

export interface FieldConditionAll {
  all: FieldCondition[];
}

export interface FieldConditionAny {
  any: FieldCondition[];
}

export interface FieldConditionNot {
  not: FieldCondition;
}

export type FieldCondition = FieldConditionLeaf | FieldConditionAll | FieldConditionAny | FieldConditionNot;

/** Q-B12: server-authoritative rule; the demo keeps local rules instead of evaluating these (D-46). */
export interface ConditionalFieldRule {
  ruleKind: 'visible' | 'required' | 'options';
  condition: FieldCondition;
  optionCodes?: string[];
  sortOrder?: number;
  active?: boolean;
}

export interface FormField {
  uuid: string;
  code: string;
  label: string;
  type: CanonicalFieldType;
  required: boolean;
  defaultValue?: string | null;
  validation?: FormValidation;
  conditionalRules?: ConditionalFieldRule[];
  options: FormOption[];
}

export interface FormDefinition {
  service: CatalogService;
  fields: FormField[];
  /** Whether tenant runtime mapping is verified. */
  evidence?: string;
}

/**
 * One answer (Q-B16, `additionalProperties: false`): choice fields send
 * `optionCodes` (single select: 0 or 1 item; cleared: []), every other field
 * sends `value` (text, number, boolean, or an ISO date `YYYY-MM-DD`); never
 * both. All conversion lives in the form logic.
 */
export interface FormAnswer {
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
  /** Payer for THIS item only; omitted = order default copied once (F07). MOCK only (D-44). */
  billedToContactUuid?: string;
  /** Independent billability (Q-B14). */
  isBillable?: boolean;
  /** Decimal string; authorized override of the contract price (Q-B10). */
  unitPrice?: string;
  zeroChargeReasonCode?: string;
  zeroChargeNote?: string;
  /** > 0, up to 3 decimals; the demo defaults to 1 (Q-B13). */
  quantity?: number;
}

export type HoldType = 'customer' | 'internal';

/**
 * PATCH body (at least one property), sent with If-Match. Never includes
 * billedPartyOrigin or tenantId, and never a status or hold: those change
 * only through transitions.
 */
export interface PatchServiceItem {
  answers?: FormAnswer[];
  isRedo?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  pendingReason?: string;
  billedToContactUuid?: string;
  isBillable?: boolean;
  unitPrice?: string;
  zeroChargeReasonCode?: string | null;
  /** Up to 255 characters. */
  zeroChargeNote?: string;
  quantity?: number;
}

export type BilledPartyOrigin =
  | 'legacy_explicit'
  | 'order_default'
  | 'manual_resolution'
  | 'user_selected'
  | 'unresolved_legacy';

/** The 24 required properties are guaranteed by the canonical contract (D-79). */
export interface ServiceItem {
  uuid: string;
  orderUuid: string;
  sellableItemUuid: string;
  lineNumber: number;
  /** Status value from the workflow; mapped for display by shared/status. */
  status: string;
  isRedo: boolean;
  /** Parent item this line remakes. */
  redoOfItemUuid?: string | null;
  /** true locks price, quantity, currency and payer (the server answers 422). */
  isInvoiced: boolean;
  currencyCode: string;
  /** Money amounts are decimal strings, not floating point. */
  unitPrice: string;
  /** Sum of answer surcharges (server trigger). */
  fieldsAmount: string;
  discountAmount: string;
  voucherAmount: string;
  /** unitPrice x quantity + fieldsAmount - discountAmount - voucherAmount. */
  lineTotal: string;
  answers: FormAnswer[];
  serviceNotes?: string;
  billedToContactUuid: string;
  billedPartyOrigin: BilledPartyOrigin;
  /** Server hints only; the backend always enforces the rules. */
  canEditBilledParty: boolean;
  isBillable: boolean;
  canEditBillability: boolean;
  quantity: number;
  /** Reason the item is pending information. */
  pendingReason?: string | null;
  /** Active hold while the status is on_hold. */
  holdType?: HoldType | null;
  holdReasonCode?: string | null;
  zeroChargeReasonCode?: string | null;
  zeroChargeNote?: string | null;
  /** Convenience copy; the ETag response header is authoritative (Q-B8). */
  etag: string;
  canEditPrice: boolean;
  /** ISO date-times. */
  createdAt: string;
  updatedAt: string;
}

/** A response together with the aggregate version from its ETag header (Q-B8). */
export interface WithVersion<T> {
  data: T;
  etag: string;
}

export interface AvailableTransition {
  transitionId: number;
  fromCode: string;
  toCode: string;
  label?: string;
  requiresCapability?: string;
  guard?: Record<string, unknown>;
}

/** Sent with If-Match. A move into `on_hold` needs holdType + holdReasonCode in this same request (Q-B9). */
export interface TransitionRequest {
  transitionId: number;
  comment?: string;
  holdType?: HoldType;
  holdReasonCode?: string;
}

export interface TransitionResult {
  serviceItemUuid: string;
  fromCode: string;
  toCode: string;
  /** ISO date-time. */
  changedAt: string;
  actorUserUuid?: string;
  holdType?: HoldType;
  holdReasonCode?: string;
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

/** Hold reason from GET /catalog/hold-reasons; demo values are synthetic (`isTemporary`, "Demo only"). */
export interface HoldReasonOption {
  code: string;
  label: string;
  isTemporary: boolean;
  holdType?: HoldType;
  active?: boolean;
}

/** Zero-charge reason from GET /lookups/zero-charge-reasons (Q-B17). */
export interface ZeroChargeReason {
  code: string;
  label: string;
  description?: string | null;
  active: boolean;
}

export interface AuthLoginRequest {
  /** Google ID token; sent to POST /auth/login only. */
  idToken: string;
}

export interface AuthorizedLoginResponse {
  accessStatus: 'AUTHORIZED';
  /** Opaque New CP session token (Bearer). */
  token: string;
  expiresAt: string;
}

/** No tenant role yet: no session and no token are issued. */
export interface PendingAccessLoginResponse {
  accessStatus: 'PENDING_ACCESS';
}

export type LoginResponse = AuthorizedLoginResponse | PendingAccessLoginResponse;

/** GET /auth/me: the backend is authoritative for tenant, roles and capabilities. */
export interface AuthMeResponse {
  email: string | null;
  userUuid: string | null;
  tenantSlug: string | null;
  roleCodes: string[];
  capabilities: string[];
  isPendingAccess: boolean;
}

/** Auth endpoints wrap the Problem (other endpoints send it flat, Q-B22). */
export interface AuthErrorResponse {
  error: Problem;
}
