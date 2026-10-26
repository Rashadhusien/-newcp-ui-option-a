import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import {
  MOCK_BIOMODEL_UUID,
  MOCK_DOCTOR_UUID,
  MOCK_ORDER_UUID,
  MOCK_SCAN_CENTER_UUID,
} from '@/mocks/serviceFixtures';
import { createMockServiceApi } from './mockServiceApi';

/** Fixture items: FIRST may edit price; SECOND may not; INVOICED is financially locked. */
const FIRST = '00000000-0000-0000-0000-000000000014';
const SECOND = '00000000-0000-0000-0000-000000000015';
const INVOICED = '00000000-0000-0000-0000-000000000016';

function api() {
  return createMockServiceApi({ latencyMs: 0, now: () => new Date('2026-10-25T10:00:00Z') });
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  if (!(error instanceof ApiError)) throw new Error('expected an ApiError');
  return error;
}

const NEW_BIOMODEL = { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [] };

describe('mock: same-type instances', () => {
  it('creates a new instance for a type the order already has, quantity 1 by default', async () => {
    const mock = api();
    const a = await mock.create(MOCK_ORDER_UUID, NEW_BIOMODEL);
    const b = await mock.create(MOCK_ORDER_UUID, NEW_BIOMODEL);
    expect(a.uuid).not.toBe(b.uuid);
    expect(b.lineNumber).toBe((a.lineNumber ?? 0) + 1);
    expect(a).toMatchObject({ quantity: 1, isBillable: true, unitPrice: '20.00', lineTotal: '20.00' });
    const items = await mock.orderItems(MOCK_ORDER_UUID);
    expect(items.filter((item) => item.sellableItemUuid === MOCK_BIOMODEL_UUID)).toHaveLength(4);
  });

  it('returns the first result for a repeated Idempotency-Key', async () => {
    const mock = api();
    const a = await mock.create(MOCK_ORDER_UUID, NEW_BIOMODEL, 'key-1');
    const b = await mock.create(MOCK_ORDER_UUID, NEW_BIOMODEL, 'key-1');
    expect(b.uuid).toBe(a.uuid);
  });

  it('changes one instance without touching its same-type sibling', async () => {
    const mock = api();
    const first = await mock.item(FIRST);
    const edited = await mock.edit(FIRST, { serviceNotes: 'only the first' }, first.etag);
    const move = (await mock.availableTransitions(FIRST)).find((entry) => entry.toCode === 'in_design');
    if (!move) throw new Error('fixture has no move');
    await mock.transition(FIRST, { transitionId: move.transitionId }, edited.etag);

    const second = (await mock.item(SECOND)).data;
    expect(second.serviceNotes).toBeUndefined();
    expect(second.status).toBe('in_design');
    expect(await mock.history(SECOND)).toEqual([]);
    expect(await mock.history(FIRST)).toHaveLength(1);
  });
});

describe('mock: Q-B8 concurrency', () => {
  it('returns an ETag and moves it on every write', async () => {
    const mock = api();
    const loaded = await mock.item(FIRST);
    expect(loaded.data.etag).toBe(loaded.etag);
    const saved = await mock.edit(FIRST, { isRedo: true }, loaded.etag);
    expect(saved.etag).not.toBe(loaded.etag);
  });

  it('rejects a stale If-Match with 412 and writes nothing', async () => {
    const mock = api();
    const loaded = await mock.item(FIRST);
    await mock.edit(FIRST, { serviceNotes: 'first writer' }, loaded.etag);
    const error = await rejection(mock.edit(FIRST, { serviceNotes: 'second writer' }, loaded.etag));
    expect(error.kind).toBe('stale');
    expect((await mock.item(FIRST)).data.serviceNotes).toBe('first writer');
  });

  it('rejects a missing If-Match with 428', async () => {
    const error = await rejection(api().edit(FIRST, { isRedo: true }, ''));
    expect(error.kind).toBe('preconditionRequired');
  });

  it('checks the version on transitions too', async () => {
    const mock = api();
    const move = (await mock.availableTransitions(FIRST)).at(0);
    if (!move) throw new Error('fixture has no move');
    expect((await rejection(mock.transition(FIRST, { transitionId: move.transitionId }, '"rev-0"'))).kind).toBe('stale');
  });
});

