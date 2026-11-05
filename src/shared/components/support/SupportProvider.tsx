/**
 * Help and support (A17, from the earlier POC): a floating button bottom
 * right on every page of the app shell and a compact, non-modal panel above
 * it. The page stays usable while it is open; Escape or the close buttons
 * hide it and return focus to the button. The panel is only hidden, so a
 * draft survives closing it and moving between pages (memory only).
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Grow from '@mui/material/Grow';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import { SupportContextValue, type SupportValue } from '@/shared/hooks/useSupport';
import { layoutTokens } from '@/theme/tokens';
import { SupportForm } from './SupportForm';

/** Floating button size and distance from the viewport edges (px). */
const FAB_SIZE = 56;
const FAB_OFFSET = 24;
const PANEL_WIDTH = 400;

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (open && !loaded) setLoaded(true);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const titleId = useId();
  const panelBottom = FAB_OFFSET + FAB_SIZE + 8;

  const close = () => {
    setOpen(false);
    fabRef.current?.focus();
  };

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
  }, [open]);

  const value = useMemo<SupportValue>(
    () => ({
      openSupport: () => {
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <SupportContextValue.Provider value={value}>
      {children}
      <Grow in={open} style={{ transformOrigin: 'bottom right' }}>
        <Paper
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          elevation={8}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            }
          }}
          sx={{
            position: 'fixed',
            right: FAB_OFFSET,
            bottom: panelBottom,
            zIndex: (theme) => theme.zIndex.speedDial,
            width: `min(${String(PANEL_WIDTH)}px, calc(100vw - ${String(FAB_OFFSET * 2)}px))`,
            maxHeight: `calc(100dvh - ${String(panelBottom + layoutTokens.headerHeight + 8)}px)`,
            overflowY: 'auto',
            visibility: open ? 'visible' : 'hidden',
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
          >
            <SupportAgentOutlinedIcon fontSize="small" color="primary" aria-hidden="true" />
            <Typography id={titleId} variant="h3" component="h2" sx={{ flex: 1 }}>
              Help and support
            </Typography>
            <IconButton size="small" aria-label="Close support panel" onClick={close}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Box sx={{ px: 2.5, py: 2 }}>{loaded && <SupportForm focusOnMount />}</Box>
        </Paper>
      </Grow>
      <Tooltip title={open ? 'Close support' : 'Help and support'} placement="left">
        <Fab
          ref={fabRef}
          color="primary"
          aria-label={open ? 'Close support panel' : 'Open help and support'}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          onClick={() => {
            if (open) close();
            else setOpen(true);
          }}
          sx={{
            position: 'fixed',
            right: FAB_OFFSET,
            bottom: FAB_OFFSET,
            zIndex: (theme) => theme.zIndex.speedDial,
            width: FAB_SIZE,
            height: FAB_SIZE,
          }}
        >
          {open ? <CloseOutlinedIcon /> : <SupportAgentOutlinedIcon />}
        </Fab>
      </Tooltip>
    </SupportContextValue.Provider>
  );
}
