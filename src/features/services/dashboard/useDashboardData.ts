/**
 * Loads the Dashboard source once per visit (and on retry). With the real
 * API the adapter rejects with kind `blocked` before sending anything.
 */

import { useCallback, useEffect, useState } from 'react';
import { isApiError, type ApiError } from '@/shared/api';
import type { DashboardData } from '../data/dashboardData';
import { serviceApi } from '../data/serviceApi';

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | null }
  | { status: 'ready'; data: DashboardData };

export function useDashboardData(): { state: DashboardState; retry: () => void } {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    serviceApi.dashboardData({ signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error: isApiError(error) ? error : null });
      },
    );
    return () => {
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}