describe('mock: Q-B9 On Hold', () => {
  async function holdMove(mock: ReturnType<typeof api>) {
    const move = (await mock.availableTransitions(FIRST)).find((entry) => entry.toCode === 'on_hold');
    if (!move) throw new Error('fixture has no hold move');
    return move;
  }

  it('rejects a move into hold without type or reason (422), changing nothing', async () => {
    const mock = api();
    const move = await holdMove(mock);
    const { etag } = await mock.item(FIRST);
    const noType = await rejection(mock.transition(FIRST, { transitionId: move.transitionId }, etag));
    expect(noType.problem?.details).toEqual({ field: 'holdType' });
    const noReason = await rejection(
      mock.transition(FIRST, { transitionId: move.transitionId, holdType: 'customer' }, etag),
    );
    expect(noReason.problem?.details).toEqual({ field: 'holdReasonCode' });
    expect((await mock.item(FIRST)).data.status).toBe('submitted');
  });

  it('puts on hold with a matching Demo only reason in one request, and resuming clears it', async () => {
    const mock = api();
    const move = await holdMove(mock);
    const reason = (await mock.holdReasons('customer')).at(0);
    if (!reason) throw new Error('fixture has no customer reason');
    expect(reason).toMatchObject({ isTemporary: true });
    expect(reason.label).toMatch(/^Demo only/);

    const held = await mock.transition(
      FIRST,
      { transitionId: move.transitionId, holdType: 'customer', holdReasonCode: reason.code },
      (await mock.item(FIRST)).etag,
    );
    expect(held.data).toMatchObject({ toCode: 'on_hold', holdType: 'customer', holdReasonCode: reason.code });

    const resume = (await mock.availableTransitions(FIRST)).at(0);
    if (!resume) throw new Error('fixture has no resume move');
    const resumed = await mock.transition(FIRST, { transitionId: resume.transitionId }, held.etag);
    expect(resumed.data.holdType).toBeUndefined();
  });

  it('rejects a reason of the other hold type', async () => {
    const mock = api();
    const move = await holdMove(mock);
    const internal = (await mock.holdReasons('internal')).at(0);
    if (!internal) throw new Error('fixture has no internal reason');
    const error = await rejection(
      mock.transition(
        FIRST,
        { transitionId: move.transitionId, holdType: 'customer', holdReasonCode: internal.code },
        (await mock.item(FIRST)).etag,
      ),
    );
    expect(error.problem?.details).toEqual({ field: 'holdReasonCode' });
  });
});

describe('mock: Q-B10 price and zero charge', () => {
  it('keeps an authorized price override ($20 contract -> $18)', async () => {
    const mock = api();
    const { data, etag } = await mock.item(FIRST);
    expect(data.unitPrice).toBe('20.00');
    const saved = await mock.edit(FIRST, { unitPrice: '18.00' }, etag);
    expect(saved.data).toMatchObject({ unitPrice: '18.00', lineTotal: '18.00' });
    expect((await mock.item(FIRST)).data.unitPrice).toBe('18.00');
  });

  it('denies a price change without canEditPrice (403) and on an invoiced item', async () => {
    const mock = api();
    expect((await rejection(mock.edit(SECOND, { unitPrice: '18.00' }, (await mock.item(SECOND)).etag))).kind).toBe(
      'forbidden',
    );
    expect(
      (await rejection(mock.edit(INVOICED, { unitPrice: '18.00' }, (await mock.item(INVOICED)).etag))).kind,
    ).toBe('forbidden');
  });

  it('needs a zero-charge reason for a zero total: 422 ZERO_CHARGE_REASON_REQUIRED on the field', async () => {
    const mock = api();
    const { etag } = await mock.item(FIRST);
    const error = await rejection(mock.edit(FIRST, { unitPrice: '0' }, etag));
    expect(error.kind).toBe('validation');
    expect(error.problem).toMatchObject({
      code: 'ZERO_CHARGE_REASON_REQUIRED',
      details: { field: 'zeroChargeReasonCode' },
    });
    const reason = (await mock.zeroChargeReasons()).at(0);
    if (!reason) throw new Error('fixture has no reason');
    const saved = await mock.edit(FIRST, { unitPrice: '0', zeroChargeReasonCode: reason.code }, etag);
    expect(saved.data).toMatchObject({ lineTotal: '0.00', zeroChargeReasonCode: reason.code });
  });

  it('rejects a malformed price', async () => {
    const mock = api();
    const error = await rejection(mock.edit(FIRST, { unitPrice: '18,5' }, (await mock.item(FIRST)).etag));
    expect(error.problem?.details).toEqual({ field: 'unitPrice' });
  });
});

