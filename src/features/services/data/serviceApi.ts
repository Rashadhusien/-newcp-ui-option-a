/**
 * Service-instance data adapter: the one entry point the services feature
 * uses for API data. Every operation of the canonical contract calls the
 * real API (A38): Bearer token from the in-memory session, never a tenant.
 *
 * Not integrated, and why:
 * - Bill To: `GET /orders/{orderUuid}/eligible-billed-parties` is an
 *   "endpoint proposal" in the contract and F07 is not runtime-certified, so
 *   the adapter never calls it and never sends `billedToContactUuid`; the UI
 *   shows Bill To as BLOCKED until a live check (A31).
 * - Orders list and create order: not in the contract (Q-B26, Q-B24).
 *   `VITE_USE_MOCKS` (default true) shows synthetic, display-only orders
 *   labelled MOCK; `false` rejects with kind `blocked` and sends nothing.
 *
 * Every rejected call is reported to the session (`reportAccessError`), so a
 * 401 returns to sign-in and a 403 refreshes the session context.
 */

import {
  ApiError,
  bearerTokenSource,
  createNewCpClient,
  evidenceOf,
  readApiConfig,
  type ApiConfig,
  type ApiEvidence,
  type NewCpClient,
  type RequestOptions,
  type TokenSource,
} from '@/shared/api';
import { MOCK_ORDERS, type MockOrderHeader } from '@/mocks/orderFixtures';
import { MOCK_SERVICE_ITEMS } from '@/mocks/serviceFixtures';
import { reportAccessError } from '@/shared/lib/session';
import type { CreateOrderRequest, CreateOrderResult, OrderSummary } from './orderSummary';

export interface ServiceApi extends NewCpClient {
  /** Label of the screens without an endpoint (orders list, create order): MOCK or BLOCKED. */
  readonly ordersEvidence: Exclude<ApiEvidence, 'INTEGRATED'>;
  /** false = Bill To is BLOCKED; the UI must not offer it as real. */
  readonly billToAvailable: boolean;
  /**
   * Order-level list with each order's services (A19). Not in the contract
   * (Q-B26): synthetic orders with VITE_USE_MOCKS, otherwise rejects with
   * kind `blocked` and nothing is sent.
   */
  orders(options?: RequestOptions): Promise<OrderSummary[]>;
  /**
   * Creates an order (A21 wizard). Not in the contract (Q-B24): with
   * VITE_USE_MOCKS a synthetic order header is kept in memory and no service
   * is sent to the API; otherwise rejects with kind `blocked`.
   */
  createOrder(request: CreateOrderRequest): Promise<CreateOrderResult>;
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
  'Bill To is not available yet: the payer endpoint has not been checked live on the test server (F07 runtime unverified).';

/** Removes the payer from a request body: never sent while Bill To is BLOCKED. */
function withoutPayer<T extends { billedToContactUuid?: string }>(body: T): T {
  const rest = { ...body };
  delete rest.billedToContactUuid;
  return rest;
}

/** Synthetic orders (display only) for the screens without an endpoint. */
function mockOrders(): Pick<ServiceApi, 'orders' | 'createOrder'> {
  // Orders created by the A21 wizard in this tab (memory only; a reload starts from the fixtures again).
  const createdOrders: MockOrderHeader[] = [];
  let nextOrder = 0;
  return {
    orders: () =>
      Promise.resolve(
        [...MOCK_ORDERS, ...createdOrders].map((header) => ({
          ...header,
          services: MOCK_SERVICE_ITEMS.filter((item) => item.orderUuid === header.orderUuid),
        })),
      ),
    createOrder: (request: CreateOrderRequest) => {
      nextOrder += 1;
      const orderUuid = `00000000-0000-4000-8000-${String(nextOrder).padStart(12, '0')}`;
      const orderNumber = `ORD-${String(3000 + nextOrder)}`;
      createdOrders.push({
        orderUuid,
        orderNumber,
        clientName: request.clientName,
        patientCode: request.patientCode,
        receivedOn: new Date().toISOString().slice(0, 10),
        dueOn: request.dueOn,
      });
      return Promise.resolve({ orderUuid, orderNumber });
    },
  };
}

export function createServiceApi(
  config: ApiConfig = readApiConfig(),
  // The New CP session token from POST /auth/login, in memory (A25, D-67).
  tokenSource: TokenSource = bearerTokenSource,
): ServiceApi {
  const client = createNewCpClient(config.baseUrl, tokenSource);
  const orders: Pick<ServiceApi, 'orders' | 'createOrder'> = config.useMocks
    ? mockOrders()
    : {
        orders: () => Promise.reject(blocked('The order list is not in the API contract yet (question Q-B26).')),
        createOrder: () =>
          Promise.reject(blocked('Creating an order is not in the API contract yet (question Q-B24). Nothing was sent.')),
      };
  return reportingAccess<ServiceApi>({
    ...client,
    ...orders,
    eligibleBilledParties: () => Promise.reject(blocked(BILL_TO_BLOCKED)),
    create: (orderUuid, item, idempotencyKey, options) =>
      client.create(orderUuid, withoutPayer(item), idempotencyKey, options),
    edit: (serviceItemUuid, patch, ifMatch, options) =>
      client.edit(serviceItemUuid, withoutPayer(patch), ifMatch, options),
    ordersEvidence: evidenceOf(config),
    billToAvailable: false,
  });
}

/** App-wide instance. */
export const serviceApi: ServiceApi = createServiceApi();
