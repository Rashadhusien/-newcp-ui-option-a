/**
 * Contract types for the New CP service-instance API.
 *
 * Source: docs/newcp-ai/payload/references/f07/integration/newcp-demo-f07.openapi.yaml
 * (v0.9.0-draft, PROVISIONAL), `components.schemas`. Names and optionality
 * follow the YAML exactly; nothing here is invented. When the contract
 * changes, change this file first.
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

/** Exactly one value carrier per field, except supported multi-select. */
export interface FormAnswer {
  fieldCode: string;
  optionCode?: string;
  optionCodes?: string[];
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  /** ISO date (yyyy-mm-dd). */
  valueDate?: string;
}

export interface CreateServiceItem {
  sellableItemUuid: string;
  answers: FormAnswer[];
  isRedo?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  /** Payer for THIS item only; omitted = order default copied once (F07). */
  billedToContactUuid?: string;
}

/**
 * PATCH body. Follows the OpenAPI schema, which also allows `pendingReason`
 * and `redoOfItemUuid` (the package's typed client omits them, Q-B4).
 * Never includes billedPartyOrigin or tenantId.
 */
export interface PatchServiceItem {
  answers?: FormAnswer[];
  isRedo?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  pendingReason?: string;
  billedToContactUuid?: string;
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
  lineNumber?: number;
  /** Status value from the workflow; mapped for display by shared/status. */
  status: string;
  isRedo?: boolean;
  isInvoiced?: boolean;
  currencyCode?: string;
  /** Decimal string, not floating point. */
  unitPrice?: string;
  lineTotal?: string;
  answers: FormAnswer[];
  serviceNotes?: string;
  billedToContactUuid: string;
  billedPartyOrigin: BilledPartyOrigin;
  /** Server hint only; the backend always enforces the rule. */
  canEditBilledParty?: boolean;
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
