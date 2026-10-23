/**
 * In-memory mock of the service-instance API, contract-shaped (OpenAPI
 * v0.9.0-draft). Behaviour follows the contract's descriptions:
 * - create always makes a NEW instance (new UUID, next line number), even
 *   for a type the order already has; the same Idempotency-Key returns the
 *   first result instead of a duplicate (R11, proposed);
 * - an omitted payer copies the order default once (`order_default`); an
 *   explicit one must be eligible for the order and is `user_selected`;
 * - payer changes on an invoiced item are rejected with 409, and with 403
 *   when the item says the user may not edit the payer;
 * - only listed transitions are accepted, and each one adds a history event.
 * Problem `code` values are mock-only (`mock.*`) until Q-B7.
 *
 * Data is copied in and out, so callers can never mutate the store, and one
 * instance's change can never leak into another.
 */

import {
  ApiError,
  type AvailableTransition,
  type BilledPartyChoice,
  type CatalogService,
  type FormDefinition,
  type HistoryEvent,
  type NewCpClient,
  type Problem,
  type ServiceItem,
} from '@/shared/api';
import {
  MOCK_BILLED_PARTIES,
  MOCK_CATALOG,
  MOCK_DOCTOR_UUID,
  MOCK_SERVICE_ITEMS,
  MOCK_TRANSITIONS,
} from '@/mocks/serviceFixtures';

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

const MOCK_ACTOR = '00000000-0000-0000-0000-0000000000a1';

function copy<T>(value: T): T {
  return structuredClone(value);
}

function problem(code: string, message: string, details?: Record<string, unknown>): Problem {
  return details ? { code, message, details } : { code, message };
}

