/**
 * Status of ONE service instance (A7R.3): the current status, the moves
 * the API offers now (`available-transitions`, label from the API; never a
 * hard-coded list), and the history.
 *
 * Every move is a transition request with If-Match; the status is never
 * patched. A move into `on_hold` opens the hold dialog. 409/412/422 leave
 * the status unchanged and say why; a 412 offers the latest version.
 * Moves are hidden without the transition capability (display only).
 */

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  can,
  isApiError,
  type AvailableTransition,
  type HistoryEvent,
  type HoldType,
  type TransitionRequest,
} from '@/shared/api';
import { AppButton, StatusBadge } from '@/shared/components/basic';
import { ActivityFeed } from '@/shared/components/data-display';
import { InlineAlert, useToast } from '@/shared/components/feedback';
import { useSession } from '@/shared/hooks/useSession';
import { presentStatus } from '@/shared/status/status';
import { serviceApi } from '../data/serviceApi';
import { HoldDialog } from './HoldDialog';
import { historyEntries } from './historyEntries';

export interface StatusPanelProps {
  serviceItemUuid: string;
  lineLabel: string;
  status: string;
  etag: string;
  transitions: readonly AvailableTransition[];
  history: readonly HistoryEvent[];
  /** Reloads the instance after a move (or to get the latest version). */
  onChanged: () => void;
}

const ON_HOLD = 'on_hold';

export function StatusPanel({
  serviceItemUuid,
  lineLabel,
  status,
  etag,
  transitions,
  history,
  onChanged,
}: StatusPanelProps) {
  const { context } = useSession();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [holdFor, setHoldFor] = useState<AvailableTransition | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);

  const allowed = transitions.filter(
    (move) => can(context, 'service.status.transition') && (move.toCode !== ON_HOLD || can(context, 'service.on_hold')),
  );

  async function move(transition: AvailableTransition, hold?: { holdType: HoldType; holdReasonCode: string }) {
    setBusy(transition.transitionId);
    setError(null);
    setStale(false);
    setHoldError(null);
    const request: TransitionRequest = {
      transitionId: transition.transitionId,
      ...hold,
    };
    try {
      await serviceApi.transition(serviceItemUuid, request, etag);
      setHoldFor(null);
      showToast(`${lineLabel}: ${presentStatus(transition.toCode).label}.`, {
        severity: 'success',
      });
      onChanged();
    } catch (failure) {
      const message = isApiError(failure) ? failure.message : 'Something went wrong. The status did not change.';
      if (isApiError(failure) && failure.kind === 'stale') {
        setHoldFor(null);
        setStale(true);
      } else if (hold) {
        setHoldError(message);
      } else {
        setError(message);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Current status
        </Typography>
        <StatusBadge status={status} />
      </Stack>
      {stale && (
        <Alert
          severity="warning"
          action={
            <AppButton variant="text" onClick={onChanged}>
              Reload latest
            </AppButton>
          }
        >
          Someone else changed this service since you opened it, so the status did not change. Reload latest and try
          again.
        </Alert>
      )}
      {error !== null && <InlineAlert severity="error">{error}</InlineAlert>}
      {allowed.length > 0 ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
          {allowed.map((transition) => (
            <AppButton
              key={transition.transitionId}
              variant="secondary"
              loading={busy === transition.transitionId}
              disabled={busy !== null}
              onClick={() => {
                if (transition.toCode === ON_HOLD) setHoldFor(transition);
                else void move(transition);
              }}
            >
              {transition.label ?? presentStatus(transition.toCode).label}
            </AppButton>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {transitions.length === 0
            ? 'No status change is possible from here.'
            : 'You cannot change the status of this service.'}
        </Typography>
      )}
      <Typography variant="h3" component="h3">
        History
      </Typography>
      <ActivityFeed
        entries={historyEntries(history)}
        label={`Status history, ${lineLabel}`}
        emptyText="No status changes yet."
      />
      {holdFor !== null && (
        <HoldDialog
          open
          lineLabel={lineLabel}
          loading={busy !== null}
          error={holdError}
          onClose={() => {
            setHoldFor(null);
            setHoldError(null);
          }}
          onSubmit={(holdType, holdReasonCode) => {
            void move(holdFor, { holdType, holdReasonCode });
          }}
        />
      )}
    </Stack>
  );
}
