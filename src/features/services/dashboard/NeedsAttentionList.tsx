/**
 * "Needs attention" on the Dashboard (A28): the services on hold now. Hold
 * type and reason are set by the On Hold transition but the item the API
 * returns does not carry them (Q-B18), so they read "not returned". A row
 * links to its service page only when the role may open it (`service.read`;
 * FINANCE and QC see the row without a link).
 */

import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ROUTES } from '@/app/routes';
import type { AttentionRow } from './dashboardSelectors';

export interface NeedsAttentionListProps {
  rows: readonly AttentionRow[];
  canOpen: boolean;
}

const NOT_RETURNED = 'not returned by the API yet (Q-B18)';

export function NeedsAttentionList({ rows, canOpen }: NeedsAttentionListProps) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No service is on hold.
      </Typography>
    );
  }
  return (
    <Stack component="ul" spacing={1.5} aria-label="Services on hold" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {rows.map((row) => {
        const title = `${row.serviceName}, line ${String(row.lineNumber ?? '-')} · Order ${row.orderShortId}`;
        return (
          <Stack component="li" key={row.uuid} spacing={0.25}>
            {canOpen ? (
              <Link component={RouterLink} to={ROUTES.serviceDetail(row.uuid)} variant="body2" sx={{ fontWeight: 600 }}>
                {title}
              </Link>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {`Hold type: ${NOT_RETURNED} · Reason: ${NOT_RETURNED}`}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
