import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import {
  MOCK_BIOMODEL_UUID,
  MOCK_DOCTOR_UUID,
  MOCK_ORDER_UUID,
  MOCK_SCAN_CENTER_UUID,
} from '@/mocks/serviceFixtures';
import { createMockServiceApi } from './mockServiceApi';

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

describe('mock service API: same-type instances', () => {
  it('creates a new instance for a type the order already has', async () => {
    const mock = api();
    const a = await mock.create(MOCK_ORDER_UUID, { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [] });
    const b = await mock.create(MOCK_ORDER_UUID, { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [] });
    expect(a.uuid).not.toBe(b.uuid);
    expect(b.lineNumber).toBe(a.lineNumber + 1);
    const items = await mock.orderItems(MOCK_ORDER_UUID);
    expect(items.filter((item) => item.sellableItemUuid === MOCK_BIOMODEL_UUID)).toHaveLength(4);
  });

  it('returns the first result for a repeated Idempotency-Key', async () => {
    const mock = api();
    const request = { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [] };
    const a = await mock.create(MOCK_ORDER_UUID, request, 'key-1');
    const b = await mock.create(MOCK_ORDER_UUID, request, 'key-1');
    expect(b.uuid).toBe(a.uuid);
  });

  it('changes one instance without touching its same-type sibling', async () => {
    const mock = api();
    await mock.edit(FIRST, { serviceNotes: 'only the first' });
    const move = (await mock.availableTransitions(FIRST)).at(0);
    if (!move) throw new Error('fixture has no move');
    await mock.transition(FIRST, { transitionId: move.transitionId });

    const second = await mock.item(SECOND);
    expect(second.serviceNotes).toBeUndefined();
    expect(second.status).toBe('in_design');
    expect(await mock.history(SECOND)).toEqual([]);
    expect(await mock.history(FIRST)).toHaveLength(1);
  });
});

describe('mock service API: Bill To (F07)', () => {
  it('copies the order default once when no payer is given', async () => {
    const created = await api().create(MOCK_ORDER_UUID, { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [] });
    expect(created).toMatchObject({ billedToContactUuid: MOCK_DOCTOR_UUID, billedPartyOrigin: 'order_default' });
  });

  it('records an explicit payer change as user_selected on that item only', async () => {
    const mock = api();
    const request = { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [] };
    const a = await mock.create(MOCK_ORDER_UUID, request);
    const b = await mock.create(MOCK_ORDER_UUID, request);
    const updated = await mock.edit(a.uuid, { billedToContactUuid: MOCK_SCAN_CENTER_UUID });
    expect(updated).toMatchObject({
      billedToContactUuid: MOCK_SCAN_CENTER_UUID,
      billedPartyOrigin: 'user_selected',
    });
    expect(await mock.item(b.uuid)).toMatchObject({
      billedToContactUuid: MOCK_DOCTOR_UUID,
      billedPartyOrigin: 'order_default',
    });
  });

  it('rejects an ineligible payer with 422 and changes nothing', async () => {
    const mock = api();
    const error = await rejection(
      mock.edit(FIRST, { billedToContactUuid: '00000000-0000-0000-0000-0000000000ff', serviceNotes: 'x' }),
    );
    expect(error.kind).toBe('validation');
    const item = await mock.item(FIRST);
    expect(item.billedToContactUuid).toBe(MOCK_DOCTOR_UUID);
    expect(item.serviceNotes).toBeUndefined();
  });

  it('rejects a payer change on an invoiced item with 409', async () => {
    const error = await rejection(api().edit(INVOICED, { billedToContactUuid: MOCK_SCAN_CENTER_UUID }));
    expect(error.kind).toBe('conflict');
  });
});

describe('mock service API: workflow and errors', () => {
  it('rejects a transition that is not offered with 409', async () => {
    const error = await rejection(api().transition(INVOICED, { transitionId: 1 }));
    expect(error.kind).toBe('conflict');
  });

  it('returns 404 for an unknown item', async () => {
    const error = await rejection(api().item('00000000-0000-0000-0000-00000000dead'));
    expect(error.kind).toBe('notFound');
  });

  it('injects a failure on every call', async () => {
    const forbidden = createMockServiceApi({ latencyMs: 0, failWith: 403 });
    expect((await rejection(forbidden.orderItems(MOCK_ORDER_UUID))).kind).toBe('forbidden');
    const offline = createMockServiceApi({ latencyMs: 0, failWith: 0 });
    expect((await rejection(offline.orderItems(MOCK_ORDER_UUID))).kind).toBe('network');
  });

  it('returns copies, so callers cannot change the store', async () => {
    const mock = api();
    const item = await mock.item(FIRST);
    item.status = 'cancelled';
    expect((await mock.item(FIRST)).status).toBe('submitted');
  });
});

