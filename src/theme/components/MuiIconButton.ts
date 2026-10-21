/**
 * MuiIconButton touch-target override (NFR-A11Y-03).
 *
 * Project target is >=44px touch targets. MUI IconButtons default to
 * 40px (34px small), so every icon button — header controls, row
 * menus, dialog/drawer close, grid internals — gets a 44px minimum.
 * Grid rows (52px) and headers (56px) absorb the growth.
 */

import { touchTargetTokens } from '../tokens';

export const MuiIconButton = {
  styleOverrides: {
    root: {
      minWidth: touchTargetTokens.minSize,
      minHeight: touchTargetTokens.minSize,
    },
  },
};
