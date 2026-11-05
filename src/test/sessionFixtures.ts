/**
 * TEST ONLY (A38: the context always comes from `GET /auth/me`). Session contexts for the five IAM access families plus a pending
 * user (IAM v0.9.7). Synthetic: invented names, synthetic UUIDs, and a
 * tenant label that is clearly mock, never a real tenant value.
 *
 * Capabilities follow ROLE_CAPABILITY_MATRIX.csv (PROPOSED codes, D-53):
 * OPS is scoped to Models and Conversion, which is the whole demo scope, so
 * its flags equal CS's here. FINANCE and QC (A35, D-87): G11 confirmed that
 * both see all tenant-authorized orders and services, so they get
 * `orders.read` and `service.read` although the unchanged matrix still says
 * "REPORT" there (demo assumption, Q-B35; `/auth/me` decides for real).
 * FINANCE keeps the matrix's financial edits (price, Billable, Bill To,
 * zero-charge reason); QC has no edit code (read-only; audit actions are not
 * implemented). Export flags are listed but no export control exists (D-54).
 */

import type { CapabilityCode, SessionContext } from '@/shared/api';
import type { SessionValue } from '@/shared/hooks/useSession';

export type MockIdentity = 'CS' | 'OPS' | 'ADMIN' | 'FINANCE' | 'QC' | 'PENDING';

export const MOCK_IDENTITIES: readonly MockIdentity[] = ['CS', 'OPS', 'ADMIN', 'FINANCE', 'QC', 'PENDING'];

const MOCK_TENANT = { label: 'Demo tenant (mock)' };

const OPERATIONAL: readonly CapabilityCode[] = [
  'orders.read',
  'service.read',
  'service.create',
  'service.update',
  'service.status.transition',
  'service.on_hold',
  'service.price.override',
  'service.billing.bill_to.edit',
  'service.billing.is_billable.edit',
  'service.zero_charge_reason.edit',
  'reports.view_all',
];

const ADMIN_CAPABILITIES: readonly CapabilityCode[] = [
  ...OPERATIONAL,
  'reports.export',
  'iam.users.read',
  'iam.roles.read',
  'iam.assign_role',
];

const CAPABILITIES: Record<Exclude<MockIdentity, 'PENDING'>, readonly CapabilityCode[]> = {
  CS: OPERATIONAL,
  OPS: OPERATIONAL,
  ADMIN: ADMIN_CAPABILITIES,
  FINANCE: [
    'orders.read',
    'service.read',
    'service.price.override',
    'service.billing.bill_to.edit',
    'service.billing.is_billable.edit',
    'service.zero_charge_reason.edit',
    'reports.view_all',
    'reports.export',
  ],
  QC: ['orders.read', 'service.read', 'reports.view_all', 'reports.export'],
};

const USER_NAMES: Record<MockIdentity, string> = {
  CS: 'Demo CS (mock)',
  OPS: 'Demo Ops (mock)',
  ADMIN: 'Demo Admin (mock)',
  FINANCE: 'Demo Finance (mock)',
  QC: 'Demo QC (mock)',
  PENDING: 'Demo Pending (mock)',
};

export const MOCK_IDENTITY_LABEL: Record<MockIdentity, string> = {
  CS: 'CS (customer service)',
  OPS: 'OPS (Models and Conversion)',
  ADMIN: 'ADMIN',
  FINANCE: 'FINANCE (view, financial edits)',
  QC: 'QC (view only)',
  PENDING: 'Pending access (no role)',
};

export function isMockIdentity(value: unknown): value is MockIdentity {
  return typeof value === 'string' && (MOCK_IDENTITIES as readonly string[]).includes(value);
}

export function mockSessionContext(identity: MockIdentity): SessionContext {
  const user = {
    id: `00000000-0000-4000-a000-${String(MOCK_IDENTITIES.indexOf(identity) + 1).padStart(12, '0')}`,
    displayName: USER_NAMES[identity],
  };
  if (identity === 'PENDING') {
    return { user, accessStatus: 'PENDING', activeTenant: null, roles: [], capabilities: [], tenantSwitchingEnabled: false };
  }
  return {
    user,
    accessStatus: 'AUTHORIZED',
    activeTenant: { ...MOCK_TENANT },
    roles: [identity],
    capabilities: [...CAPABILITIES[identity]],
    tenantSwitchingEnabled: false,
  };
}

/** A ready session for `SessionContextValue.Provider` in page tests. */
export function readySession(identity: MockIdentity): SessionValue {
  const context = mockSessionContext(identity);
  return {
    state: { status: 'ready', context },
    context,
    refresh: () => undefined,
    signInWithSession: () => undefined,
    signOut: () => undefined,
  };
}
