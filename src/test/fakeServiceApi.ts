/**
 * TEST ONLY (A38: the app always calls the real API). In-memory fake of the
 * service-instance API for page tests, shaped like the canonical
 * contract (docs/openapi/newcp.openapi.yaml, D-79). Behaviour follows the
 * contract and the approved Q-B8 to Q-B15 decisions:
 * - create always makes a NEW instance (new UUID, next line number), even
 *   for a type the order already has; the same Idempotency-Key returns the
 *   first result (R11, proposed). Quantity defaults to 1 (demo, Q-B13).
 * - Q-B8: every item has a version (ETag); edits and transitions need
 *   If-Match: missing -> 428, stale -> 412, and nothing is written.
 * - Q-B9: On Hold only through a transition carrying holdType and a
 *   matching "Demo only" reason, kept on the item; leaving hold clears both.
 * - Q-B16: answers are `fieldCode` + `optionCodes` (choice fields) or
 *   `value` (others), never both: an unknown property is a 400, a wrong
 *   kind of value a 422 INVALID_FIELD_TYPE. PATCH answers replace the set.
 * - Q-B10: the contract price is the initial unit price; a clerk with
 *   `canEditPrice` may override it and the override is kept. A final line
 *   total of zero needs a zero-charge reason: 422 ZERO_CHARGE_REASON_REQUIRED
 *   on `zeroChargeReasonCode`.
 * - Q-B14: Billable and Bill To are independent; each is permission- and
 *   lock-checked on its own. Invoiced items reject price, quantity and payer
 *   changes (422, as the contract describes) and billability changes (409).
 * - Quantity > 0 with at most 3 decimals (contract `multipleOf: 0.001`).
 * Problem codes other than ZERO_CHARGE_REASON_REQUIRED are mock-only
 * (`mock.*`, Q-B7). Totals here are mock arithmetic; the server computes the
 * real ones. Data is copied in and out, so one instance's change can never
 * leak into another or into the caller.
 */

import {
  ApiError,
  type AvailableTransition,
  type BilledPartyChoice,
  type CatalogService,
  type FormAnswer,
  type FormDefinition,
  type HistoryEvent,
  type NewCpClient,
  type Problem,
  type ServiceItem,
  type TransitionResult,
} from '@/shared/api';
import {
  MOCK_BILLED_PARTIES,
  MOCK_CATALOG,
  MOCK_CONTRACT_UNIT_PRICE,
  MOCK_CURRENCY,
  MOCK_DOCTOR_UUID,
  MOCK_HOLD_REASONS,
  MOCK_SERVICE_ITEMS,
  MOCK_TRANSITIONS,
  MOCK_ZERO_CHARGE_REASONS,
} from '@/mocks/serviceFixtures';
import type { ServiceApi } from '@/features/services/data/serviceApi';
import { resolveFormSpec } from '@/features/services/forms/catalogFormBridge';
import { mockFormDefinition } from './mockFormDefinition';

export interface MockOptions {
  /** Artificial latency in ms (default 300; 0 in tests). */
  latencyMs?: number;
  /** Fail every call with this HTTP status (0 = network failure). */
  failWith?: number;
  /** Starting items; defaults to the shared fixtures. */
  items?: readonly ServiceItem[];
  /** Fixed clock for history timestamps (tests). */
  now?: () => Date;
}

/** The mock implements the contract client as it is. */
export type MockServiceApi = NewCpClient;

const MOCK_ACTOR = '00000000-0000-0000-0000-0000000000a1';
const PRICE_PATTERN = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ANSWER_KEYS = new Set(['fieldCode', 'value', 'optionCodes']);

function copy<T>(value: T): T {
  return structuredClone(value);
}

function problem(code: string, message: string, details?: Record<string, unknown>): Problem {
  return details ? { code, message, details } : { code, message };
}

function invalid(field: string, message: string, code = 'mock.invalid_field'): ApiError {
  return new ApiError(422, problem(code, message, { field }));
}

type MoneyParts = Pick<ServiceItem, 'unitPrice' | 'quantity' | 'fieldsAmount' | 'discountAmount' | 'voucherAmount'>;

/** Mock line total per the contract formula, 2 decimals (the server owns real totals). */
function lineTotalOf(item: MoneyParts): string {
  const total =
    Number(item.unitPrice) * item.quantity +
    Number(item.fieldsAmount) -
    Number(item.discountAmount) -
    Number(item.voucherAmount);
  return total.toFixed(2);
}

