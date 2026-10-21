/**
 * Design Tokens - Single Source of Truth
 *
 * Direction: "radiology / diagnostic imaging" look.
 * - Crisp X-ray blue primary on cool, blue-tinted neutrals (no neon, no saturated fills).
 * - Soft, low-saturation semantic colors; status is always icon + label.
 * - Dark mode is a near-black blue (like a CBCT viewer) with a luminous sky-blue primary.
 * - Borders + very soft shadows instead of heavy elevation.
 *
 * Every text/UI pair below was computed with the WCAG 2.x contrast formula
 * (see the contrast table in docs/DESIGN_TOKENS.md - update it from this file).
 *
 * NOTE: all export names and object shapes are unchanged from the previous
 * version so existing imports keep compiling. New keys are additive only:
 * colorTokens.inputBorder, colorTokens.action, focusTokens.colorDark,
 * tableTokens.rowSelected, layoutTokens, scrollbarTokens.
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colorTokens = {
  // Primary brand color (radiology blue)
  primary: {
    light: '#0F5FA8', // 6.4:1 on white
    lightHover: '#0B4A85', // 8.9:1 on white
    lightTint: '#E6F0FB', // soft selected / hover background
    dark: '#6FB2F2', // 7.9:1 on dark surface
  },

  // Secondary neutral color (slate)
  secondary: {
    light: '#475A72', // 6.6:1 on white
    dark: '#98A8BC', // 7.4:1 on dark surface
  },

  // Semantic colors (muted, non-neon). Light values all >= 4.5:1 on white.
  semantic: {
    success: {
      light: '#1A7F4B', // 5.02:1
      dark: '#4CC38A', // 7.81:1 on dark surface
    },
    warning: {
      light: '#A85B08', // 5.04:1
      dark: '#E8A94A', // 8.41:1
    },
    error: {
      light: '#C0362C', // 5.52:1
      dark: '#F0786F', // 6.28:1
    },
    info: {
      light: '#5B4BC4', // 6.4:1
      dark: '#A99CF2', // 7.6:1
    },
  },

  // Background and surface colors
  background: {
    light: '#F4F7FB', // cool clinical canvas
    dark: '#0A0F17', // near-black imaging blue
  },

  surface: {
    light: '#FFFFFF',
    dark: '#111824',
    elevatedLight: '#FFFFFF',
    elevatedDark: '#16202E',
    // Menus, popovers, and select lists float one step above elevated.
    overlayLight: '#FFFFFF',
    overlayDark: '#1C2738',
    // Table headers, section bands, and quiet fills.
    subtleLight: '#F7F9FC',
    subtleDark: '#0D131D',
  },

  // Decorative borders (cards, dividers). Not used for input boundaries.
  border: {
    light: '#DDE4EE',
    dark: '#243042',
  },

  // Hairlines inside surfaces (table rows, list separators); one step quieter
  // than `border`.
  divider: {
    light: '#E7ECF3',
    dark: '#1C2635',
  },

  // Input / control boundaries need >= 3:1 (WCAG 1.4.11)
  inputBorder: {
    light: '#7A8AA0', // 3.4:1 on white
    dark: '#5F6F86', // 3.9:1 on dark surface
  },

  // Interaction overlays
  action: {
    hover: {
      light: 'rgba(15, 30, 51, 0.04)',
      dark: 'rgba(225, 235, 248, 0.06)',
    },
    selected: {
      light: 'rgba(15, 95, 168, 0.08)',
      dark: 'rgba(111, 178, 242, 0.14)',
    },
  },

  // Text colors
  text: {
    primary: {
      light: '#0F1E33', // 15:1 on white
      dark: '#E4ECF6', // 15:1 on dark surface
    },
    secondary: {
      light: '#475A72', // 6.6:1 on white
      dark: '#98A8BC', // 7.4:1 on dark surface
    },
    disabled: {
      light: '#9AA7B8',
      dark: '#5F6F86',
    },
    // On-color text: white on the deep light-scheme fills (>= 5:1).
    onFillLight: '#FFFFFF',
  },
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typographyTokens = {
  // Font families. Headings use Inter too (one family = cleaner enterprise look,
  // one font to load). Change `heading` here to swap it globally.
  fontFamily: {
    body: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    heading: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },

  // Font sizes and line heights (format: size/lineHeight)
  fontSize: {
    root: 16, // px
    pageTitle: { size: 22, lineHeight: 28 },
    sectionTitle: { size: 16, lineHeight: 24 },
    cardTitle: { size: 14, lineHeight: 20 },
    body: { size: 14, lineHeight: 20 },
    secondary: { size: 13, lineHeight: 18 },
    caption: { size: 12, lineHeight: 16 },
    tableHeader: { size: 12, lineHeight: 16 },
    tableCell: { size: 13, lineHeight: 18 },
    kpi: { size: 24, lineHeight: 32 },
  },

  // Font weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Letter spacing
  letterSpacing: {
    tableHeader: '0.06em',
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacingTokens = {
  // Base spacing unit (MUI uses 4px as base)
  unit: 4,

  // Spacing scale (multiples of unit)
  scale: [4, 8, 12, 16, 24, 32, 48],

  // Specific spacing values
  pagePadding: {
    mobile: 16,
    desktop: 24,
  },

  maxContentWidth: 90, // rem

  cardPadding: 20,

  sectionGap: 24,
} as const;

// ============================================================================
// LAYOUT TOKENS (consumed by AppShell / Sidebar / Header)
// ============================================================================

export const layoutTokens = {
  sidebarWidth: 260, // px, persistent (>= 1024)
  sidebarRailWidth: 72, // px, collapsed rail (640-1023)
  headerHeight: 64, // px
  contentMaxWidth: 1440, // px
  gridGap: 24, // px between dashboard cards
  cardGap: 20, // px inside card groups
} as const;

// ============================================================================
// RADIUS TOKENS
// ============================================================================

// Scale: controls (buttons, inputs, chips, badges) = sm; cards and papers =
// md; dialogs = lg.
export const radiusTokens = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

// ============================================================================
// SHADOW TOKENS (soft, layered, cool-tinted; borders do most of the work)
// ============================================================================

// Cards rely on borders (no shadow). Shadows are reserved for floating
// layers: md = menus/popovers, lg = drawers/dialogs. Dark variants are
// deeper and neutral because tinted shadows vanish on graphite.
export const shadowTokens = {
  sm: '0 1px 2px 0 rgb(16 24 40 / 0.05)',
  md: '0 4px 12px -2px rgb(16 24 40 / 0.08), 0 2px 4px -2px rgb(16 24 40 / 0.04)',
  lg: '0 16px 32px -8px rgb(16 24 40 / 0.16), 0 4px 8px -2px rgb(16 24 40 / 0.05)',
  mdDark: '0 8px 24px -4px rgb(0 0 0 / 0.45)',
  lgDark: '0 20px 40px -8px rgb(0 0 0 / 0.55)',
} as const;

// ============================================================================
// BREAKPOINT TOKENS
// ============================================================================

// Aligned with the Angular source's device bands (NavigationService):
// mobile <= 640 (drawer), tablet 641-1024 (icon rail), desktop above.
export const breakpointTokens = {
  xs: 0,
  sm: 640,
  md: 1024,
  lg: 1280,
  xl: 1536,
} as const;

// Device classifications (for use in components)
export const device = {
  mobile: breakpointTokens.sm, // < 640px
  tablet: breakpointTokens.md, // 640–1023px
  desktop: breakpointTokens.md, // ≥ 1024px
} as const;

// ============================================================================
// FOCUS TOKENS
// ============================================================================

export const focusTokens = {
  width: 2, // px
  style: 'solid',
  color: '#0F5FA8', // primary (light scheme)
  colorDark: '#6FB2F2', // primary (dark scheme)
  offset: 2, // px
} as const;

// ============================================================================
// TOUCH TARGET TOKENS
// ============================================================================

export const touchTargetTokens = {
  minSize: 44, // px (project target; WCAG 2.2 AA minimum is 24px)
} as const;

// ============================================================================
// TABLE TOKENS (Orders grid framing — both color schemes)
// ============================================================================

export const tableTokens = {
  headerBg: {
    light: '#F7F9FC', // 6.3:1 with secondary text
    dark: '#0D131D', // 7.6:1 with secondary text
  },
  rowHover: {
    light: 'rgba(15, 95, 168, 0.04)',
    dark: 'rgba(111, 178, 242, 0.08)',
  },
  rowSelected: {
    light: 'rgba(15, 95, 168, 0.08)',
    dark: 'rgba(111, 178, 242, 0.14)',
  },
} as const;

// ============================================================================
// CHART TOKENS (categorical data-vis palette, 9 order statuses)
// ============================================================================
//
// Muted, distinguishable hues (no neon). Ordered to match STATUS_ORDER in
// features/dashboard/dashboardData.ts and aligned with status semantics:
// pending (amber), no_scans (orange), in_progress (indigo),
// waiting_confirmation (violet), sleeve_design (sky), guide_design (teal),
// ready_for_shipping (green), shipped (olive), cancelled (neutral slate).
// Every light slice is >= 3:1 on white; every dark slice is >= 6.8:1 on the
// dark surface. Legends always pair the swatch with an icon + label.

export const chartTokens = {
  // Series colors for x-charts (Phase 29). Slot 1 is every single-series
  // chart; slot 2 is the second series where two compare (received vs
  // completed). Validated with the dataviz validate_palette script on the
  // card surfaces (#FFFFFF light, #101C20 dark): lightness band, chroma
  // floor, CVD (deutan/protan/tritan ΔE >= 21) and normal-vision separation
  // (ΔE >= 23), contrast >= 3:1 — all pass. Orange, not green, so the
  // second series never reads as the "success" status.
  series: {
    light: ['#0F5FA8', '#D4692B'],
    dark: ['#5A9FE0', '#D9773F'],
  },
  categorical: {
    light: [
      '#B8770F',
      '#D4692B',
      '#3F5BD8',
      '#8A5CC2',
      '#3B8FC4',
      '#2E8B8B',
      '#3C9A5F',
      '#7A9A2B',
      '#7A8797',
    ],
    dark: [
      '#E3B04B',
      '#EE8A55',
      '#8C9EFF',
      '#B497E6',
      '#6DB7E6',
      '#4FB8B8',
      '#5FC58A',
      '#A6C24E',
      '#9AA4B2',
    ],
  },
  // Sequential single-hue blue ramp for ordered workflow stages
  // (New -> Completed). Replaces the Angular rainbow stage colors; stage
  // bars always carry a text label and count.
  stageScale: {
    light: ['#C3DAF2', '#9BC1EA', '#6FA5DE', '#4689CF', '#226FBC', '#0F5FA8', '#0A4478'],
    dark: ['#23466E', '#2C5785', '#386A9E', '#4A80B8', '#5E98D2', '#7DB3EB', '#A8CDF6'],
  },
  // Muted categorical palette for up to six unordered categories
  // (restoration mix). Reuses the contrast-checked hues above.
  categoricalMuted: {
    light: ['#0F5FA8', '#2E8B8B', '#B8770F', '#8A5CC2', '#3B8FC4', '#7A8797'],
    dark: ['#6FB2F2', '#4FB8B8', '#E3B04B', '#B497E6', '#6DB7E6', '#9AA4B2'],
  },
  // Decorative area fill under the trend line (readability only; values
  // are always paired with the trend summary + data table, never alone).
  trendArea: {
    light: 'rgba(15, 95, 168, 0.12)',
    dark: 'rgba(111, 178, 242, 0.18)',
  },
} as const;

// ============================================================================
// STATUS BADGE TOKENS (soft pills — never color-only, icon + label)
// ============================================================================
//
// Light: pastel tint + darkened semantic text (all >= 5.5:1).
// Dark: translucent 16% tint + bright semantic text (all >= 4.9:1).

export const statusBadgeTokens = {
  success: {
    light: { bg: '#E3F5EA', text: '#146C3E' }, // 5.71:1
    dark: { bg: 'rgba(76, 195, 138, 0.16)', text: '#4CC38A' },
  },
  warning: {
    light: { bg: '#FDF0D5', text: '#8A4B08' }, // 6.02:1
    dark: { bg: 'rgba(232, 169, 74, 0.16)', text: '#E8A94A' },
  },
  error: {
    light: { bg: '#FCE8E6', text: '#B02A21' }, // 5.57:1
    dark: { bg: 'rgba(240, 120, 111, 0.16)', text: '#F0786F' },
  },
  info: {
    light: { bg: '#EEEBFB', text: '#4B3BAE' }, // 7.6:1
    dark: { bg: 'rgba(169, 156, 242, 0.16)', text: '#A99CF2' },
  },
  // Work actively in progress (brand blue, distinct from info violet).
  primary: {
    light: { bg: '#E6F0FB', text: '#0B4A85' }, // 8.0:1
    dark: { bg: 'rgba(111, 178, 242, 0.16)', text: '#93C5F5' },
  },
  neutral: {
    light: { bg: '#EDF1F6', text: '#475A72' }, // 5.9:1
    dark: { bg: 'rgba(152, 168, 188, 0.16)', text: '#CBD5E2' },
  },
} as const;

// ============================================================================
// SCROLLBAR TOKENS (themed page/control scrollbars)
// ============================================================================

// Thumb must read as a control boundary (>= 3:1, WCAG 1.4.11) on every
// surface; hover uses the primary action colour (same values as primary).
// Track is transparent (the page/component background shows through).
export const scrollbarTokens = {
  thumb: { light: '#64748B', dark: '#7A8AA0' },
  thumbHover: { light: '#0F5FA8', dark: '#6FB2F2' },
} as const;
