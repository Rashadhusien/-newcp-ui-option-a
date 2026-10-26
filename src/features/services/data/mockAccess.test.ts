import { describe, expect, it } from 'vitest';
import type { ApiError } from '@/shared/api';
import { MOCK_ORDER_UUID, MOCK_SERVICE_ITEMS } from '@/mocks/serviceFixtures';
import { mockSessionContext, type MockIdentity } from '@/mocks/sessionFixtures';
import { capabilitiesForPatch, withMockAccess } from './mockAccess';
import { createMockServiceApi } from './mockServiceApi';

function api(identity: MockIdentity | null) {
  return withMockAccess(createMockServiceApi({ latencyMs: 0 }), () =>
    identity === null ? null : mockSessionContext(identity),
  );
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  return promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: unknown) => error as ApiError,
  );
}

const FIRST = MOCK_SERVICE_ITEMS[0]?.uuid ?? '';

describe('mock access checks (IAM v0.9.7)', () => {
  it('rejects with 401 AUTHENTICATION_REQUIRED when signed out', async () => {
    const error = await rejection(api(null).orderItems(MOCK_ORDER_UUID));
    expect(error).toMatchObject({ status: 401, kind: 'unauthorized', code: 'AUTHENTICATION_REQUIRED' });
  });

  it('rejects every business call for PENDING with ACCESS_NOT_ASSIGNED', async () => {
    const error = await rejection(api('PENDING').orderItems(MOCK_ORDER_UUID));
    expect(error).toMatchObject({ status: 403, kind: 'accessNotAssigned', code: 'ACCESS_NOT_ASSIGNED' });
  });

  it.each(['CS', 'OPS', 'ADMIN'] as const)('lets %s read and edit services', async (identity) => {
    const access = api(identity);
    const { etag } = await access.item(FIRST);
    await expect(access.edit(FIRST, { serviceNotes: 'Mock note' }, etag)).resolves.toBeDefined();
  });

  it.each(['FINANCE', 'QC'] as const)('denies %s operational service pages (reports only)', async (identity) => {
    const error = await rejection(api(identity).item(FIRST));
    expect(error).toMatchObject({ status: 403, kind: 'forbidden', code: 'PERMISSION_DENIED' });
  });

  it('needs the capability of every field a PATCH changes', () => {
    expect(capabilitiesForPatch({ unitPrice: '18.00', isBillable: false, serviceNotes: 'x' }).sort()).toEqual(
      ['service.billing.is_billable.edit', 'service.price.override', 'service.update'].sort(),
    );
    expect(capabilitiesForPatch({ zeroChargeReasonCode: 'R', billedToContactUuid: 'p' }).sort()).toEqual(
      ['service.billing.bill_to.edit', 'service.zero_charge_reason.edit'].sort(),
    );
    expect(capabilitiesForPatch({ quantity: undefined })).toEqual([]);
  });
});