/** Q-B16 wire checks against the service's form definition. */
function assertAnswers(answers: readonly FormAnswer[], definition: FormDefinition): void {
  const types = new Map(definition.fields.map((field) => [field.code, field.type]));
  for (const answer of answers) {
    const extra = Object.keys(answer).filter((key) => !ANSWER_KEYS.has(key));
    if (extra.length > 0) {
      throw new ApiError(
        400,
        problem('mock.unknown_property', `Answer properties not allowed: ${extra.join(', ')}.`, {
          field: answer.fieldCode,
        }),
      );
    }
    const type = types.get(answer.fieldCode);
    if (type === undefined) {
      throw invalid(answer.fieldCode, 'This field is not part of the service form.', 'mock.unknown_field');
    }
    const mismatch = (message: string) => invalid(answer.fieldCode, message, 'INVALID_FIELD_TYPE');
    const { value, optionCodes } = answer;
    if (value !== undefined && optionCodes !== undefined) throw mismatch('Send either a value or option codes, not both.');
    if (type === 'single_select' || type === 'multi_select') {
      if (value !== undefined || optionCodes === undefined) throw mismatch('A choice field takes option codes.');
      if (type === 'single_select' && optionCodes.length > 1) throw mismatch('Choose one option.');
    } else if (optionCodes !== undefined) {
      throw mismatch('This field takes a value, not option codes.');
    } else if (
      (type === 'boolean' && typeof value !== 'boolean') ||
      (type === 'number' && typeof value !== 'number') ||
      (type === 'date' && (typeof value !== 'string' || !DATE_PATTERN.test(value))) ||
      (type === 'text' && typeof value !== 'string')
    ) {
      throw mismatch(`This field takes a ${type} value.`);
    }
  }
}

