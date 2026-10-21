/**
 * Theme Configuration
 *
 * Main theme file: creates the MUI theme with createTheme, using MUI v9's
 * colorSchemes pattern for light/dark/system mode.
 *
 * Changes in this revision:
 * - Softer, cool-tinted layered shadows (sm/md/lg from tokens) mapped to more
 *   elevation levels, so cards/menus/dialogs feel consistent.
 * - Focus ring color follows the active color scheme via a CSS variable
 *   (light: #0F5FA8, dark: #6FB2F2) instead of one fixed hex.
 */

import {
  createTheme,
  responsiveFontSizes,
  type Shadows,
  type ThemeOptions,
} from '@mui/material/styles';
import { colorSchemes } from './palette';
import { typography } from './typography';
import { breakpointTokens, spacingTokens, radiusTokens, shadowTokens, focusTokens } from './tokens';
import {
  MuiButton,
  MuiChip,
  MuiCssBaseline,
  MuiIconButton,
  MuiPaper,
  MuiCard,
  MuiDialog,
  MuiDialogTitle,
  MuiPopover,
  MuiMenuItem,
  MuiTooltip,
  MuiAlert,
  MuiLinearProgress,
  MuiTableCell,
  MuiTableRow,
  MuiTableSortLabel,
  MuiTabs,
  MuiTab,
  MuiToggleButton,
  MuiOutlinedInput,
} from './components';

// ============================================================================
// SHADOWS (MUI requires a 25-entry elevation tuple)
// ============================================================================

// Elevation mapping for the custom shadow tokens. All other elevations keep
// the MUI defaults. Cards are flat (MuiCard: bordered, no shadow); Popover
// and Dialog set their own scheme-aware shadows in components/surfaces.ts.
// - 1, 2  -> sm (resting raised surfaces)
// - 4, 8  -> md (menus, popovers)
// - 16    -> lg (drawers)
// - 24    -> lg (dialogs, modals)
function buildShadows(): Shadows {
  const shadows = [...createTheme().shadows] as Shadows;
  shadows[1] = shadowTokens.sm;
  shadows[2] = shadowTokens.sm;
  shadows[4] = shadowTokens.md;
  shadows[8] = shadowTokens.md;
  shadows[16] = shadowTokens.lg;
  shadows[24] = shadowTokens.lg;
  return shadows;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const baseTheme = {
  // CSS variables + color schemes (MUI v9 pattern). cssVariables must be
  // enabled for colorSchemes switching (light/dark/system) to take effect.
  // colorSchemeSelector 'data-mui-color-scheme' is REQUIRED for manual
  // Light/Dark switching: the MUI default is 'media', which scopes the dark
  // scheme to @media (prefers-color-scheme: dark) so setMode('dark') has no
  // visible effect on a light OS. With the data attribute, the provider
  // toggles it and the choice persists in localStorage.
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
  },
  colorSchemes,

  // Typography
  typography,

  // Breakpoints
  breakpoints: {
    values: breakpointTokens,
  },

  // Spacing (using the scale from tokens)
  spacing: (factor: number) => spacingTokens.unit * factor,

  // Shape (border radius)
  shape: {
    borderRadius: radiusTokens.md, // Default radius
  },

  // Shadows (25-entry MUI elevation tuple with custom tokens applied)
  shadows: buildShadows(),

  // Focus ring configuration.
  // The color is a CSS variable so it resolves to the primary of the ACTIVE
  // scheme (6.83:1 on white in light, 7.34:1 on the dark surface in dark).
  // If any component wraps focusRing.color in alpha()/color-mix in JS, switch
  // that call to CSS color-mix() or theme.vars.palette.primary.mainChannel.
  focusRing: {
    width: focusTokens.width,
    style: focusTokens.style,
    color: 'var(--mui-palette-primary-main)',
    offset: focusTokens.offset,
  },

  // Component defaults (imported from component-specific files)
  components: {
    MuiButton,
    MuiChip,
    MuiCssBaseline,
    MuiIconButton,
    MuiPaper,
    MuiCard,
    MuiDialog,
    MuiDialogTitle,
    MuiPopover,
    MuiMenuItem,
    MuiTooltip,
    MuiAlert,
    MuiLinearProgress,
    MuiTableCell,
    MuiTableRow,
    MuiTableSortLabel,
    MuiTabs,
    MuiTab,
    MuiToggleButton,
    MuiOutlinedInput,
  } as ThemeOptions['components'],

  // Custom properties (will be augmented)
  custom: {
    // Additional custom theme properties can be added here
  },
};

// Base theme with responsive typography.
export const theme = responsiveFontSizes(createTheme(baseTheme));

// Export individual tokens for use in components if needed
export { colorSchemes, typography, breakpointTokens, spacingTokens, radiusTokens, shadowTokens };
