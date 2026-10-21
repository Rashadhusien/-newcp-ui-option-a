/**
 * MuiButton Component Overrides
 *
 * Flat buttons (no elevation) with the control radius from the scale.
 */

import { radiusTokens } from '../tokens';

export const MuiButton = {
  defaultProps: {
    disableElevation: true,
  },
  styleOverrides: {
    root: {
      textTransform: 'none' as const,
      borderRadius: radiusTokens.sm,
      fontWeight: 500,
    },
  },
};
