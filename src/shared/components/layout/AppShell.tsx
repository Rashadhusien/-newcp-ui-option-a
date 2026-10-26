/**
 * App shell: sidebar + header + main content landmark.
 *
 * Device bands:
 * - mobile (< 640): overlay drawer, opened from the header menu button
 * - tablet (640-1023): icon rail; the menu button opens the full drawer
 * - desktop (>= 1024): full sidebar, always shown; no menu button (design
 *   system AppShell). The A1 collapse-to-rail preference is gone.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SkipLink } from './SkipLink';

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [overlayOpen, setOverlayOpen] = useState(false);

  const closeOverlay = () => {
    setOverlayOpen(false);
  };

  const toggleNavigation = () => {
    setOverlayOpen((current) => !current);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SkipLink />
      {isMobile ? (
        <Sidebar variant="overlay" open={overlayOpen} onClose={closeOverlay} />
      ) : isDesktop ? (
        <Sidebar variant="full" open={false} onClose={closeOverlay} />
      ) : (
        <>
          <Sidebar variant="rail" open={false} onClose={closeOverlay} />
          <Sidebar variant="overlay" open={overlayOpen} onClose={closeOverlay} />
        </>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Header onMenuClick={toggleNavigation} navigationExpanded={overlayOpen} />
        <Container
          component="main"
          id="main-content"
          maxWidth={false}
          tabIndex={-1}
          sx={{ py: 3, px: { xs: 2, md: 3 }, maxWidth: '90rem' }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
