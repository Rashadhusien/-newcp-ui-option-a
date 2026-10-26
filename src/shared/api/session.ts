/**
 * Session context (IAM v0.9.7, tenant spec v1.1 section D).
 *
 * The shape follows the spec's illustrative `GET /api/v1/session/context`
 * response. The endpoint is NOT in the reference OpenAPI (Q-B20), so only
 * the mock serves it (D-51). Capability codes are the PROPOSED codes from
 * ROLE_CAPABILITY_MATRIX.csv (CANDIDATE_UNVERIFIED, D-53).
 *
 * Capabilities are for display only: they hide or disable actions. The
 * server decides every request, and its 401/403 is always shown. The
 * tenant comes only from this context and is never sent back in a request.
 */

export type AccessStatus = 'AUTHORIZED' | 'PENDING';

/** Proposed capability codes (ROLE_CAPABILITY_MATRIX.csv), used by the demo screens. */
export type CapabilityCode =
  | 'orders.read'
  | 'service.read'
  | 'service.create'
  | 'service.update'
  | 'service.status.transition'
  | 'service.on_hold'
  | 'service.price.override'
  | 'service.billing.bill_to.edit'
  | 'service.billing.is_billable.edit'
  | 'service.zero_charge_reason.edit'
  | 'reports.view_all'
  | 'reports.export';

export interface ActiveTenant {
  id: number;
  label: string;
}

export interface SessionContext {
  user: { id: string; displayName: string };
  accessStatus: AccessStatus;
  /** null whenever access is PENDING; never chosen by the UI. */
  activeTenant: ActiveTenant | null;
  roles: string[];
  capabilities: string[];
  tenantSwitchingEnabled: boolean;
}

/** Display-only check; the server still decides. */
export function can(context: SessionContext | null, capability: CapabilityCode): boolean {
  return context?.accessStatus === 'AUTHORIZED' && context.capabilities.includes(capability);
}
