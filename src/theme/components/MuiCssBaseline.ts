/**
 * MuiCssBaseline global styles (NFR-A11Y-03, NFR-A11Y-04).
 *
 * - Visible 2px focus ring on every :focus-visible element, using the
 *   primary token per color scheme (dark ring is the teal-300 token so
 *   it keeps contrast on dark surfaces).
 * - Thin themed scrollbars everywhere (page, grids, dialogs, popovers).
 *   The thumb meets 3:1 as a UI component (WCAG 1.4.11); hover takes the
 *   primary action colour. Track and corner stay transparent so the
 *   surface behind shows through, in both schemes.
 * - Honors prefers-reduced-motion by collapsing animations/transitions
 *   and auto scroll behavior. The `!important` flags here are the single
 *   sanctioned exception to the no-`!important` rule: component-level
 *   transitions (Collapse, Drawer, ripples) cannot be overridden by a
 *   universal selector without them.
 */

import { colorTokens, focusTokens, scrollbarTokens } from '../tokens';

const ringWidth = `${String(focusTokens.width)}px ${focusTokens.style}`;
const ringOffset = `${String(focusTokens.offset)}px`;

const thumb = scrollbarTokens.thumb.light;
const thumbHover = scrollbarTokens.thumbHover.light;
const thumbDark = scrollbarTokens.thumb.dark;
const thumbHoverDark = scrollbarTokens.thumbHover.dark;

export const MuiCssBaseline = {
  styleOverrides: {
    '*:focus-visible': {
      outline: `${ringWidth} ${colorTokens.primary.light}`,
      outlineOffset: ringOffset,
    },
    '[data-mui-color-scheme="dark"] *:focus-visible': {
      outlineColor: colorTokens.primary.dark,
    },
    '*': {
      scrollbarWidth: 'thin',
      scrollbarColor: `${thumb} transparent`,
    },
    '[data-mui-color-scheme="dark"] *': {
      scrollbarColor: `${thumbDark} transparent`,
    },
    '::-webkit-scrollbar': {
      width: '10px',
      height: '10px',
    },
    '::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: thumb,
      borderRadius: '8px',
      border: '2px solid transparent',
      backgroundClip: 'padding-box',
    },
    '[data-mui-color-scheme="dark"] ::-webkit-scrollbar-thumb': {
      backgroundColor: thumbDark,
    },
    '::-webkit-scrollbar-thumb:hover': {
      backgroundColor: thumbHover,
    },
    '[data-mui-color-scheme="dark"] ::-webkit-scrollbar-thumb:hover': {
      backgroundColor: thumbHoverDark,
    },
    '::-webkit-scrollbar-corner': {
      background: 'transparent',
    },
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important',
        scrollBehavior: 'auto !important',
      },
    },
  },
};
