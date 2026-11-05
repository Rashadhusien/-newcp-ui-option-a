/**
 * MuiChip Component Overrides
 *
 * This file contains MUI Chip component customizations.
 */

import { radiusTokens } from '../tokens';
import { touchMinHeight } from './touch';

export const MuiChip = {
  styleOverrides: {
    root: {
      borderRadius: radiusTokens.sm,
    },
    // Only clickable chips are controls; display chips keep their size.
    clickable: touchMinHeight,
  },
};
