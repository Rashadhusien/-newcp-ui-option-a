/**
 * In-memory mock of the service-instance API, shaped like the reference
 * contract (package v0.9.2). Behaviour follows the contract and the
 * approved Q-B8 to Q-B15 decisions:
 * - create always makes a NEW instance (new UUID, next line number), even
 *   for a type the order already has; the same Idempotency-Key returns the
 *   first result (R11, proposed). Quantity defaults to 1 (demo, Q-B13).
 * - Q-B8: every item has a version (ETag); edits and transitions need
 *   If-Match: missing -> 428, stale -> 412, and nothing is written.
 * - Q-B9: On Hold only through a transition carrying holdType and a
 *   matching "Demo only" reason; leaving hold clears both.
 * - Q-B10: the contract price is the initial unit price; a clerk with
 *   `canEditPrice` may override it and the override is kept. A final line
 *   total of zero needs a zero-charge reason: 422 ZERO_CHARGE_REASON_REQUIRED
 *   on `zeroChargeReasonCode`.
 * - Q-B14: Billable and Bill To are independent; each is permission- and
 *   lock-checked on its own. Invoiced items are financially locked (409).
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
  type FormDefinition,
  type HistoryEvent,
  type HoldType,
  type NewCpClient,
  type Problem,
  type ServiceItem,
  type TransitionResult,
  type ZeroChargeReason,
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
import { specForService } from '../forms/formSpecs';
import { mockFormDefinition } from '../forms/mockFormDefinition';

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

/** The mock also serves zero-charge reasons, which the reference contract has no endpoint for (Q-B17). */
export interface MockServiceApi extends NewCpClient {
  zeroChargeReasons(): Promise<ZeroChargeReason[]>;
}

const MOCK_ACTOR = '00000000-0000-0000-0000-0000000000a1';
const PRICE_PATTERN = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/;

function copy<T>(value: T): T {
  return structuredClone(value);
}

function problem(code: string, message: string, details?: Record<string, unknown>): Problem {
  return details ? { code, message, details } : { code, message };
}

function invalid(field: string, message: string, code = 'mock.invalid_field'): ApiError {
  return new ApiError(422, problem(code, message, { field }));
}

/** Mock line total: unit price x quantity, 2 decimals (the server owns real totals). */
function lineTotalOf(unitPrice: string | undefined, quantity: number | undefined): string | undefined {
  if (unitPrice === undefined) return undefined;
  return (Number(unitPrice) * (quantity ?? 1)).toFixed(2);
}

