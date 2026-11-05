/**
 * Skip-to-content link for keyboard users (FR-SH-05).
 *
 * Visually hidden until focused; jumps to #main-content.
 */

import MuiLink from '@mui/material/Link';

export function SkipLink() {
  return (
    <MuiLink
      href="#main-content"
      sx={{
        position: 'absolute',
        left: 8,
        top: '-48px',
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        px: 2,
        py: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'top 0.15s ease-in-out',
        '&:focus-visible': {
          top: 8,
          outlineWidth: 2,
          outlineStyle: 'solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      Skip to content
    </MuiLink>
  );
}
