/**
 * Loads who may be billed for ONE order (F07,
 * `GET /orders/{orderUuid}/eligible-billed-parties`). Mock only (D-44): with
 * the real API Bill To is BLOCKED, so nothing is called and the state says
 * so.
 */

import { useEffect, useState } from 'react';
import { isApiError, type BilledPartyChoice } from '@/shared/api';
import { serviceApi } from '../data/serviceApi';

export type EligiblePartiesState =
  | { status: 'blocked' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; parties: BilledPartyChoice[] };

export function useEligibleBilledParties(orderUuid: string): EligiblePartiesState {
  const [state, setState] = useState<EligiblePartiesState>(
    serviceApi.billToAvailable ? { status: 'loading' } : { status: 'blocked' },
  );

  useEffect(() => {
    if (!serviceApi.billToAvailable) return;
    const controller = new AbortController();
    serviceApi.eligibleBilledParties(orderUuid, { signal: controller.signal }).then(
      (parties) => {
        if (!controller.signal.aborted) setState({ status: 'ready', parties });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status: 'error',
            message: isApiError(error) ? error.message : 'The list of payers could not be loaded.',
          });
        }
      },
    );
    return () => {
      controller.abort();
    };
  }, [orderUuid]);

  return state;
}
