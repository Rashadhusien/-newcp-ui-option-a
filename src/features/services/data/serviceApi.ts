/**
 * Service-instance data adapter: the one entry point the services feature
 * uses for API data. Mock and real implementations share one interface
 * (the contract client's), plus what the UI must know to stay honest:
 * the evidence label, the demo order, and which parts are unavailable.
 *
 * Mock is the default (`VITE_USE_MOCKS`, see shared/api/config). For manual
 * checks the mock reads `?fail=<status>` from the page URL and fails every
 * call with that status (400, 401, 403, 404, 409, 412, 422, 428, 500, or 0
 * for a network failure).
 *
 * Bill To (D-44): current V3 has no `billed_to_contact_id` /
 * `billed_party_origin`, so with the real API the adapter never calls
 * eligible-billed-parties and never sends `billedToContactUuid`; the UI
 * shows Bill To as BLOCKED. Zero-charge reasons have no endpoint in the
 * reference contract (Q-B17), so only the mock lists them.
 *
 * Access (IAM v0.9.7): the mock checks the signed-in mock identity's
 * capabilities like the server would (`mockAccess.ts`). In both modes every
 * rejected call is reported to the session (`reportAccessError`), so a 401
 * returns to sign-in and a 403 refreshes the session context. Neither mode
 * ever sends a tenant: no `tenantId`, no `X-Tenant-Id`.
 */

import {
  ApiError,
  bearerTokenSource,
  createNewCpClient,
  readApiConfig,
  type ApiConfig,
  type ApiEvidence,
  type NewCpClient,
  type RequestOptions,
  type TokenSource,
  type ZeroChargeReason,
} from '@/shared/api';
import { MOCK_ORDERS, type MockOrderHeader } from '@/mocks/orderFixtures';
import { MOCK_ORDER_UUID } from '@/mocks/serviceFixtures';
import { mockSessionContext } from '@/mocks/sessionFixtures';
import { mockIdentity, reportAccessError } from '@/shared/lib/session';
import type { DashboardData } from './dashboardData';
import { mockAccessError, withMockAccess } from './mockAccess';
import { createMockServiceApi } from './mockServiceApi';
import type { CreateOrderRequest, CreateOrderResult, OrderSummary } from './orderSummary';

export interface ServiceApi extends NewCpClient {
  readonly evidence: ApiEvidence;
  /**
   * The order the demo works on. The contract has no order lookup yet
   * (Q-B3), so only the mock can name one; null with the real API.
   */
  readonly demoOrderUuid: string | null;
  /** false = Bill To is BLOCKED (F07 columns absent); the UI must not offer it as real. */
  readonly billToAvailable: boolean;
  /** Mock only; with the real API this rejects with kind `blocked` (Q-B17). */
  zeroChargeReasons(): Promise<ZeroChargeReason[]>;
  /**
   * Order-level list with each order's services (A19). Mock only: the
   * endpoint is not in the contract yet (Q-B26); with the real API this
   * rejects with kind `blocked` and nothing is sent.
   */
  orders(options?: RequestOptions): Promise<OrderSummary[]>;
  /**
   * Creates an order with its services (A21 wizard). Mock only: create order
   * is not in the contract (Q-B24); with the real API this rejects with kind
   * `blocked` and nothing is sent.
   */
  createOrder(request: CreateOrderRequest): Promise<CreateOrderResult>;
  /**
   * Everything the Dashboard counts (A28). No dashboard or report endpoint
   * is in the contract (G3): mock only, checked like a report read
   * (`reports.view_all`, so FINANCE and QC may see it); with the real API
   * this rejects with kind `blocked` and nothing is sent.
   */
  dashboardData(options?: RequestOptions): Promise<DashboardData>;
}


/** The signed-in mock identity's context, read on every call (no React needed). */
function currentMockContext() {
  const identity = mockIdentity();
  return identity === null ? null : mockSessionContext(identity);
}

/** Reports every rejection to the session, then rethrows it unchanged. */
function reportingAccess<T extends object>(api: T): T {
  const wrapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(api)) {
    wrapped[key] =
      typeof value === 'function'
        ? (...args: unknown[]) =>
            (value as (...a: unknown[]) => Promise<unknown>)(...args).catch((error: unknown) => {
              reportAccessError(error);
              throw error;
            })
        : value;
  }
  // Same keys and signatures as `api`; only the rejection path gains a side effect.
  return wrapped as T;
}

function blocked(message: string): ApiError {
  return new ApiError(0, { code: 'client.blocked', message }, 'blocked');
}

