/**
 * Mock session contexts for the five IAM access families plus a pending
 * user (IAM v0.9.7). Synthetic: invented names, synthetic UUIDs, and a
 * tenant label that is clearly mock, never a real tenant value.
 *
 * Capabilities follow ROLE_CAPABILITY_MATRIX.csv (PROPOSED codes, D-53):
 * OPS is scoped to Models and Conversion, which is the whole demo scope, so
 * its flags equal CS's here; FINANCE and QC reach orders and services
 * through reports only (G11 open), so they get no service capabilities.
 * Export flags are listed but no export control exists (D-54).
 */

import type { CapabilityCode, SessionContext } from '@/shared/api';

export type MockIdentity = 'CS' | 'OPS' | 'ADMIN' | 'FINANCE' | 'QC' | 'PENDING';

export const MOCK_IDENTITIES: readonly MockIdentity[] = ['CS', 'OPS', 'ADMIN', 'FINANCE', 'QC', 'PENDING'];

const MOCK_TENANT = { id: 1, label: 'Demo tenant (mock)' };

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

const CAPABILITIES: Record<Exclude<MockIdentity, 'PENDING'>, readonly CapabilityCode[]> = {
  CS: OPERATIONAL,
  OPS: OPERATIONAL,
  ADMIN: [...OPERATIONAL, 'reports.export'],
  FINANCE: ['reports.view_all', 'reports.export'],
  QC: ['reports.view_all', 'reports.export'],
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
  FINANCE: 'FINANCE (reports only)',
  QC: 'QC (reports only)',
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
