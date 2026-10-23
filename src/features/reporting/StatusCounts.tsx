/**
 * Instance counts per status, grouped by service type. Each count is a
 * toggle that filters the report to that type and status.
 *
 * Status is never colour-only: every chip has the status icon and label.
 */

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { presentStatus } from '@/shared/status/status';
import type { StatusCount, StatusCountKey } from './filterReport';
import { SERVICE_TYPE_LABEL, type ServiceType } from './types';

export interface StatusCountsProps {
  counts: readonly StatusCount[];
  activeType: ServiceType | '';
  activeStatus: string;
  onSelect: (key: StatusCountKey) => void;
}

export function StatusCounts({ counts, activeType, activeStatus, onSelect }: StatusCountsProps) {
  const types = [...new Set(counts.map((entry) => entry.key.service))];
  return (
    <Stack spacing={1.5} sx={{ px: 2, pb: 2 }}>
      {types.map((type) => (
        <Stack
          key={type}
          direction="row"
          component="ul"
          aria-label={`${SERVICE_TYPE_LABEL[type]} instances by status`}
          sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', m: 0, p: 0, listStyle: 'none' }}
        >
          <Typography component="li" variant="body2" sx={{ fontWeight: 600, minWidth: 96 }}>
            {SERVICE_TYPE_LABEL[type]}
          </Typography>
          {counts
            .filter((entry) => entry.key.service === type)
            .map((entry) => {
              const meta = presentStatus(entry.key.status);
              const Icon = meta.icon;
              const pressed =
                activeStatus === entry.key.status && (activeType === '' || activeType === type);
              return (
                <li key={entry.key.status}>
                  <Chip
                    icon={<Icon aria-hidden="true" />}
                    label={`${meta.label} · ${String(entry.count)}`}
                    variant={pressed ? 'filled' : 'outlined'}
                    color={pressed ? 'primary' : 'default'}
                    aria-pressed={pressed}
                    aria-label={`${SERVICE_TYPE_LABEL[type]}, ${meta.label}: ${String(entry.count)} instances. ${pressed ? 'Filter on' : 'Filter by this status'}`}
                    onClick={() => {
                      onSelect(entry.key);
                    }}
                  />
                </li>
              );
            })}
        </Stack>
      ))}
    </Stack>
  );
}
