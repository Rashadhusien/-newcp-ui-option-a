/**
 * Theme Type Augmentation
 *
 * This file augments the MUI theme type to include custom properties.
 * This allows TypeScript to recognize custom theme properties.
 */

import '@mui/material/styles';
import type { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface Theme {
    custom: Record<string, unknown>;
    focusRing: {
      width: number;
      style: string;
      color: string;
      offset: number;
    };
  }

  interface ThemeOptions {
    custom?: Record<string, unknown>;
    focusRing?: {
      width: number;
      style: string;
      color: string;
      offset: number;
    };
  }

  interface TypographyVariants {
    mono: CSSProperties;
    kpi: CSSProperties;
  }

  interface TypographyVariantsOptions {
    mono?: CSSProperties;
    kpi?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    mono: true;
    kpi: true;
  }
}
