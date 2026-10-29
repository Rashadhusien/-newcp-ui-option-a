/**
 * Loads everything the instance detail page shows, for ONE service
 * instance: the item with its version (ETag, Q-B8), its catalog service
 * name, the transitions the API offers now, and its history. Nothing here
 * is keyed by service type, so two same-type instances never share data.
 */

import { useCallback, useEffect, useState } from 'react';
import { isApiError, type ApiError, type AvailableTransition, type HistoryEvent, type ServiceItem } from '@/shared/api';
import { serviceApi } from '../data/serviceApi';
import { serviceLabel } from '../forms/catalogFormBridge';

export interface ServiceDetail {
  item: ServiceItem;
  etag: string;
  serviceName: string;
  transitions: AvailableTransition[];
  history: HistoryEvent[];
}

export type ServiceDetailState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | null }
  | { status: 'ready'; detail: ServiceDetail };

export function useServiceDetail(serviceItemUuid: string): {
  state: ServiceDetailState;
  reload: () => void;
} {
  const [state, setState] = useState<ServiceDetailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const load = async (): Promise<ServiceDetail> => {
      const [{ data: item, etag }, transitions, history, catalog] = await Promise.all([
        serviceApi.item(serviceItemUuid, options),
        serviceApi.availableTransitions(serviceItemUuid, options),
        serviceApi.history(serviceItemUuid, options),
        serviceApi.catalog(undefined, options),
      ]);
      const serviceName = serviceLabel(catalog.find((entry) => entry.uuid === item.sellableItemUuid)) ?? 'Service';
      return { item, etag, serviceName, transitions, history };
    };
    load().then(
      (detail) => {
        if (!controller.signal.aborted) setState({ status: 'ready', detail });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'error',
            error: isApiError(error) ? error : null,
          });
      },
    );
    return () => {
      controller.abort();
    };
  }, [serviceItemUuid, attempt]);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { state, reload };
}
