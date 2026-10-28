import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, can, clearSessionToken, setSessionToken } from '@/shared/api';
import { MOCK_IDENTITIES, mockSessionContext } from '@/mocks/sessionFixtures';
import {
  chooseMockIdentity,
  clearMockIdentity,
  loadSessionContext,
  onAccessEvent,
  reportAccessError,
  safeReturnPath,
} from './session';

const MOCK = { useMocks: true, baseUrl: '' };

afterEach(() => {
  clearMockIdentity();
});

describe('session context (IAM v0.9.7, D-51)', () => {
  it('is signed out (401) until a mock identity is chosen, then returns its context', async () => {
    await expect(loadSessionContext(MOCK)).rejects.toMatchObject({ kind: 'unauthorized' });
    chooseMockIdentity('OPS');
    await expect(loadSessionContext(MOCK)).resolves.toMatchObject({ accessStatus: 'AUTHORIZED', roles: ['OPS'] });
  });

  it('with the real API: signed out without a token, then GET /auth/me with the Bearer token (A30)', async () => {
    const me = {
      email: 'clerk@example.test',
      userUuid: '00000000-0000-4000-a000-000000000099',
      tenantSlug: 'demo-tenant',
      roleCodes: ['CS'],
      capabilities: ['service.read'],
      isPendingAccess: false,
    };
    const fetchSpy = vi.fn<typeof fetch>(() => Promise.resolve(new Response(JSON.stringify(me), { status: 200 })));
    vi.stubGlobal('fetch', fetchSpy);
    const real = { useMocks: false, baseUrl: 'https://api.example.test' };
    chooseMockIdentity('CS');
    await expect(loadSessionContext(real)).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(fetchSpy).not.toHaveBeenCalled();
    setSessionToken({ sessionToken: 'synthetic-session', expiresAt: null });
    await expect(loadSessionContext(real)).resolves.toEqual({
      user: { id: me.userUuid, displayName: me.email },
      accessStatus: 'AUTHORIZED',
      activeTenant: { label: 'demo-tenant' },
      roles: ['CS'],
      capabilities: ['service.read'],
      tenantSwitchingEnabled: false,
    });
    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.test/api/v1/auth/me');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer synthetic-session');
    clearSessionToken();
    vi.unstubAllGlobals();
  });

  it('gives PENDING no tenant, roles or capabilities, and every other identity one read-only tenant', () => {
    const pending = mockSessionContext('PENDING');
    expect(pending).toMatchObject({ accessStatus: 'PENDING', activeTenant: null, roles: [], capabilities: [] });
    for (const identity of MOCK_IDENTITIES.filter((value) => value !== 'PENDING')) {
      const context = mockSessionContext(identity);
      expect(context.activeTenant?.label).toContain('mock');
      expect(context.tenantSwitchingEnabled).toBe(false);
    }
  });

  it('follows the capability matrix and G11: everyone views reports, export only FINANCE/QC/ADMIN, FINANCE/QC read services, only FINANCE edits money', () => {
    for (const identity of ['CS', 'OPS', 'ADMIN', 'FINANCE', 'QC'] as const) {
      expect(can(mockSessionContext(identity), 'reports.view_all')).toBe(true);
    }
    expect(['CS', 'OPS', 'ADMIN', 'FINANCE', 'QC'].filter((id) => can(mockSessionContext(id as 'CS'), 'reports.export'))).toEqual([
      'ADMIN',
      'FINANCE',
      'QC',
    ]);
    // G11 (D-87): both read orders and services; FINANCE edits money only, QC edits nothing.
    for (const identity of ['FINANCE', 'QC'] as const) {
      expect(can(mockSessionContext(identity), 'orders.read')).toBe(true);
      expect(can(mockSessionContext(identity), 'service.read')).toBe(true);
      expect(can(mockSessionContext(identity), 'service.update')).toBe(false);
      expect(can(mockSessionContext(identity), 'service.status.transition')).toBe(false);
    }
    expect(can(mockSessionContext('FINANCE'), 'service.price.override')).toBe(true);
    expect(can(mockSessionContext('QC'), 'service.price.override')).toBe(false);
    expect(can(mockSessionContext('PENDING'), 'reports.view_all')).toBe(false);
    expect(can(null, 'reports.view_all')).toBe(false);
  });

  it('reports 401 and 403 to listeners, and ignores other failures', () => {
    const events: string[] = [];
    const stop = onAccessEvent((event) => events.push(event));
    reportAccessError(new ApiError(401, null));
    reportAccessError(new ApiError(403, { code: 'PERMISSION_DENIED', message: 'm' }));
    reportAccessError(new ApiError(403, { code: 'ACCESS_NOT_ASSIGNED', message: 'm' }));
    reportAccessError(new ApiError(409, null));
    reportAccessError(new Error('not an api error'));
    stop();
    reportAccessError(new ApiError(401, null));
    expect(events).toEqual(['unauthorized', 'forbidden', 'accessNotAssigned']);
  });

  it('keeps only safe in-app return paths', () => {
    expect(safeReturnPath('/services/abc/edit?x=1', '/reporting')).toBe('/services/abc/edit?x=1');
    for (const unsafe of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '', null, undefined]) {
      expect(safeReturnPath(unsafe, '/reporting')).toBe('/reporting');
    }
  });
});