describe('mock service API: contract v1 fields', () => {
  it('fills the v1 defaults on create', async () => {
    const created = await api().create(MOCK_ORDER_UUID, { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [] });
    expect(created).toMatchObject({
      quantity: 1,
      isBillable: true,
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
    });
  });

  it('keeps v1 answers as sent (optionCodes and value)', async () => {
    const answers = [
      { fieldCode: 'software', optionCodes: ['mock-simplant'] },
      { fieldCode: 'rxNote', value: 'Synthetic note' },
    ];
    const created = await api().create(MOCK_ORDER_UUID, { sellableItemUuid: MOCK_BIOMODEL_UUID, answers });
    expect(created.answers).toEqual(answers);
  });

  it('rejects a quantity below 1 with 422 on create and edit', async () => {
    const mock = api();
    const onCreate = await rejection(
      mock.create(MOCK_ORDER_UUID, { sellableItemUuid: MOCK_BIOMODEL_UUID, answers: [], quantity: 0 }),
    );
    expect(onCreate.problem?.details).toEqual({ field: 'quantity' });
    expect((await rejection(mock.edit(FIRST, { quantity: 0.5 }))).kind).toBe('validation');
    expect((await mock.item(FIRST)).quantity).toBe(1);
  });

  it('accepts only zero-charge reasons from the lookup', async () => {
    const mock = api();
    const reasons = await mock.zeroChargeReasons();
    const code = reasons.at(0)?.code;
    if (code === undefined) throw new Error('fixture has no reason');
    expect((await mock.edit(FIRST, { zeroChargeReasonCode: code, zeroChargeNote: 'x' })).zeroChargeReasonCode).toBe(code);
    const error = await rejection(mock.edit(FIRST, { zeroChargeReasonCode: 'not-a-code' }));
    expect(error.problem?.details).toEqual({ field: 'zeroChargeReasonCode' });
  });

  it('moves updatedAt on every edit', async () => {
    let tick = 0;
    const mock = createMockServiceApi({
      latencyMs: 0,
      now: () => new Date(Date.UTC(2026, 9, 25, 10, 0, tick++)),
    });
    const before = (await mock.item(FIRST)).updatedAt;
    const after = (await mock.edit(FIRST, { isBillable: false })).updatedAt;
    expect(after).not.toBe(before);
  });
});

describe('mock service API: hold details', () => {
  async function putOnHold(mock: ReturnType<typeof api>) {
    const hold = (await mock.availableTransitions(FIRST)).find((move) => move.toCode === 'on_hold');
    if (!hold) throw new Error('fixture has no hold move');
    await mock.transition(FIRST, { transitionId: hold.transitionId });
  }

  it('rejects hold details while the item is not on hold (409)', async () => {
    const error = await rejection(api().edit(FIRST, { holdType: 'customer' }));
    expect(error.kind).toBe('conflict');
  });

  it('accepts a matching type and reason while on hold, and clears them on resume', async () => {
    const mock = api();
    await putOnHold(mock);
    const reason = (await mock.holdReasons('customer')).at(0);
    if (!reason) throw new Error('fixture has no customer reason');
    const held = await mock.edit(FIRST, { holdType: 'customer', holdReasonCode: reason.code });
    expect(held).toMatchObject({ status: 'on_hold', holdType: 'customer', holdReasonCode: reason.code });

    const resume = (await mock.availableTransitions(FIRST)).at(0);
    if (!resume) throw new Error('fixture has no resume move');
    await mock.transition(FIRST, { transitionId: resume.transitionId });
    expect(await mock.item(FIRST)).toMatchObject({ holdType: null, holdReasonCode: null });
  });

  it('rejects a reason of the other type, or a reason without a type (422)', async () => {
    const mock = api();
    await putOnHold(mock);
    const internal = (await mock.holdReasons('internal')).at(0);
    if (!internal) throw new Error('fixture has no internal reason');
    const wrongType = await rejection(mock.edit(FIRST, { holdType: 'customer', holdReasonCode: internal.code }));
    expect(wrongType.problem?.details).toEqual({ field: 'holdReasonCode' });
    const noType = await rejection(mock.edit(FIRST, { holdReasonCode: internal.code }));
    expect(noType.problem?.details).toEqual({ field: 'holdType' });
  });

  it('filters hold reasons by type', async () => {
    const reasons = await api().holdReasons('internal');
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.every((reason) => reason.holdType === 'internal')).toBe(true);
  });
});