describe('mock: Q-B13 quantity', () => {
  it('accepts positive decimals up to 3 places and rejects 0 or more places', async () => {
    const mock = api();
    const saved = await mock.edit(FIRST, { quantity: 1.5 }, (await mock.item(FIRST)).etag);
    expect(saved.data).toMatchObject({ quantity: 1.5, lineTotal: '30.00' });
    expect((await rejection(mock.edit(FIRST, { quantity: 0 }, saved.etag))).problem?.details).toEqual({
      field: 'quantity',
    });
    expect((await rejection(mock.edit(FIRST, { quantity: 1.0005 }, saved.etag))).kind).toBe('validation');
  });
});

describe('mock: Q-B14 Billable and Bill To are independent (package fixture cases)', () => {
  it('keeps the payer when billability changes, and billability when the payer changes', async () => {
    const mock = api();
    let { etag } = await mock.item(FIRST);
    const nonBillable = await mock.edit(FIRST, { isBillable: false }, etag);
    expect(nonBillable.data).toMatchObject({
      isBillable: false,
      billedToContactUuid: MOCK_DOCTOR_UUID,
      billedPartyOrigin: 'order_default',
    });
    etag = nonBillable.etag;
    const payerOnly = await mock.edit(FIRST, { billedToContactUuid: MOCK_SCAN_CENTER_UUID }, etag);
    expect(payerOnly.data).toMatchObject({
      isBillable: false,
      billedToContactUuid: MOCK_SCAN_CENTER_UUID,
      billedPartyOrigin: 'user_selected',
    });
  });

  it('creates a non-billable item with an explicit payer', async () => {
    const created = await api().create(MOCK_ORDER_UUID, {
      ...NEW_BIOMODEL,
      isBillable: false,
      billedToContactUuid: MOCK_DOCTOR_UUID,
    });
    expect(created).toMatchObject({ isBillable: false, billedToContactUuid: MOCK_DOCTOR_UUID });
  });

  it('rejects billability and payer changes after invoicing', async () => {
    const mock = api();
    const { etag } = await mock.item(INVOICED);
    expect((await rejection(mock.edit(INVOICED, { isBillable: false }, etag))).kind).toBe('forbidden');
    expect((await rejection(mock.edit(INVOICED, { billedToContactUuid: MOCK_SCAN_CENTER_UUID }, etag))).kind).toBe(
      'conflict',
    );
  });

  it('rejects an ineligible payer with 422 and changes nothing', async () => {
    const mock = api();
    const { etag } = await mock.item(FIRST);
    const error = await rejection(
      mock.edit(FIRST, { billedToContactUuid: '00000000-0000-0000-0000-0000000000ff', serviceNotes: 'x' }, etag),
    );
    expect(error.kind).toBe('validation');
    const item = (await mock.item(FIRST)).data;
    expect(item.billedToContactUuid).toBe(MOCK_DOCTOR_UUID);
    expect(item.serviceNotes).toBeUndefined();
  });
});

describe('mock: errors', () => {
  it('rejects a transition that is not offered with 409', async () => {
    const mock = api();
    const error = await rejection(mock.transition(INVOICED, { transitionId: 1 }, (await mock.item(INVOICED)).etag));
    expect(error.kind).toBe('conflict');
  });

  it('returns 404 for an unknown item', async () => {
    expect((await rejection(api().item('00000000-0000-0000-0000-00000000dead'))).kind).toBe('notFound');
  });

  it('injects a failure on every call, including 412', async () => {
    const stale = createMockServiceApi({ latencyMs: 0, failWith: 412 });
    expect((await rejection(stale.orderItems(MOCK_ORDER_UUID))).kind).toBe('stale');
    const offline = createMockServiceApi({ latencyMs: 0, failWith: 0 });
    expect((await rejection(offline.orderItems(MOCK_ORDER_UUID))).kind).toBe('network');
  });

  it('returns copies, so callers cannot change the store', async () => {
    const mock = api();
    const { data } = await mock.item(FIRST);
    data.status = 'cancelled';
    expect((await mock.item(FIRST)).data.status).toBe('submitted');
  });
});
