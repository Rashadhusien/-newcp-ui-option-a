/**
 * Report data source. PROVISIONAL: serves the local fixtures with a short
 * delay until the typed API client and contract-shaped mocks exist (A2.2,
 * A2.3). Only this hook changes when the swap happens (DEVIATIONS D-13).
 *
 * State checks without code changes, via the URL:
 * - `?fail=1`  the load fails, so the error state and Retry can be checked
 * - `?empty=1` the load returns no rows, so the empty state can be checked
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { REPORT_FIXTURES } from './fixtures';
import type { ReportRow } from './types';

const DELAY_MS = 500;

export interface ReportRowsState {
  rows: readonly ReportRow[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useReportRows(): ReportRowsState {
  const [params] = useSearchParams();
  const fail = params.get('fail') === '1';
  const empty = params.get('empty') === '1';
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<ReportRowsState, 'retry'>>({
    rows: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(
        fail
          ? { rows: [], loading: false, error: 'The report service did not respond. Try again.' }
          : { rows: empty ? [] : REPORT_FIXTURES, loading: false, error: null },
      );
    }, DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [attempt, fail, empty]);

  const retry = useCallback(() => {
    setState({ rows: [], loading: true, error: null });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}
