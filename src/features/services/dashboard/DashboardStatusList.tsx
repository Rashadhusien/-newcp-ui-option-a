/**
 * Status overview on the Dashboard (A28): one row per API status present in
 * the data, with its icon and label (presentStatus via StatusBadge), the
 * count and a share bar. The count is always written out, so the bar never
 * carries meaning by colour alone. A list, not a table, so it stays one
 * column on phones.
 */

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StatusBadge } from '@/shared/components/basic';
import { presentStatus, type StatusSemantic } from '@/shared/status/status';
import type { StatusCount } from '@/shared/status/statusFigures';

export interface DashboardStatusListProps {
  rows: readonly StatusCount[];
  total: number;
}

type BarColor = 'inherit' | 'info' | 'primary' | 'warning' | 'success' | 'error';

const BAR_COLOR: Record<StatusSemantic, BarColor> = {
  neutral: 'inherit',
  info: 'info',
  primary: 'primary',
  warning: 'warning',
  success: 'success',
  error: 'error',
};

export function DashboardStatusList({ rows, total }: DashboardStatusListProps) {
  return (
    <Stack component="ul" spacing={1.5} aria-label="Service instances by status" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {rows.map(({ status, count }) => {
        const { label, semantic } = presentStatus(status);
        const share = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <Box
            component="li"
            key={status}
            sx={{
              display: 'grid',
              gap: 1,
              alignItems: 'center',
              gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', sm: 'minmax(0, 1fr) auto minmax(0, 2fr)' },
            }}
          >
            <Box sx={{ justifySelf: 'start', minWidth: 0 }}>
              <StatusBadge status={status} size="sm" />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
              {`${String(count)} of ${String(total)}`}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={share}
              color={BAR_COLOR[semantic]}
              aria-label={`${label}: ${String(count)} of ${String(total)} service instances (${String(share)}%)`}
              sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}
