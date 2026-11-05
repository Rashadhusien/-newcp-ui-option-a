/**
 * Palette Configuration
 *
 * Creates the light and dark color schemes for MUI from the design tokens.
 * Follows MUI v9's colorSchemes pattern. No colour literals live here;
 * everything comes from tokens.ts.
 */

import { colorTokens } from './tokens';

// On-color text: white on the deep light-scheme fills, graphite on the
// pastel dark-scheme fills. Both >= 5:1 against their fill.
const ON_LIGHT_FILL = colorTokens.text.onFillLight;
const ON_DARK_FILL = colorTokens.text.onFillDark;

// ============================================================================
// LIGHT COLOR SCHEME
// ============================================================================

export const lightPalette = {
  mode: 'light' as const,

  primary: {
    main: colorTokens.primary.light,
    dark: colorTokens.primary.lightHover,
    light: colorTokens.primary.lightTint,
    contrastText: ON_LIGHT_FILL,
  },

  secondary: {
    main: colorTokens.secondary.light,
    contrastText: ON_LIGHT_FILL,
  },

  error: {
    main: colorTokens.semantic.error.light,
    contrastText: ON_LIGHT_FILL,
  },

  warning: {
    main: colorTokens.semantic.warning.light,
    contrastText: ON_LIGHT_FILL,
  },

  info: {
    main: colorTokens.semantic.info.light,
    contrastText: ON_LIGHT_FILL,
  },

  success: {
    main: colorTokens.semantic.success.light,
    contrastText: ON_LIGHT_FILL,
  },

  background: {
    default: colorTokens.background.light,
    paper: colorTokens.surface.light,
  },

  text: {
    primary: colorTokens.text.primary.light,
    secondary: colorTokens.text.secondary.light,
    disabled: colorTokens.text.disabled.light,
  },

  divider: colorTokens.divider.light,

  action: {
    hover: colorTokens.action.hover.light,
    selected: colorTokens.action.selected.light,
  },
};

// ============================================================================
// DARK COLOR SCHEME
// ============================================================================

export const darkPalette = {
  mode: 'dark' as const,

  primary: {
    main: colorTokens.primary.dark,
    dark: colorTokens.primary.darkHover,
    contrastText: ON_DARK_FILL,
  },

  secondary: {
    main: colorTokens.secondary.dark,
    contrastText: ON_DARK_FILL,
  },

  error: {
    main: colorTokens.semantic.error.dark,
    contrastText: ON_DARK_FILL,
  },

  warning: {
    main: colorTokens.semantic.warning.dark,
    contrastText: ON_DARK_FILL,
  },

  info: {
    main: colorTokens.semantic.info.dark,
    contrastText: ON_DARK_FILL,
  },

  success: {
    main: colorTokens.semantic.success.dark,
    contrastText: ON_DARK_FILL,
  },

  background: {
    default: colorTokens.background.dark,
    paper: colorTokens.surface.dark,
  },

  text: {
    primary: colorTokens.text.primary.dark,
    secondary: colorTokens.text.secondary.dark,
    disabled: colorTokens.text.disabled.dark,
  },

  divider: colorTokens.divider.dark,

  action: {
    hover: colorTokens.action.hover.dark,
    selected: colorTokens.action.selected.dark,
  },
};

// ============================================================================
// COLOR SCHEMES (MUI v9 format: each scheme wraps its palette)
// ============================================================================

export const colorSchemes = {
  light: { palette: lightPalette },
  dark: { palette: darkPalette },
};
