/**
 * Mock authorization, standing in for the server's IAM + Casbin checks
 * (IAM v0.9.7) so the denied states can be shown on the mock:
 * - no session -> 401 AUTHENTICATION_REQUIRED;
 * - PENDING -> 403 ACCESS_NOT_ASSIGNED on every business call;
 * - a capability the role lacks -> 403 PERMISSION_DENIED.
 * Capabilities per call follow ROLE_CAPABILITY_MATRIX.csv (PROPOSED codes,
 * D-53); a PATCH needs the capability of every field it changes. The real
 * server decides on its own; the UI never relies on these checks.
 */

import { ApiError, type CapabilityCode, type PatchServiceItem, type SessionContext } from '@/shared/api';
import type { MockServiceApi } from './mockServiceApi';

function denied(status: number, code: string, message: string): ApiError {
  return new ApiError(status, { code, message, requestId: 'mock-request' });
}

/** The capabilities a PATCH needs: one per kind of field it changes. */
export function capabilitiesForPatch(patch: PatchServiceItem): CapabilityCode[] {
  const needed = new Set<CapabilityCode>();
  for (const key of Object.keys(patch) as (keyof PatchServiceItem)[]) {
    if (patch[key] === undefined) continue;
    if (key === 'unitPrice') needed.add('service.price.override');
    else if (key === 'billedToContactUuid') needed.add('service.billing.bill_to.edit');
    else if (key === 'isBillable') needed.add('service.billing.is_billable.edit');
    else if (key === 'zeroChargeReasonCode' || key === 'zeroChargeNote') needed.add('service.zero_charge_reason.edit');
    else needed.add('service.update');
  }
  return [...needed];
}

/** The error the server would answer for this context, or null when the call is allowed. */
export function mockAccessError(context: SessionContext | null, needed: readonly CapabilityCode[]): ApiError | null {
  if (!context) return denied(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
  if (context.accessStatus !== 'AUTHORIZED') {
    return denied(403, 'ACCESS_NOT_ASSIGNED', 'Your account has no access assigned yet. Ask an administrator.');
  }
  if (needed.some((capability) => !context.capabilities.includes(capability))) {
    return denied(403, 'PERMISSION_DENIED', 'You do not have access to this action.');
  }
  return null;
}

export function withMockAccess(api: MockServiceApi, currentContext: () => SessionContext | null): MockServiceApi {
  function check<T>(needed: readonly CapabilityCode[], run: () => Promise<T>): Promise<T> {
    const error = mockAccessError(currentContext(), needed);
    return error ? Promise.reject(error) : run();
  }
  const read: CapabilityCode[] = ['service.read'];

  return {
    catalog: (...args) => check(read, () => api.catalog(...args)),
    formSchema: (...args) => check(read, () => api.formSchema(...args)),
    holdReasons: (...args) => check(read, () => api.holdReasons(...args)),
    eligibleBilledParties: (...args) => check(read, () => api.eligibleBilledParties(...args)),
    orderItems: (...args) => check(read, () => api.orderItems(...args)),
    item: (...args) => check(read, () => api.item(...args)),
    availableTransitions: (...args) => check(read, () => api.availableTransitions(...args)),
    history: (...args) => check(read, () => api.history(...args)),
    zeroChargeReasons: () => check(read, () => api.zeroChargeReasons()),
    create: (orderUuid, item, ...rest) => {
      // Creating covers the answers and plain staff fields; money and payer fields need their own capability.
      const staff: PatchServiceItem = { ...item };
      delete staff.answers;
      const needed = capabilitiesForPatch(staff).filter((code) => code !== 'service.update');
      return check(['service.create', ...needed], () => api.create(orderUuid, item, ...rest));
    },
    edit: (uuid, patch, ...rest) => check(capabilitiesForPatch(patch), () => api.edit(uuid, patch, ...rest)),
    transition: (uuid, request, ...rest) =>
      check(
        request.holdType === undefined
          ? ['service.status.transition']
          : ['service.status.transition', 'service.on_hold'],
        () => api.transition(uuid, request, ...rest),
      ),
  };
}
