/**
 * ToneIcon: an icon on a soft tinted square, using the same tone tokens as
 * StatusBadge (notification types, KPI icons, file types).
 */

import Avatar from '@mui/material/Avatar';
import type { StatusSemantic } from '@/shared/status/status';
import { radiusTokens, statusBadgeTokens } from '@/theme/tokens';

interface ToneIconProps {
  tone: StatusSemantic;
  children: React.ReactNode;
  size?: number;
}

export function ToneIcon({ tone, children, size = 32 }: ToneIconProps) {
  const pair = statusBadgeTokens[tone];
  return (
    <Avatar
      variant="rounded"
      aria-hidden="true"
      sx={(theme) => ({
        width: size,
        height: size,
        borderRadius: `${String(radiusTokens.md)}px`,
        bgcolor: pair.light.bg,
        color: pair.light.text,
        '& .MuiSvgIcon-root': { fontSize: size * 0.56 },
        ...theme.applyStyles('dark', { bgcolor: pair.dark.bg, color: pair.dark.text }),
      })}
    >
      {children}
    </Avatar>
  );
}
