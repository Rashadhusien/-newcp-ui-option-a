/**
 * Surface component defaults: Paper, Card, Dialog, Popover/Menu, Tooltip,
 * Alert, LinearProgress.
 *
 * Hierarchy (both schemes): canvas (background.default) -> surface (Paper,
 * Card) -> elevated (Dialog) -> overlay (menus, popovers). Cards are flat
 * and bordered; only floating layers carry a shadow.
 *
 * Scheme-specific values use `theme.applyStyles('dark', …)` because the
 * css-vars theme object always holds the light palette.
 */

import type { Components, Theme } from '@mui/material/styles';
import { colorTokens, radiusTokens, shadowTokens, typographyTokens } from '../tokens';

type Overrides = Components<Omit<Theme, 'components'>>;

export const MuiPaper: Overrides['MuiPaper'] = {
  styleOverrides: {
    root: {
      // Flat surfaces in dark mode: hierarchy comes from surface tokens, not
      // MUI's white elevation overlay gradient.
      backgroundImage: 'none',
    },
    outlined: ({ theme }) => ({
      borderColor: colorTokens.border.light,
      ...theme.applyStyles('dark', { borderColor: colorTokens.border.dark }),
    }),
  },
};

export const MuiCard: Overrides['MuiCard'] = {
  defaultProps: {
    variant: 'outlined',
  },
  styleOverrides: {
    root: {
      borderRadius: radiusTokens.md,
      boxShadow: 'none',
    },
  },
};

export const MuiDialog: Overrides['MuiDialog'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      borderRadius: radiusTokens.lg,
      boxShadow: shadowTokens.lg,
      ...theme.applyStyles('dark', {
        backgroundColor: colorTokens.surface.elevatedDark,
        boxShadow: shadowTokens.lgDark,
        border: `1px solid ${colorTokens.border.dark}`,
      }),
    }),
  },
};

export const MuiDialogTitle: Overrides['MuiDialogTitle'] = {
  styleOverrides: {
    root: {
      fontSize: `${String(typographyTokens.fontSize.sectionTitle.size)}px`,
      lineHeight: `${String(typographyTokens.fontSize.sectionTitle.lineHeight)}px`,
      fontWeight: typographyTokens.fontWeight.semibold,
    },
  },
};

// Menus, selects, and autocomplete lists all render inside a Popover paper.
export const MuiPopover: Overrides['MuiPopover'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      borderRadius: radiusTokens.md,
      border: `1px solid ${colorTokens.border.light}`,
      boxShadow: shadowTokens.md,
      backgroundColor: colorTokens.surface.overlayLight,
      ...theme.applyStyles('dark', {
        borderColor: colorTokens.border.dark,
        boxShadow: shadowTokens.mdDark,
        backgroundColor: colorTokens.surface.overlayDark,
      }),
    }),
  },
};

export const MuiMenuItem: Overrides['MuiMenuItem'] = {
  styleOverrides: {
    root: {
      fontSize: `${String(typographyTokens.fontSize.body.size)}px`,
      minHeight: 40,
    },
  },
};

export const MuiTooltip: Overrides['MuiTooltip'] = {
  styleOverrides: {
    tooltip: ({ theme }) => ({
      fontSize: `${String(typographyTokens.fontSize.caption.size)}px`,
      fontWeight: typographyTokens.fontWeight.medium,
      borderRadius: radiusTokens.sm,
      backgroundColor: colorTokens.text.primary.light,
      color: colorTokens.surface.light,
      ...theme.applyStyles('dark', {
        backgroundColor: colorTokens.surface.overlayDark,
        color: colorTokens.text.primary.dark,
        border: `1px solid ${colorTokens.border.dark}`,
      }),
    }),
  },
};

export const MuiAlert: Overrides['MuiAlert'] = {
  styleOverrides: {
    root: {
      borderRadius: radiusTokens.md,
      alignItems: 'center',
    },
  },
};

export const MuiLinearProgress: Overrides['MuiLinearProgress'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      height: 6,
      borderRadius: 999,
      backgroundColor: colorTokens.divider.light,
      ...theme.applyStyles('dark', { backgroundColor: colorTokens.divider.dark }),
    }),
    bar: {
      borderRadius: 999,
    },
  },
};