export function createMockServiceApi(options: MockOptions = {}): MockServiceApi {
  const latency = options.latencyMs ?? 300;
  const now = options.now ?? (() => new Date());
  const items = new Map<string, ServiceItem>(
    (options.items ?? MOCK_SERVICE_ITEMS).map((item) => [item.uuid, copy(item)]),
  );
  const revisions = new Map<string, number>([...items.keys()].map((uuid) => [uuid, 1]));
  const history = new Map<string, HistoryEvent[]>();
  const idempotent = new Map<string, string>();
  let nextUuid = 0x100;
  // Stable ids per (from, to) pair so a listed transition can be re-checked.
  const transitionIds = new Map<string, number>();

  async function respond<T>(produce: () => T): Promise<T> {
    if (latency > 0) await new Promise((resolve) => setTimeout(resolve, latency));
    if (options.failWith != null) {
      if (options.failWith === 0) throw ApiError.network();
      throw new ApiError(
        options.failWith,
        problem('mock.injected', `Injected mock failure (${String(options.failWith)}).`),
      );
    }
    return copy(produce());
  }

  function etagOf(uuid: string): string {
    return `"rev-${String(revisions.get(uuid) ?? 1)}"`;
  }

  function withEtag(item: ServiceItem): ServiceItem {
    return { ...item, etag: etagOf(item.uuid) };
  }

  function bump(uuid: string): void {
    revisions.set(uuid, (revisions.get(uuid) ?? 1) + 1);
  }

  function getItem(uuid: string): ServiceItem {
    const item = items.get(uuid);
    if (!item) throw new ApiError(404, problem('mock.not_found', 'Service item not found.'));
    return item;
  }

  function assertVersion(uuid: string, ifMatch: string): void {
    if (ifMatch === '') {
      throw new ApiError(428, problem('mock.precondition_required', 'If-Match is required.'));
    }
    if (ifMatch !== etagOf(uuid)) {
      throw new ApiError(
        412,
        problem('mock.stale', 'Someone else changed this service since you opened it. Nothing was saved.'),
      );
    }
  }

  function eligible(orderUuid: string): readonly BilledPartyChoice[] {
    return orderUuid === MOCK_SERVICE_ITEMS[0]?.orderUuid ? MOCK_BILLED_PARTIES : [];
  }

  function assertEligiblePayer(orderUuid: string, contactUuid: string): void {
    if (!eligible(orderUuid).some((party) => party.contactUuid === contactUuid)) {
      throw invalid('billedToContactUuid', 'This contact cannot be billed for this order.', 'mock.ineligible_payer');
    }
  }

  function assertQuantity(quantity: number | undefined): void {
    if (quantity === undefined) return;
    const thousandths = quantity * 1000;
    if (!Number.isFinite(quantity) || quantity <= 0 || Math.abs(thousandths - Math.round(thousandths)) > 1e-6) {
      throw invalid('quantity', 'Quantity must be more than 0, with at most 3 decimals.');
    }
  }

  function assertUnitPrice(unitPrice: string | undefined): void {
    if (unitPrice === undefined) return;
    if (!PRICE_PATTERN.test(unitPrice)) throw invalid('unitPrice', 'Enter a price such as 18 or 18.50.');
    if ((unitPrice.split('.')[1] ?? '').length > 2) throw invalid('unitPrice', 'Use at most 2 decimals.');
  }

  function assertZeroChargeReason(code: string | null | undefined): void {
    if (code != null && !MOCK_ZERO_CHARGE_REASONS.some((reason) => reason.code === code && reason.active)) {
      throw invalid('zeroChargeReasonCode', 'Choose a zero-charge reason from the list.');
    }
  }

  /** Q-B10: a final line total of zero needs a reason. */
  function assertZeroTotalHasReason(lineTotal: string | undefined, reason: string | null | undefined): void {
    if (lineTotal !== undefined && Number(lineTotal) === 0 && (reason == null || reason === '')) {
      throw invalid(
        'zeroChargeReasonCode',
        'The line total is zero, so a zero-charge reason is required.',
        'ZERO_CHARGE_REASON_REQUIRED',
      );
    }
  }

  /** Invoiced lines reject price, quantity, currency and payer changes (422 on the field, per the contract). */
  function invoicedLock(field: string, what: string): ApiError {
    return invalid(field, `The ${what} cannot change after the service is invoiced.`, 'mock.invoiced');
  }

  function definitionOf(sellableItemUuid: string): FormDefinition {
    const service = MOCK_CATALOG.find((entry) => entry.uuid === sellableItemUuid);
    if (!service) throw invalid('sellableItemUuid', 'Unknown service.', 'mock.unknown_service');
    const spec = resolveFormSpec(service);
    return spec ? mockFormDefinition(service, spec) : { service, fields: [], evidence: 'MOCK: no form spec for this service' };
  }

  function transitionsFor(item: ServiceItem): AvailableTransition[] {
    return (MOCK_TRANSITIONS[item.status] ?? []).map((move) => {
      const key = `${move.fromCode}->${move.toCode}`;
      let id = transitionIds.get(key);
      if (id === undefined) {
        id = transitionIds.size + 1;
        transitionIds.set(key, id);
      }
      return { ...move, transitionId: id };
    });
  }

  function newUuid(): string {
    nextUuid += 1;
    return `00000000-0000-4000-8000-${nextUuid.toString(16).padStart(12, '0')}`;
  }

  return {
    catalog: (categoryCode) => respond((): CatalogService[] => (categoryCode ? [] : [...MOCK_CATALOG])),

    formSchema: (serviceUuid) =>
      respond((): FormDefinition => {
        if (!MOCK_CATALOG.some((entry) => entry.uuid === serviceUuid)) {
          throw new ApiError(404, problem('mock.not_found', 'Service not found.'));
        }
        return definitionOf(serviceUuid);
      }),

    holdReasons: (holdType) => respond(() => MOCK_HOLD_REASONS.filter((reason) => reason.holdType === holdType)),

    zeroChargeReasons: () => respond(() => MOCK_ZERO_CHARGE_REASONS.filter((reason) => reason.active)),

    eligibleBilledParties: (orderUuid) => respond(() => [...eligible(orderUuid)]),

    orderItems: (orderUuid) =>
      respond(() =>
        [...items.values()]
          .filter((item) => item.orderUuid === orderUuid)
          .sort((a, b) => a.lineNumber - b.lineNumber)
          .map(withEtag),
      ),

    create: (orderUuid, request, idempotencyKey) =>
      respond(() => {
        if (idempotencyKey) {
          const existing = idempotent.get(idempotencyKey);
          if (existing) return withEtag(getItem(existing));
        }
        assertAnswers(request.answers, definitionOf(request.sellableItemUuid));
        if (request.billedToContactUuid) assertEligiblePayer(orderUuid, request.billedToContactUuid);
        assertQuantity(request.quantity);
        assertUnitPrice(request.unitPrice);
        assertZeroChargeReason(request.zeroChargeReasonCode);
        const money: MoneyParts = {
          quantity: request.quantity ?? 1,
          unitPrice: request.unitPrice ?? MOCK_CONTRACT_UNIT_PRICE,
          fieldsAmount: '0.00',
          discountAmount: '0.00',
          voucherAmount: '0.00',
        };
        const lineTotal = lineTotalOf(money);
        assertZeroTotalHasReason(lineTotal, request.zeroChargeReasonCode);
        const lines = [...items.values()].filter((item) => item.orderUuid === orderUuid).map((item) => item.lineNumber);
        const stamp = now().toISOString();
        const created: ServiceItem = {
          uuid: newUuid(),
          orderUuid,
          sellableItemUuid: request.sellableItemUuid,
          lineNumber: Math.max(0, ...lines) + 1,
          ...money,
          lineTotal,
          status: 'submitted',
          isBillable: request.isBillable ?? true,
          canEditBillability: true,
          isRedo: request.isRedo ?? false,
          redoOfItemUuid: request.redoOfItemUuid ?? null,
          isInvoiced: false,
          currencyCode: MOCK_CURRENCY,
          canEditPrice: true,
          answers: copy(request.answers),
          billedToContactUuid: request.billedToContactUuid ?? MOCK_DOCTOR_UUID,
          billedPartyOrigin: request.billedToContactUuid ? 'user_selected' : 'order_default',
          canEditBilledParty: true,
          pendingReason: null,
          holdType: null,
          holdReasonCode: null,
          zeroChargeReasonCode: request.zeroChargeReasonCode ?? null,
          zeroChargeNote: request.zeroChargeNote ?? null,
          etag: '"rev-1"',
          createdAt: stamp,
          updatedAt: stamp,
        };
        if (request.serviceNotes !== undefined) created.serviceNotes = request.serviceNotes;
        items.set(created.uuid, created);
        revisions.set(created.uuid, 1);
        if (idempotencyKey) idempotent.set(idempotencyKey, created.uuid);
        return withEtag(created);
      }),

    item: (serviceItemUuid) =>
      respond(() => {
        const item = getItem(serviceItemUuid);
        return { data: withEtag(item), etag: etagOf(item.uuid) };
      }),

    edit: (serviceItemUuid, patch, ifMatch) =>
      respond(() => {
        const item = getItem(serviceItemUuid);
        assertVersion(item.uuid, ifMatch);
        if (Object.keys(patch).length === 0) {
          throw new ApiError(400, problem('mock.empty_patch', 'Nothing to change.'));
        }
        if (patch.answers !== undefined) assertAnswers(patch.answers, definitionOf(item.sellableItemUuid));
        if (patch.billedToContactUuid !== undefined) {
          if (item.isInvoiced) throw invoicedLock('billedToContactUuid', 'payer');
          if (!item.canEditBilledParty) {
            throw new ApiError(403, problem('mock.forbidden', 'You may not change the payer.'));
          }
          assertEligiblePayer(item.orderUuid, patch.billedToContactUuid);
        }
        if (patch.isBillable !== undefined && patch.isBillable !== item.isBillable) {
          if (!item.canEditBillability) {
            throw new ApiError(403, problem('mock.forbidden', 'You may not change billability.'));
          }
          if (item.isInvoiced) {
            throw new ApiError(
              409,
              problem('mock.financial_lock', 'Billability cannot change after the service is invoiced.'),
            );
          }
        }
        if (patch.unitPrice !== undefined && patch.unitPrice !== item.unitPrice) {
          if (!item.canEditPrice) {
            throw new ApiError(403, problem('mock.forbidden', 'You may not change the price.'));
          }
          if (item.isInvoiced) throw invoicedLock('unitPrice', 'price');
        }
        if (patch.quantity !== undefined && patch.quantity !== item.quantity && item.isInvoiced) {
          throw invoicedLock('quantity', 'quantity');
        }
        assertQuantity(patch.quantity);
        assertUnitPrice(patch.unitPrice);
        assertZeroChargeReason(patch.zeroChargeReasonCode);
        const lineTotal = lineTotalOf({
          ...item,
          unitPrice: patch.unitPrice ?? item.unitPrice,
          quantity: patch.quantity ?? item.quantity,
        });
        const reason = patch.zeroChargeReasonCode !== undefined ? patch.zeroChargeReasonCode : item.zeroChargeReasonCode;
        assertZeroTotalHasReason(lineTotal, reason);

        // Everything is validated before anything changes: no partial update.
        const updated: ServiceItem = { ...item, lineTotal, updatedAt: now().toISOString() };
        if (patch.answers !== undefined) updated.answers = copy(patch.answers);
        if (patch.isRedo !== undefined) updated.isRedo = patch.isRedo;
        if (patch.redoOfItemUuid !== undefined) updated.redoOfItemUuid = patch.redoOfItemUuid;
        if (patch.pendingReason !== undefined) updated.pendingReason = patch.pendingReason;
        if (patch.serviceNotes !== undefined) updated.serviceNotes = patch.serviceNotes;
        if (patch.isBillable !== undefined) updated.isBillable = patch.isBillable;
        if (patch.quantity !== undefined) updated.quantity = patch.quantity;
        if (patch.unitPrice !== undefined) updated.unitPrice = patch.unitPrice;
        if (patch.zeroChargeReasonCode !== undefined) updated.zeroChargeReasonCode = patch.zeroChargeReasonCode;
        if (patch.zeroChargeNote !== undefined) updated.zeroChargeNote = patch.zeroChargeNote;
        if (patch.billedToContactUuid !== undefined) {
          updated.billedToContactUuid = patch.billedToContactUuid;
          updated.billedPartyOrigin = 'user_selected';
        }
        items.set(item.uuid, updated);
        bump(item.uuid);
        return { data: withEtag(updated), etag: etagOf(item.uuid) };
      }),

    availableTransitions: (serviceItemUuid) => respond(() => transitionsFor(getItem(serviceItemUuid))),

    transition: (serviceItemUuid, request, ifMatch) =>
      respond(() => {
        const item = getItem(serviceItemUuid);
        assertVersion(item.uuid, ifMatch);
        const move = transitionsFor(item).find((entry) => entry.transitionId === request.transitionId);
        if (!move) {
          throw new ApiError(409, problem('mock.transition_not_allowed', 'This status change is not allowed now.'));
        }
        const intoHold = move.toCode === 'on_hold';
        if (intoHold) {
          // Q-B9: both are mandatory, in this same request.
          if (request.holdType === undefined) throw invalid('holdType', 'Choose the hold type.');
          if (request.holdReasonCode === undefined) throw invalid('holdReasonCode', 'Choose a hold reason.');
          const reason = MOCK_HOLD_REASONS.find((entry) => entry.code === request.holdReasonCode);
          if (!reason || reason.holdType !== request.holdType) {
            throw invalid('holdReasonCode', 'Choose a hold reason of the selected type.');
          }
        }
        const changedAt = now().toISOString();
        // Leaving hold clears its active details (history keeps the move).
        const hold = intoHold
          ? { holdType: request.holdType ?? null, holdReasonCode: request.holdReasonCode ?? null }
          : { holdType: null, holdReasonCode: null };
        items.set(item.uuid, { ...item, status: move.toCode, ...hold, updatedAt: changedAt });
        bump(item.uuid);
        const event: HistoryEvent = {
          fromCode: move.fromCode,
          toCode: move.toCode,
          actorUserUuid: MOCK_ACTOR,
          occurredAt: changedAt,
        };
        if (request.comment !== undefined) event.comment = request.comment;
        history.set(item.uuid, [event, ...(history.get(item.uuid) ?? [])]);
        const result: TransitionResult = {
          serviceItemUuid: item.uuid,
          fromCode: move.fromCode,
          toCode: move.toCode,
          changedAt,
          actorUserUuid: MOCK_ACTOR,
        };
        if (intoHold && request.holdType !== undefined && request.holdReasonCode !== undefined) {
          result.holdType = request.holdType;
          result.holdReasonCode = request.holdReasonCode;
        }
        return { data: result, etag: etagOf(item.uuid) };
      }),

    history: (serviceItemUuid) =>
      respond(() => {
        getItem(serviceItemUuid);
        return history.get(serviceItemUuid) ?? [];
      }),
  };
}

/** The fake behind the app's `ServiceApi` interface (Bill To BLOCKED, no orders list), no latency. */
export function createFakeServiceApi(options: MockOptions = {}): ServiceApi {
  return {
    ...createMockServiceApi({ latencyMs: 0, ...options }),
    orders: () => Promise.resolve([]),
    createOrder: () => Promise.reject(new ApiError(0, { code: 'client.blocked', message: 'Not in the contract.' }, 'blocked')),
    ordersEvidence: 'MOCK',
    billToAvailable: false,
  };
}
