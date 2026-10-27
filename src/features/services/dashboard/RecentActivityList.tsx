/**
 * Recent activity on the Dashboard (A28): the latest status changes from
 * the services' history. The actor is a short id only: names are not in the
 * contract (Q-B6). A row links to its service page only when the role may
 * open it.
 */

import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ROUTES } from '@/app/routes';
import { formatDateTime } from '@/shared/lib/formatters';
import { presentStatus } from '@/shared/status/status';
import type { ActivityRow } from './dashboardSelectors';

export interface RecentActivityListProps {
  rows: readonly ActivityRow[];
  canOpen: boolean;
}

function statusLabel(code: string | undefined): string {
  return code === undefined ? 'unknown' : presentStatus(code).label;
}

export function RecentActivityList({ rows, canOpen }: RecentActivityListProps) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No status changes yet. Moves made on a service page show here.
      </Typography>
    );
  }
  return (
    <Stack component="ul" spacing={1.5} aria-label="Latest status changes" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {rows.map((row) => {
        const title = `${row.serviceName}, line ${String(row.lineNumber ?? '-')} · Order ${row.orderShortId}`;
        return (
          <Stack component="li" key={row.key} spacing={0.25}>
            {canOpen ? (
              <Link component={RouterLink} to={ROUTES.serviceDetail(row.serviceItemUuid)} variant="body2" sx={{ fontWeight: 600 }}>
                {title}
              </Link>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
            <Typography variant="body2">{`${statusLabel(row.fromCode)} → ${statusLabel(row.toCode)}`}</Typography>
            <Typography variant="caption" color="text.secondary">
              {`${row.occurredAt ? formatDateTime(row.occurredAt) : 'Time not given'} · by user ${row.actorShortId}`}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
