/**
 * StatusBadge: icon + label pill for a Models or Conversion status.
 *
 * Status is never color-only. Status -> label/icon/tone lives in
 * shared/status/status.ts; the soft pill colors live in statusBadgeTokens
 * (light pastel tint / dark translucent tint, all contrast-checked).
 *
 * Dark mode uses `theme.applyStyles('dark', …)`: with cssVariables +
 * colorSchemes the theme object stays on the default (light) palette, so
 * `theme.palette.mode` cannot be used to pick scheme-specific colors.
 */

import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { statusBadgeTokens } from '@/theme/tokens';
import {
  getStatusPresentation,
  type ServiceType,
  type StatusByService,
} from '@/shared/status/status';

export interface StatusBadgeProps<S extends ServiceType> {
  service: S;
  status: StatusByService[S];
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function StatusBadge<S extends ServiceType>({
  service,
  status,
  size = 'md',
  loading = false,
}: StatusBadgeProps<S>) {
  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        width={120}
        height={size === 'sm' ? 24 : 32}
        role="status"
        aria-label="Status loading"
      />
    );
  }

  const meta = getStatusPresentation(service, status);
  const tone = statusBadgeTokens[meta.semantic];
  const Icon = meta.icon;

  return (
    <Chip
      icon={<Icon aria-hidden="true" />}
      label={meta.label}
      size={size === 'sm' ? 'small' : 'medium'}
      aria-label={`Status: ${meta.label}`}
      sx={(theme) => ({
        backgroundColor: tone.light.bg,
        color: tone.light.text,
        fontWeight: 600,
        // Never truncate a status: in narrow cells the label wraps instead.
        maxWidth: '100%',
        height: 'auto',
        minHeight: size === 'sm' ? 24 : 32,
        '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 },
        '& .MuiChip-icon': { color: 'inherit' },
        ...theme.applyStyles('dark', {
          backgroundColor: tone.dark.bg,
          color: tone.dark.text,
        }),
      })}
    />
  );
}