const BILL_TO_BLOCKED =
  'Bill To is not available yet: the payer columns are missing in the current database (F07 not applied).';

function failStatusFromUrl(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = new URLSearchParams(window.location.search).get('fail');
  if (value == null) return undefined;
  const status = Number.parseInt(value, 10);
  return Number.isInteger(status) ? status : undefined;
}

/** Removes the payer from a request body: never sent while F07 is absent. */
function withoutPayer<T extends { billedToContactUuid?: string }>(body: T): T {
  const rest = { ...body };
  delete rest.billedToContactUuid;
  return rest;
}

export function createServiceApi(
  config: ApiConfig = readApiConfig(),
  // Real API: the New CP session token from POST /auth/login, in memory (A25, D-67).
  tokenSource: TokenSource = bearerTokenSource,
): ServiceApi {
  if (config.useMocks) {
    const raw = createMockServiceApi({ failWith: failStatusFromUrl() });
    const mock = withMockAccess(raw, currentMockContext);
    // Orders created by the A21 wizard in this tab (memory only; a reload starts from the fixtures again).
    const createdOrders: MockOrderHeader[] = [];
    let nextOrder = 0;
    return reportingAccess({
      ...mock,
      // Each order's services come from the access-checked mock, so a role without service rights gets the 403.
      orders: (options?: RequestOptions) =>
        Promise.all(
          [...MOCK_ORDERS, ...createdOrders].map(async (header) => ({
            ...header,
            services: await mock.orderItems(header.orderUuid, options),
          })),
        ),
      createOrder: async (request: CreateOrderRequest) => {
        nextOrder += 1;
        const orderUuid = `00000000-0000-4000-8000-${String(nextOrder).padStart(12, '0')}`;
        const orderNumber = `ORD-${String(3000 + nextOrder)}`;
        const teethByService: Record<string, number[]> = {};
        // Services are created one by one through the access-checked mock (needs service.create).
        for (const service of request.services) {
          const created = await mock.create(orderUuid, {
            sellableItemUuid: service.sellableItemUuid,
            answers: service.answers,
            quantity: 1,
          });
          teethByService[created.uuid] = service.teeth;
        }
        createdOrders.push({
          orderUuid,
          orderNumber,
          clientName: request.clientName,
          patientCode: request.patientCode,
          receivedOn: new Date().toISOString().slice(0, 10),
          dueOn: request.dueOn,
          teethByService,
        });
        return { orderUuid, orderNumber };
      },
      dashboardData: async (options?: RequestOptions) => {
        const denied = mockAccessError(currentMockContext(), ['reports.view_all']);
        if (denied) throw denied;
        // Read like a report: all orders' services, unfiltered by service rights.
        const headers = [...MOCK_ORDERS, ...createdOrders];
        const services = (await Promise.all(headers.map((header) => raw.orderItems(header.orderUuid, options)))).flat();
        const [catalog, histories] = await Promise.all([
          raw.catalog(undefined, options),
          Promise.all(services.map((item) => raw.history(item.uuid, options))),
        ]);
        const activity = histories.flatMap((events, index) =>
          events.map((event) => ({ ...event, serviceItemUuid: services[index]?.uuid ?? '' })),
        );
        return { services, catalog, activity };
      },
      evidence: 'MOCK',
      demoOrderUuid: MOCK_ORDER_UUID,
      billToAvailable: true,
    });
  }
  const client = createNewCpClient(config.baseUrl, tokenSource);
  return reportingAccess<ServiceApi>({
    ...client,
    eligibleBilledParties: () => Promise.reject(blocked(BILL_TO_BLOCKED)),
    create: (orderUuid, item, idempotencyKey, options) =>
      client.create(orderUuid, withoutPayer(item), idempotencyKey, options),
    edit: (serviceItemUuid, patch, ifMatch, options) =>
      client.edit(serviceItemUuid, withoutPayer(patch), ifMatch, options),
    zeroChargeReasons: () =>
      Promise.reject(blocked('Zero-charge reasons are not in the API contract yet (question Q-B17).')),
    orders: () => Promise.reject(blocked('The order list is not in the API contract yet (question Q-B26).')),
    createOrder: () =>
      Promise.reject(blocked('Creating an order is not in the API contract yet (question Q-B24). Nothing was sent.')),
    dashboardData: () =>
      Promise.reject(blocked('There is no dashboard or report endpoint in the API contract yet (G3). Nothing was sent.')),
    evidence: 'INTEGRATED',
    demoOrderUuid: null,
    billToAvailable: false,
  });
}

/** App-wide instance. */
export const serviceApi: ServiceApi = createServiceApi();