export function createMockServiceApi(options: MockOptions = {}): NewCpClient {
  const latency = options.latencyMs ?? 300;
  const now = options.now ?? (() => new Date());
  const items = new Map<string, ServiceItem>(
    (options.items ?? MOCK_SERVICE_ITEMS).map((item) => [item.uuid, copy(item)]),
  );
  const history = new Map<string, HistoryEvent[]>();
  const idempotent = new Map<string, string>();
  let nextUuid = 0x100;
  // Stable ids per (from, to) pair so a listed transition can be re-checked.
  const transitionIds = new Map<string, number>();

  async function respond<T>(produce: () => T): Promise<T> {
    if (latency > 0) await new Promise((resolve) => setTimeout(resolve, latency));
    if (options.failWith != null) {
      if (options.failWith === 0) throw ApiError.network();
      throw new ApiError(options.failWith, problem('mock.injected', `Injected mock failure (${String(options.failWith)}).`));
    }
    return copy(produce());
  }

  function getItem(uuid: string): ServiceItem {
    const item = items.get(uuid);
    if (!item) throw new ApiError(404, problem('mock.not_found', 'Service item not found.'));
    return item;
  }

  function eligible(orderUuid: string): readonly BilledPartyChoice[] {
    return orderUuid === MOCK_SERVICE_ITEMS[0]?.orderUuid ? MOCK_BILLED_PARTIES : [];
  }

  function assertEligiblePayer(orderUuid: string, contactUuid: string): void {
    if (!eligible(orderUuid).some((party) => party.contactUuid === contactUuid)) {
      throw new ApiError(
        422,
        problem('mock.ineligible_payer', 'This contact cannot be billed for this order.', {
          field: 'billedToContactUuid',
        }),
      );
    }
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
    catalog: (categoryCode) =>
      respond((): CatalogService[] => (categoryCode ? [] : [...MOCK_CATALOG])),

    formSchema: (serviceUuid) =>
      respond((): FormDefinition => {
        const service = MOCK_CATALOG.find((entry) => entry.uuid === serviceUuid);
        if (!service) throw new ApiError(404, problem('mock.not_found', 'Service not found.'));
        // Fields arrive in A6R from the v0.6 form specs; tenant mapping is R02.
        return { service, fields: [], evidence: 'MOCK: field mapping unresolved (R02)' };
      }),

    eligibleBilledParties: (orderUuid) => respond(() => [...eligible(orderUuid)]),

    orderItems: (orderUuid) =>
      respond(() =>
        [...items.values()]
          .filter((item) => item.orderUuid === orderUuid)
          .sort((a, b) => (a.lineNumber ?? 0) - (b.lineNumber ?? 0)),
      ),

    create: (orderUuid, request, idempotencyKey) =>
      respond(() => {
        if (idempotencyKey) {
          const existing = idempotent.get(idempotencyKey);
          if (existing) return getItem(existing);
        }
        if (!MOCK_CATALOG.some((entry) => entry.uuid === request.sellableItemUuid)) {
          throw new ApiError(
            422,
            problem('mock.unknown_service', 'Unknown service.', { field: 'sellableItemUuid' }),
          );
        }
        if (request.billedToContactUuid) assertEligiblePayer(orderUuid, request.billedToContactUuid);
        const lines = [...items.values()]
          .filter((item) => item.orderUuid === orderUuid)
          .map((item) => item.lineNumber ?? 0);
        const created: ServiceItem = {
          uuid: newUuid(),
          orderUuid,
          sellableItemUuid: request.sellableItemUuid,
          lineNumber: Math.max(0, ...lines) + 1,
          status: 'submitted',
          isRedo: request.isRedo ?? false,
          isInvoiced: false,
          answers: copy(request.answers),
          billedToContactUuid: request.billedToContactUuid ?? MOCK_DOCTOR_UUID,
          billedPartyOrigin: request.billedToContactUuid ? 'user_selected' : 'order_default',
          canEditBilledParty: true,
        };
        if (request.serviceNotes !== undefined) created.serviceNotes = request.serviceNotes;
        items.set(created.uuid, created);
        if (idempotencyKey) idempotent.set(idempotencyKey, created.uuid);
        return created;
      }),

    item: (serviceItemUuid) => respond(() => getItem(serviceItemUuid)),

    edit: (serviceItemUuid, patch) =>
      respond(() => {
        const item = getItem(serviceItemUuid);
        if (Object.keys(patch).length === 0) {
          throw new ApiError(400, problem('mock.empty_patch', 'Nothing to change.'));
        }
        if (patch.billedToContactUuid !== undefined) {
          if (item.isInvoiced) {
            throw new ApiError(
              409,
              problem('mock.payer_locked', 'The payer cannot change after the service is invoiced.'),
            );
          }
          if (item.canEditBilledParty === false) {
            throw new ApiError(403, problem('mock.forbidden', 'You may not change the payer.'));
          }
          assertEligiblePayer(item.orderUuid, patch.billedToContactUuid);
        }
        // Validate everything before changing anything: no partial update.
        const updated: ServiceItem = { ...item };
        if (patch.answers !== undefined) updated.answers = copy(patch.answers);
        if (patch.isRedo !== undefined) updated.isRedo = patch.isRedo;
        if (patch.serviceNotes !== undefined) updated.serviceNotes = patch.serviceNotes;
        if (patch.billedToContactUuid !== undefined) {
          updated.billedToContactUuid = patch.billedToContactUuid;
          updated.billedPartyOrigin = 'user_selected';
        }
        items.set(item.uuid, updated);
        return updated;
      }),

    availableTransitions: (serviceItemUuid) =>
      respond(() => transitionsFor(getItem(serviceItemUuid))),

    transition: (serviceItemUuid, request) =>
      respond(() => {
        const item = getItem(serviceItemUuid);
        const move = transitionsFor(item).find((entry) => entry.transitionId === request.transitionId);
        if (!move) {
          throw new ApiError(
            409,
            problem('mock.transition_not_allowed', 'This status change is not allowed now.'),
          );
        }
        const changedAt = now().toISOString();
        items.set(item.uuid, { ...item, status: move.toCode });
        const event: HistoryEvent = {
          fromCode: move.fromCode,
          toCode: move.toCode,
          actorUserUuid: MOCK_ACTOR,
          occurredAt: changedAt,
        };
        if (request.comment !== undefined) event.comment = request.comment;
        history.set(item.uuid, [event, ...(history.get(item.uuid) ?? [])]);
        return {
          serviceItemUuid: item.uuid,
          fromCode: move.fromCode,
          toCode: move.toCode,
          changedAt,
          actorUserUuid: MOCK_ACTOR,
        };
      }),

    history: (serviceItemUuid) =>
      respond(() => {
        getItem(serviceItemUuid);
        return history.get(serviceItemUuid) ?? [];
      }),
  };
}
