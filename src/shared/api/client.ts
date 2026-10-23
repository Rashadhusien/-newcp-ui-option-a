/**
 * New CP API client: the only place that calls `fetch`.
 *
 * Paths, verbs, headers and query parameters follow the v1 contract
 * (docs/openapi/newcp-v1.openapi.yaml); the structure was ported from the
 * package's typed client (v0.9, archival). Response types: ./types. No token is stored here; the caller supplies a token
 * source. Response bodies are trusted to match the contract at this one
 * boundary; contract drift shows up in the typed adapter and its tests.
 */

import { ApiError, asProblem } from './apiError';
import type {
  AvailableTransition,
  BilledPartyChoice,
  CatalogService,
  CreateServiceItem,
  FormDefinition,
  HistoryEvent,
  HoldReason,
  HoldType,
  PatchServiceItem,
  ServiceItem,
  TransitionRequest,
  TransitionResult,
  ZeroChargeReason,
} from './types';

export type TokenSource = () => Promise<string> | string;

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface NewCpClient {
  catalog(categoryCode?: string, options?: RequestOptions): Promise<CatalogService[]>;
  formSchema(serviceUuid: string, options?: RequestOptions): Promise<FormDefinition>;
  eligibleBilledParties(orderUuid: string, options?: RequestOptions): Promise<BilledPartyChoice[]>;
  orderItems(orderUuid: string, options?: RequestOptions): Promise<ServiceItem[]>;
  create(
    orderUuid: string,
    item: CreateServiceItem,
    idempotencyKey?: string,
    options?: RequestOptions,
  ): Promise<ServiceItem>;
  item(serviceItemUuid: string, options?: RequestOptions): Promise<ServiceItem>;
  edit(serviceItemUuid: string, patch: PatchServiceItem, options?: RequestOptions): Promise<ServiceItem>;
  availableTransitions(serviceItemUuid: string, options?: RequestOptions): Promise<AvailableTransition[]>;
  transition(
    serviceItemUuid: string,
    request: TransitionRequest,
    options?: RequestOptions,
  ): Promise<TransitionResult>;
  history(serviceItemUuid: string, options?: RequestOptions): Promise<HistoryEvent[]>;
  zeroChargeReasons(options?: RequestOptions): Promise<ZeroChargeReason[]>;
  holdReasons(holdType?: HoldType, options?: RequestOptions): Promise<HoldReason[]>;
}

export function createNewCpClient(
  baseUrl: string,
  tokenSource: TokenSource,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): NewCpClient {
  const root = baseUrl.replace(/\/$/, '');
  const esc = encodeURIComponent;

  async function invoke<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await tokenSource();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    if (init.body != null) headers.set('Content-Type', 'application/json');

    let response: Response;
    try {
      response = await fetchImpl(root + path, { ...init, headers });
    } catch (error) {
      // An abort is the caller's decision, not a network failure.
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw ApiError.network();
    }

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, asProblem(body));
    return body as T;
  }

  return {
    catalog: (categoryCode, options) =>
      invoke(
        `/api/v1/catalog/services${categoryCode ? `?categoryCode=${esc(categoryCode)}` : ''}`,
        { signal: options?.signal },
      ),
    formSchema: (serviceUuid, options) =>
      invoke(`/api/v1/catalog/services/${esc(serviceUuid)}/form-schema`, { signal: options?.signal }),
    eligibleBilledParties: (orderUuid, options) =>
      invoke(`/api/v1/orders/${esc(orderUuid)}/eligible-billed-parties`, { signal: options?.signal }),
    orderItems: (orderUuid, options) =>
      invoke(`/api/v1/orders/${esc(orderUuid)}/services`, { signal: options?.signal }),
    create: (orderUuid, item, idempotencyKey, options) =>
      invoke(`/api/v1/orders/${esc(orderUuid)}/services`, {
        method: 'POST',
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
        body: JSON.stringify(item),
        signal: options?.signal,
      }),
    item: (serviceItemUuid, options) =>
      invoke(`/api/v1/services/${esc(serviceItemUuid)}`, { signal: options?.signal }),
    edit: (serviceItemUuid, patch, options) =>
      invoke(`/api/v1/services/${esc(serviceItemUuid)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        signal: options?.signal,
      }),
    availableTransitions: (serviceItemUuid, options) =>
      invoke(`/api/v1/services/${esc(serviceItemUuid)}/available-transitions`, {
        signal: options?.signal,
      }),
    transition: (serviceItemUuid, request, options) =>
      invoke(`/api/v1/services/${esc(serviceItemUuid)}/transitions`, {
        method: 'POST',
        body: JSON.stringify(request),
        signal: options?.signal,
      }),
    history: (serviceItemUuid, options) =>
      invoke(`/api/v1/services/${esc(serviceItemUuid)}/history`, { signal: options?.signal }),
    zeroChargeReasons: (options) =>
      invoke('/api/v1/lookups/zero-charge-reasons', { signal: options?.signal }),
    holdReasons: (holdType, options) =>
      invoke(`/api/v1/lookups/hold-reasons${holdType ? `?holdType=${esc(holdType)}` : ''}`, {
        signal: options?.signal,
      }),
  };
}
