/**
 * Data and navigation component defaults: Table, Tabs, ToggleButton,
 * OutlinedInput.
 *
 * Table typography follows the token scale (12px semibold secondary header,
 * 13px body) so every business table reads the same without per-page styles.
 */

import type { Components, Theme } from '@mui/material/styles';
import { colorTokens, radiusTokens, tableTokens, typographyTokens } from '../tokens';
import { touchMinHeight, touchMinSize } from './touch';

type Overrides = Components<Omit<Theme, 'components'>>;

const px = (value: number) => `${String(value)}px`;

export const MuiTableCell: Overrides['MuiTableCell'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderBottom: `1px solid ${colorTokens.divider.light}`,
      fontSize: px(typographyTokens.fontSize.tableCell.size),
      lineHeight: px(typographyTokens.fontSize.tableCell.lineHeight),
      ...theme.applyStyles('dark', { borderBottomColor: colorTokens.divider.dark }),
    }),
    head: ({ theme }) => ({
      backgroundColor: tableTokens.headerBg.light,
      color: colorTokens.text.secondary.light,
      fontSize: px(typographyTokens.fontSize.tableHeader.size),
      lineHeight: px(typographyTokens.fontSize.tableHeader.lineHeight),
      fontWeight: typographyTokens.fontWeight.semibold,
      letterSpacing: typographyTokens.letterSpacing.tableHeader,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...theme.applyStyles('dark', {
        backgroundColor: tableTokens.headerBg.dark,
        color: colorTokens.text.secondary.dark,
      }),
    }),
    // Compact horizontal padding keeps dense business tables inside their
    // container (no horizontal scroll) without truncating headers.
    sizeSmall: {
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 12,
      paddingRight: 12,
      // Matches MUI's own small + checkbox rule so this one wins.
      '&.MuiTableCell-paddingCheckbox': {
        paddingLeft: 4,
        paddingRight: 4,
      },
    },
  },
};

export const MuiTableRow: Overrides['MuiTableRow'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.MuiTableRow-hover:hover': { backgroundColor: tableTokens.rowHover.light },
      '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: tableTokens.rowSelected.light },
      ...theme.applyStyles('dark', {
        '&.MuiTableRow-hover:hover': { backgroundColor: tableTokens.rowHover.dark },
        '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: tableTokens.rowSelected.dark },
      }),
    }),
  },
};

export const MuiTableSortLabel: Overrides['MuiTableSortLabel'] = {
  styleOverrides: {
    root: {
      '&.Mui-active': { color: 'inherit' },
    },
    icon: {
      fontSize: 16,
      marginLeft: 2,
      marginRight: 0,
    },
  },
};

export const MuiTabs: Overrides['MuiTabs'] = {
  styleOverrides: {
    root: {
      minHeight: 44,
    },
    indicator: {
      height: 2,
      borderRadius: 2,
    },
  },
};

export const MuiTab: Overrides['MuiTab'] = {
  styleOverrides: {
    root: {
      minHeight: 44,
      textTransform: 'none',
      fontWeight: typographyTokens.fontWeight.medium,
      fontSize: px(typographyTokens.fontSize.body.size),
    },
  },
};

export const MuiToggleButton: Overrides['MuiToggleButton'] = {
  styleOverrides: {
    root: {
      textTransform: 'none',
      fontWeight: typographyTokens.fontWeight.medium,
      borderRadius: radiusTokens.sm,
    },
  },
};

// Control boundaries need >= 3:1 against the surface (WCAG 1.4.11), so
// inputs use `inputBorder`, not the decorative `border` token. Styled on the
// notchedOutline slot (low specificity) so MUI's hover, focus, and error
// border colors still win.
export const MuiOutlinedInput: Overrides['MuiOutlinedInput'] = {
  styleOverrides: {
    root: {
      borderRadius: radiusTokens.sm,
      ...touchMinHeight,
    },
    notchedOutline: ({ theme }) => ({
      borderColor: colorTokens.inputBorder.light,
      ...theme.applyStyles('dark', { borderColor: colorTokens.inputBorder.dark }),
    }),
  },
};

export const MuiPaginationItem: Overrides['MuiPaginationItem'] = {
  styleOverrides: {
    root: touchMinSize,
  },
};
