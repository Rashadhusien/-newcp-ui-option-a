/**
 * KpiCard (A18, from the earlier POC's KpiCard): a label, a large figure, a
 * caption and a tone icon. Optional `onClick` turns the whole card into a
 * button (for example "filter the report to these services"). The tone is
 * an icon + text, never colour alone.
 */

import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ToneIcon } from '@/shared/components/basic/ToneIcon';
import type { StatusSemantic } from '@/shared/status/status';
import { spacingTokens, typographyTokens } from '@/theme/tokens';

export interface KpiCardProps {
  label: string;
  value: string;
  caption?: string;
  icon: React.ReactNode;
  tone?: StatusSemantic;
  loading?: boolean;
  /** Makes the card a button; `actionLabel` is its accessible name. */
  onClick?: () => void;
  actionLabel?: string;
  /** Pressed state when the card acts as a filter toggle. */
  pressed?: boolean;
}

export function KpiCard({
  label,
  value,
  caption,
  icon,
  tone = 'neutral',
  loading = false,
  onClick,
  actionLabel,
  pressed,
}: KpiCardProps) {
  const body = (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', width: '100%', textAlign: 'left' }}>
      <ToneIcon tone={tone} size={40}>
        {icon}
      </ToneIcon>
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={64} height={32} />
        ) : (
          <Typography
            component="p"
            sx={{
              fontSize: typographyTokens.fontSize.kpi.size,
              lineHeight: `${String(typographyTokens.fontSize.kpi.lineHeight)}px`,
              fontWeight: typographyTokens.fontWeight.semibold,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </Typography>
        )}
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </Stack>
    </Stack>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderColor: pressed ? 'primary.main' : undefined,
        borderWidth: pressed ? 2 : undefined,
      }}
    >
      {onClick ? (
        <ButtonBase
          onClick={onClick}
          aria-label={actionLabel}
          aria-pressed={pressed}
          sx={{ display: 'flex', width: '100%', p: `${String(spacingTokens.cardPadding)}px` }}
        >
          {body}
        </ButtonBase>
      ) : (
        <Stack sx={{ p: `${String(spacingTokens.cardPadding)}px` }}>{body}</Stack>
      )}
    </Paper>
  );
}