export function createMockServiceApi(options: MockOptions = {}): MockServiceApi {
  const latency = options.latencyMs ?? 300;
  const now = options.now ?? (() => new Date());
  const items = new Map<string, ServiceItem>(
    (options.items ?? MOCK_SERVICE_ITEMS).map((item) => [item.uuid, copy(item)]),
  );
  const revisions = new Map<string, number>([...items.keys()].map((uuid) => [uuid, 1]));
  const holds = new Map<string, { holdType: HoldType; holdReasonCode: string }>();
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

  function financialLock(what: string): ApiError {
    return new ApiError(409, problem('mock.financial_lock', `The ${what} cannot change after the service is invoiced.`));
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
        const service = MOCK_CATALOG.find((entry) => entry.uuid === serviceUuid);
        if (!service) throw new ApiError(404, problem('mock.not_found', 'Service not found.'));
        const spec = specForService(service.code);
        return spec
          ? mockFormDefinition(service, spec)
          : { service, fields: [], evidence: 'MOCK: no form spec for this service' };
      }),

    holdReasons: (holdType) => respond(() => MOCK_HOLD_REASONS.filter((reason) => reason.holdType === holdType)),

    zeroChargeReasons: () => respond(() => MOCK_ZERO_CHARGE_REASONS.filter((reason) => reason.active)),

    eligibleBilledParties: (orderUuid) => respond(() => [...eligible(orderUuid)]),

    orderItems: (orderUuid) =>
      respond(() =>
        [...items.values()]
          .filter((item) => item.orderUuid === orderUuid)
          .sort((a, b) => (a.lineNumber ?? 0) - (b.lineNumber ?? 0))
          .map(withEtag),
      ),

    create: (orderUuid, request, idempotencyKey) =>
      respond(() => {
        if (idempotencyKey) {
          const existing = idempotent.get(idempotencyKey);
          if (existing) return withEtag(getItem(existing));
        }
        if (!MOCK_CATALOG.some((entry) => entry.uuid === request.sellableItemUuid)) {
          throw invalid('sellableItemUuid', 'Unknown service.', 'mock.unknown_service');
        }
        if (request.billedToContactUuid) assertEligiblePayer(orderUuid, request.billedToContactUuid);
        assertQuantity(request.quantity);
        assertUnitPrice(request.unitPrice);
        assertZeroChargeReason(request.zeroChargeReasonCode);
        const quantity = request.quantity ?? 1;
        const unitPrice = request.unitPrice ?? MOCK_CONTRACT_UNIT_PRICE;
        const lineTotal = lineTotalOf(unitPrice, quantity);
        assertZeroTotalHasReason(lineTotal, request.zeroChargeReasonCode);
        const lines = [...items.values()]
          .filter((item) => item.orderUuid === orderUuid)
          .map((item) => item.lineNumber ?? 0);
        const created: ServiceItem = {
          uuid: newUuid(),
          orderUuid,
          sellableItemUuid: request.sellableItemUuid,
          lineNumber: Math.max(0, ...lines) + 1,
          quantity,
          status: 'submitted',
          isBillable: request.isBillable ?? true,
          canEditBillability: true,
          isRedo: request.isRedo ?? false,
          isInvoiced: false,
          currencyCode: MOCK_CURRENCY,
          unitPrice,
          lineTotal,
          canEditPrice: true,
          answers: copy(request.answers),
          billedToContactUuid: request.billedToContactUuid ?? MOCK_DOCTOR_UUID,
          billedPartyOrigin: request.billedToContactUuid ? 'user_selected' : 'order_default',
          canEditBilledParty: true,
          zeroChargeReasonCode: request.zeroChargeReasonCode ?? null,
          zeroChargeNote: request.zeroChargeNote ?? null,
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
        if (patch.billedToContactUuid !== undefined) {
          if (item.isInvoiced) throw financialLock('payer');
          if (item.canEditBilledParty === false) {
            throw new ApiError(403, problem('mock.forbidden', 'You may not change the payer.'));
          }
          assertEligiblePayer(item.orderUuid, patch.billedToContactUuid);
        }
        if (patch.isBillable !== undefined && patch.isBillable !== item.isBillable) {
          if (item.canEditBillability === false) {
            throw new ApiError(403, problem('mock.forbidden', 'You may not change billability.'));
          }
          if (item.isInvoiced) throw financialLock('billability');
        }
        if (patch.unitPrice !== undefined && patch.unitPrice !== item.unitPrice) {
          if (item.canEditPrice === false) {
            throw new ApiError(403, problem('mock.forbidden', 'You may not change the price.'));
          }
          if (item.isInvoiced) throw financialLock('price');
        }
        assertQuantity(patch.quantity);
        assertUnitPrice(patch.unitPrice);
        assertZeroChargeReason(patch.zeroChargeReasonCode);
        const unitPrice = patch.unitPrice ?? item.unitPrice;
        const quantity = patch.quantity ?? item.quantity;
        const lineTotal = lineTotalOf(unitPrice, quantity);
        const reason = patch.zeroChargeReasonCode !== undefined ? patch.zeroChargeReasonCode : item.zeroChargeReasonCode;
        assertZeroTotalHasReason(lineTotal, reason);

        // Everything is validated before anything changes: no partial update.
        const updated: ServiceItem = { ...item };
        if (patch.answers !== undefined) updated.answers = copy(patch.answers);
        if (patch.isRedo !== undefined) updated.isRedo = patch.isRedo;
        if (patch.serviceNotes !== undefined) updated.serviceNotes = patch.serviceNotes;
        if (patch.isBillable !== undefined) updated.isBillable = patch.isBillable;
        if (patch.quantity !== undefined) updated.quantity = patch.quantity;
        if (patch.unitPrice !== undefined) updated.unitPrice = patch.unitPrice;
        if (lineTotal !== undefined) updated.lineTotal = lineTotal;
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
        items.set(item.uuid, { ...item, status: move.toCode });
        if (intoHold && request.holdType !== undefined && request.holdReasonCode !== undefined) {
          holds.set(item.uuid, { holdType: request.holdType, holdReasonCode: request.holdReasonCode });
        } else {
          // Leaving hold clears its active details (history keeps them).
          holds.delete(item.uuid);
        }
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
          ...holds.get(item.uuid),
        };
        return { data: result, etag: etagOf(item.uuid) };
      }),

    history: (serviceItemUuid) =>
      respond(() => {
        getItem(serviceItemUuid);
        return history.get(serviceItemUuid) ?? [];
      }),
  };
}
