/**
 * Mock IAM adapter: contract-shaped data, synthetic people only.
 * It answers like the server would for the signed-in mock identity: the
 * read calls need the matching capability, the assignment needs
 * `iam.assign_role` and never hands out ADMIN (no ADMIN-to-ADMIN delegation).
 * State lives in memory; a reload starts from the fixtures again.
 */

import { ApiError, type IamClient, type IamRoleSummary, type IamUserSummary } from '@/shared/api';
import { mockSessionContext } from '@/mocks/sessionFixtures';
import { mockIdentity } from '@/shared/lib/session';

const ROLES: IamRoleSummary[] = [
  {
    roleId: 1,
    code: 'ADMIN',
    name: 'Administrator',
    isSystem: true,
    capabilities: ['iam.users.read', 'iam.roles.read', 'iam.assign_role', 'reports.view_all', 'reports.export'],
  },
  {
    roleId: 2,
    code: 'CS',
    name: 'Customer service',
    isSystem: true,
    capabilities: ['orders.read', 'service.read', 'service.create', 'service.update', 'service.status.transition'],
  },
  {
    roleId: 3,
    code: 'FINANCE',
    name: 'Finance',
    isSystem: true,
    capabilities: ['orders.read', 'service.read', 'service.price.override', 'service.billing.bill_to.edit', 'reports.export'],
  },
  {
    roleId: 4,
    code: 'QC',
    name: 'Quality control',
    isSystem: true,
    capabilities: ['orders.read', 'service.read', 'reports.view_all'],
  },
];

function roleOf(roleId: number) {
  const found = ROLES.find((item) => item.roleId === roleId);
  return found ? [{ roleId: found.roleId, roleCode: found.code }] : [];
}

function fixtureUsers(): IamUserSummary[] {
  return [
    { userId: 101, email: 'admin.demo@example.test', state: 'active', hasEmployeeProfile: true, roles: roleOf(1) },
    { userId: 102, email: 'cs.demo@example.test', state: 'active', hasEmployeeProfile: true, roles: roleOf(2) },
    { userId: 103, email: 'finance.demo@example.test', state: 'active', hasEmployeeProfile: true, roles: roleOf(3) },
    { userId: 104, email: 'qc.demo@example.test', state: 'active', hasEmployeeProfile: false, roles: roleOf(4) },
    { userId: 105, email: 'pending.a@example.test', state: 'pending_access', hasEmployeeProfile: false, roles: [] },
    { userId: 106, email: 'pending.b@example.test', state: 'pending_access', hasEmployeeProfile: true, roles: [] },
    { userId: 107, email: 'suspended.demo@example.test', state: 'suspended', hasEmployeeProfile: true, roles: [] },
  ];
}

function denied(message: string): ApiError {
  return new ApiError(403, { code: 'FORBIDDEN', message });
}

function allowed(capability: string): boolean {
  const identity = mockIdentity();
  return identity !== null && mockSessionContext(identity).capabilities.includes(capability);
}

export function createMockIamApi(): IamClient {
  const state = fixtureUsers();
  return {
    users: () =>
      allowed('iam.users.read')
        ? Promise.resolve(structuredClone(state))
        : Promise.reject(denied('Missing iam.users.read capability.')),
    roles: () =>
      allowed('iam.roles.read')
        ? Promise.resolve(structuredClone(ROLES))
        : Promise.reject(denied('Missing iam.roles.read capability.')),
    assignRole: (userId, roleId) => {
      if (!allowed('iam.assign_role')) return Promise.reject(denied('Missing iam.assign_role capability.'));
      const user = state.find((item) => item.userId === userId);
      const role = ROLES.find((item) => item.roleId === roleId);
      if (!user || !role) {
        return Promise.reject(new ApiError(400, { code: 'BAD_REQUEST', message: 'Invalid userId or roleId.' }));
      }
      if (role.code === 'ADMIN' || user.roles.some((item) => item.roleCode === 'ADMIN')) {
        return Promise.reject(denied('ADMIN-to-ADMIN delegation is not allowed.'));
      }
      if (!user.roles.some((item) => item.roleId === roleId)) {
        user.roles.push({ roleId, roleCode: role.code });
      }
      user.state = 'active';
      return Promise.resolve({ userId, roleId, roleCode: role.code, tenantId: 1, grantedAt: new Date().toISOString() });
    },
  };
}
