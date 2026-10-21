/**
 * Typography Configuration
 *
 * This file configures the typography system for MUI using the design tokens.
 * It includes font families, sizes, weights, and letter spacing.
 *
 * Source: POC_PLAN_AND_SRS.md Section 5.4
 */

import { typographyTokens } from './tokens';

// ============================================================================
// TYPOGRAPHY CONFIGURATION
// ============================================================================

export const typography = {
  // Root font size (16px as specified in plan)
  htmlFontSize: typographyTokens.fontSize.root,

  // Font families
  fontFamily: typographyTokens.fontFamily.body,
  fontFamilyMonospace: typographyTokens.fontFamily.mono,

  // Font size variants
  fontSize: 14, // Default body size

  // Font weight variants
  fontWeightRegular: typographyTokens.fontWeight.regular,
  fontWeightMedium: typographyTokens.fontWeight.medium,
  fontWeightSemiBold: typographyTokens.fontWeight.semibold,
  fontWeightBold: typographyTokens.fontWeight.bold,

  // H1 variant (Page title)
  h1: {
    fontFamily: typographyTokens.fontFamily.heading,
    fontWeight: typographyTokens.fontWeight.semibold,
    fontSize: `${String(typographyTokens.fontSize.pageTitle.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.pageTitle.lineHeight / typographyTokens.fontSize.pageTitle.size
    ),
  },

  // H2 variant (Section title)
  h2: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.semibold,
    fontSize: `${String(typographyTokens.fontSize.sectionTitle.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.sectionTitle.lineHeight /
        typographyTokens.fontSize.sectionTitle.size
    ),
  },

  // H3 variant (Card title)
  h3: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.semibold,
    fontSize: `${String(typographyTokens.fontSize.cardTitle.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.cardTitle.lineHeight / typographyTokens.fontSize.cardTitle.size
    ),
  },

  // H4 variant (subtitle)
  h4: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.medium,
    fontSize: `${String(typographyTokens.fontSize.body.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.body.lineHeight / typographyTokens.fontSize.body.size
    ),
  },

  // H5 variant (subtitle2)
  h5: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.medium,
    fontSize: `${String(typographyTokens.fontSize.secondary.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.secondary.lineHeight / typographyTokens.fontSize.secondary.size
    ),
  },

  // H6 variant (caption)
  h6: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.regular,
    fontSize: `${String(typographyTokens.fontSize.caption.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.caption.lineHeight / typographyTokens.fontSize.caption.size
    ),
  },

  // Emphasized label (item names, form labels, list titles): body size,
  // semibold. Features use this instead of sx fontWeight.
  subtitle2: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.semibold,
    fontSize: `${String(typographyTokens.fontSize.body.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.body.lineHeight / typographyTokens.fontSize.body.size
    ),
  },

  // Body text
  body1: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.regular,
    fontSize: `${String(typographyTokens.fontSize.body.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.body.lineHeight / typographyTokens.fontSize.body.size
    ),
  },

  // Secondary text
  body2: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.regular,
    fontSize: `${String(typographyTokens.fontSize.secondary.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.secondary.lineHeight / typographyTokens.fontSize.secondary.size
    ),
  },

  // Caption text
  caption: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.regular,
    fontSize: `${String(typographyTokens.fontSize.caption.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.caption.lineHeight / typographyTokens.fontSize.caption.size
    ),
  },

  // Monospace (for IDs, numeric data)
  mono: {
    fontFamily: typographyTokens.fontFamily.mono,
    fontWeight: typographyTokens.fontWeight.regular,
    fontSize: `${String(typographyTokens.fontSize.body.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.body.lineHeight / typographyTokens.fontSize.body.size
    ),
  },

  // KPI values (dashboard, billing, reports). Tabular figures keep digits
  // aligned when values update.
  kpi: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.semibold,
    fontSize: `${String(typographyTokens.fontSize.kpi.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.kpi.lineHeight / typographyTokens.fontSize.kpi.size
    ),
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
  },

  // Button text
  button: {
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.medium,
    fontSize: `${String(typographyTokens.fontSize.body.size)}px`,
    lineHeight: String(
      typographyTokens.fontSize.body.lineHeight / typographyTokens.fontSize.body.size
    ),
    textTransform: 'none' as const, // No uppercase for better readability
  },
};
