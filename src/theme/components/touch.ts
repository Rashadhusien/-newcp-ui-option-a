/**
 * Touch targets: below `touchTargetTokens.coarseBelow` (768 px) every
 * interactive control is at least `touchTargetTokens.minSize` tall, so
 * phone and small-tablet users can hit it (CLAUDE.md accessibility rules).
 *
 * Applied to Button, OutlinedInput (text fields and selects),
 * PaginationItem and Chip; IconButton already has the minimum everywhere.
 */

import { touchTargetTokens } from '../tokens';

export const BELOW_TOUCH_WIDTH = `@media (max-width: ${String(touchTargetTokens.coarseBelow - 0.05)}px)`;

export const touchMinHeight = {
  [BELOW_TOUCH_WIDTH]: { minHeight: touchTargetTokens.minSize },
} as const;

export const touchMinSize = {
  [BELOW_TOUCH_WIDTH]: {
    minHeight: touchTargetTokens.minSize,
    minWidth: touchTargetTokens.minSize,
  },
} as const;
