/**
 * New CP API client: the only place that calls `fetch`.
 *
 * Paths, verbs, headers and query parameters follow the canonical contract
 * (docs/openapi/newcp.openapi.yaml, D-79). Q-B8: reading one item returns its ETag;
 * PATCH and transitions send it back as If-Match and return the new one.
 * No token is stored here; the caller supplies a token source. Response
 * bodies are trusted to match the contract at this one boundary.
 */

import { ApiError, asProblem } from './apiError';
import type {
  AvailableTransition,
  BilledPartyChoice,
  CatalogService,
  CreateServiceItem,
  FormDefinition,
  HistoryEvent,
  HoldReasonOption,
  HoldType,
  PatchServiceItem,
  ZeroChargeReason,
  ServiceItem,
  TransitionRequest,
  TransitionResult,
  WithVersion,
} from './types';

export type TokenSource = () => Promise<string> | string;

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface NewCpClient {
  catalog(categoryCode?: string, options?: RequestOptions): Promise<CatalogService[]>;
  formSchema(serviceUuid: string, options?: RequestOptions): Promise<FormDefinition>;
  holdReasons(holdType: HoldType, options?: RequestOptions): Promise<HoldReasonOption[]>;
  /** Active reasons; a zero line total needs one (Q-B17). */
  zeroChargeReasons(options?: RequestOptions): Promise<ZeroChargeReason[]>;
  eligibleBilledParties(orderUuid: string, options?: RequestOptions): Promise<BilledPartyChoice[]>;
  orderItems(orderUuid: string, options?: RequestOptions): Promise<ServiceItem[]>;
  create(
    orderUuid: string,
    item: CreateServiceItem,
    idempotencyKey?: string,
    options?: RequestOptions,
  ): Promise<ServiceItem>;
  item(serviceItemUuid: string, options?: RequestOptions): Promise<WithVersion<ServiceItem>>;
  edit(
    serviceItemUuid: string,
    patch: PatchServiceItem,
    ifMatch: string,
    options?: RequestOptions,
  ): Promise<WithVersion<ServiceItem>>;
  availableTransitions(serviceItemUuid: string, options?: RequestOptions): Promise<AvailableTransition[]>;
  transition(
    serviceItemUuid: string,
    request: TransitionRequest,
    ifMatch: string,
    options?: RequestOptions,
  ): Promise<WithVersion<TransitionResult>>;
  history(serviceItemUuid: string, options?: RequestOptions): Promise<HistoryEvent[]>;
}

/**
 * The app never sends a write without the version it edited (a 428 would be
 * our bug). Rejects, like every other failure, instead of throwing.
 */
function withIfMatch<T>(ifMatch: string, run: () => Promise<T>): Promise<T> {
  if (ifMatch.trim() === '') {
    return Promise.reject(
      new ApiError(
        0,
        { code: 'client.if_match_missing', message: 'The service version is missing. Reload and try again.' },
        'preconditionRequired',
      ),
    );
  }
  return run();
}

function etagFrom(response: Response, body: unknown): string {
  const header = response.headers.get('ETag');
  if (header) return header;
  // Q-B19: the header may not be exposed through CORS; the body copy is the fallback.
  if (typeof body === 'object' && body !== null) {
    const etag = (body as Record<string, unknown>).etag;
    if (typeof etag === 'string' && etag !== '') return etag;
  }
  throw new ApiError(0, { code: 'client.missing_etag', message: 'The server did not send the service version (ETag).' }, 'server');
}

export function createNewCpClient(
  baseUrl: string,
  tokenSource: TokenSource,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): NewCpClient {
  const root = baseUrl.replace(/\/$/, '');
  const esc = encodeURIComponent;

  async function send(path: string, init: RequestInit = {}): Promise<{ response: Response; body: unknown }> {
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
    return { response, body };
  }

  async function invoke<T>(path: string, init: RequestInit = {}): Promise<T> {
    return (await send(path, init)).body as T;
  }

  async function versioned<T>(path: string, init: RequestInit = {}): Promise<WithVersion<T>> {
    const { response, body } = await send(path, init);
    return { data: body as T, etag: etagFrom(response, body) };
  }

  return {
    catalog: (categoryCode, options) =>
      invoke(
        `/api/v1/catalog/services${categoryCode ? `?categoryCode=${esc(categoryCode)}` : ''}`,
        { signal: options?.signal },
      ),
    formSchema: (serviceUuid, options) =>
      invoke(`/api/v1/catalog/services/${esc(serviceUuid)}/form-schema`, { signal: options?.signal }),
    holdReasons: (holdType, options) =>
      invoke(`/api/v1/catalog/hold-reasons?holdType=${esc(holdType)}`, { signal: options?.signal }),
    zeroChargeReasons: (options) => invoke('/api/v1/lookups/zero-charge-reasons', { signal: options?.signal }),
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
      versioned(`/api/v1/services/${esc(serviceItemUuid)}`, { signal: options?.signal }),
    edit: (serviceItemUuid, patch, ifMatch, options) =>
      withIfMatch(ifMatch, () =>
        versioned(`/api/v1/services/${esc(serviceItemUuid)}`, {
          method: 'PATCH',
          headers: { 'If-Match': ifMatch },
          body: JSON.stringify(patch),
          signal: options?.signal,
        }),
      ),
    availableTransitions: (serviceItemUuid, options) =>
      invoke(`/api/v1/services/${esc(serviceItemUuid)}/available-transitions`, {
        signal: options?.signal,
      }),
    transition: (serviceItemUuid, request, ifMatch, options) =>
      withIfMatch(ifMatch, () =>
        versioned(`/api/v1/services/${esc(serviceItemUuid)}/transitions`, {
          method: 'POST',
          headers: { 'If-Match': ifMatch },
          body: JSON.stringify(request),
          signal: options?.signal,
        }),
      ),
    history: (serviceItemUuid, options) =>
      invoke(`/api/v1/services/${esc(serviceItemUuid)}/history`, { signal: options?.signal }),
  };
}
