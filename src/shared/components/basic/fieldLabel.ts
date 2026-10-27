/**
 * Labels above form controls (A23, DESIGN_ALIGNMENT item 11): the label is
 * a static line above the field instead of MUI's floating label in the
 * outline notch. Used by AppTextField and the form-size AppSelect; toolbar
 * selects (size small) keep the compact floating label.
 *
 * The label stays the control's <label for>, so `getByLabelText` and screen
 * readers are unchanged; MUI already marks the required asterisk
 * `aria-hidden`.
 */

import type { SxProps, Theme } from '@mui/material/styles';
import { typographyTokens } from '@/theme/tokens';

export const labelAboveSx: SxProps<Theme> = {
  position: 'static',
  transform: 'none',
  maxWidth: 'none',
  whiteSpace: 'normal',
  mb: 0.75,
  typography: 'body2',
  fontWeight: typographyTokens.fontWeight.medium,
  color: 'text.primary',
};
