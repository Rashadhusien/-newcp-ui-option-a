/**
 * StatusBadge: icon + label pill for supported order and business statuses.
 *
 * Status is never color-only. Status -> semantic/label lives in
 * domain/status.ts; the soft pill colors live in statusBadgeTokens
 * (light pastel tint / dark translucent tint, all contrast-checked).
 *
 * Dark mode uses `theme.applyStyles('dark', …)`: with cssVariables +
 * colorSchemes the theme object stays on the default (light) palette, so
 * `theme.palette.mode` cannot be used to pick scheme-specific colors.
 */

import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import Skeleton from '@mui/material/Skeleton';
import { statusBadgeTokens } from '@/theme/tokens';
import { getStatusPresentation, type StatusSemantic, type StatusValue } from '@/shared/status/status';

const SEMANTIC_ICON: Record<StatusSemantic, React.ReactElement> = {
  neutral: <RadioButtonUncheckedIcon />,
  info: <InfoOutlinedIcon />,
  primary: <TimelapseIcon />,
  warning: <ScheduleIcon />,
  success: <CheckCircleIcon />,
  error: <ErrorIcon />,
};

interface StatusBadgeProps {
  status: StatusValue;
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function StatusBadge({ status, size = 'md', loading = false }: StatusBadgeProps) {
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

  const meta = getStatusPresentation(status);
  const tone = statusBadgeTokens[meta.semantic];

  return (
    <Chip
      icon={SEMANTIC_ICON[meta.semantic]}
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
