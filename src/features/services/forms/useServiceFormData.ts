/**
 * Loads what a service form needs: for create, the catalog service's form
 * definition; for edit, the service item with its version (ETag, Q-B8) and
 * then its service's form definition. Errors arrive as ApiError (404 not found or tenant-masked,
 * 403, 5xx, network).
 */

import { useCallback, useEffect, useState } from 'react';
import { isApiError, type ApiError, type FormDefinition, type ServiceItem } from '@/shared/api';
import { serviceApi } from '../data/serviceApi';

export type ServiceFormTarget =
  | { mode: 'create'; orderUuid: string; serviceUuid: string }
  | { mode: 'edit'; serviceItemUuid: string };

export type ServiceFormData =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | null }
  | { status: 'ready'; definition: FormDefinition; item: ServiceItem | null; etag: string | null };

export function useServiceFormData(target: ServiceFormTarget): {
  data: ServiceFormData;
  retry: () => void;
} {
  const [data, setData] = useState<ServiceFormData>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const targetKey = target.mode === 'create' ? `${target.orderUuid}|${target.serviceUuid}` : target.serviceItemUuid;

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const load = async () => {
      const versioned = target.mode === 'edit' ? await serviceApi.item(target.serviceItemUuid, options) : null;
      const item = versioned?.data ?? null;
      const serviceUuid = item ? item.sellableItemUuid : target.mode === 'create' ? target.serviceUuid : '';
      const definition = await serviceApi.formSchema(serviceUuid, options);
      return { definition, item, etag: versioned?.etag ?? null };
    };
    load().then(
      ({ definition, item, etag }) => {
        if (!controller.signal.aborted) setData({ status: 'ready', definition, item, etag });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setData({ status: 'error', error: isApiError(error) ? error : null });
      },
    );
    return () => {
      controller.abort();
    };
    // targetKey stands for the target's fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, attempt]);

  const retry = useCallback(() => {
    setData({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return { data, retry };
}
