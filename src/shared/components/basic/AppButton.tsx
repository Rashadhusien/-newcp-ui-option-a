/**
 * AppButton: single button wrapper for all feature code.
 *
 * Variants map to MUI: primary -> contained, secondary -> outlined,
 * text -> text, danger -> contained error. Loading shows a spinner,
 * disables the button, and announces via aria-busy.
 */

import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { ReactNode } from 'react';

export type AppButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
export type AppButtonSize = 'sm' | 'md';

interface AppButtonProps {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  disabled?: boolean;
  startIcon?: ReactNode;
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: ButtonProps['type'];
  fullWidth?: boolean;
  ariaLabel?: string;
}

const VARIANT_MAP: Record<
  AppButtonVariant,
  { variant: ButtonProps['variant']; color: ButtonProps['color'] }
> = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined', color: 'primary' },
  text: { variant: 'text', color: 'primary' },
  danger: { variant: 'contained', color: 'error' },
};

export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  startIcon,
  children,
  onClick,
  type = 'button',
  fullWidth = false,
  ariaLabel,
}: AppButtonProps) {
  const mapped = VARIANT_MAP[variant];
  const busy = loading || disabled;
  return (
    <Button
      variant={mapped.variant}
      color={mapped.color}
      size={size === 'sm' ? 'small' : 'medium'}
      disabled={busy}
      aria-busy={loading ? 'true' : undefined}
      aria-label={ariaLabel}
      startIcon={
        loading ? <CircularProgress size={16} color="inherit" aria-hidden="true" /> : startIcon
      }
      onClick={onClick}
      type={type}
      fullWidth={fullWidth}
      sx={{ minHeight: 44 }}
    >
      {children}
    </Button>
  );
}
