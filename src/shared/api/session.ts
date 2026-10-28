/**
 * Session context (IAM v0.9.7, tenant spec v1.1 section D).
 *
 * The app's own shape. With the real API it is built once from
 * `GET /api/v1/auth/me` (canonical contract, Q-B20, A30) by
 * `sessionContextFromMe`; the mock builds it from fixtures. Capability codes
 * are the PROPOSED codes from ROLE_CAPABILITY_MATRIX.csv (CANDIDATE_UNVERIFIED,
 * D-53) until Hesham confirms the codes `/auth/me` returns.
 *
 * Capabilities are for display only: they hide or disable actions. The
 * server decides every request, and its 401/403 is always shown. The
 * tenant comes only from this context and is never sent back in a request.
 */

import type { AuthMeResponse } from './types';

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

/** Read-only tenant shown as a badge; never sent in a request. */
export interface ActiveTenant {
  /** `tenantSlug` from /auth/me (no display label exists in the contract). */
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

/**
 * Maps the contract's AuthMeResponse. The contract has no display name, so
 * the email stands in for it; `isPendingAccess` is the Pending Access state.
 */
export function sessionContextFromMe(me: AuthMeResponse): SessionContext {
  const pending = me.isPendingAccess;
  return {
    user: { id: me.userUuid ?? '', displayName: me.email ?? 'Signed-in user' },
    accessStatus: pending ? 'PENDING' : 'AUTHORIZED',
    activeTenant: !pending && me.tenantSlug ? { label: me.tenantSlug } : null,
    roles: [...me.roleCodes],
    capabilities: pending ? [] : [...me.capabilities],
    tenantSwitchingEnabled: false,
  };
}

/** Display-only check; the server still decides. */
export function can(context: SessionContext | null, capability: CapabilityCode): boolean {
  return context?.accessStatus === 'AUTHORIZED' && context.capabilities.includes(capability);
}
