/**
 * App shell: sidebar + header + main content landmark.
 *
 * Device bands:
 * - mobile (< 640): overlay drawer, opened from the header menu button
 * - tablet (640-1023): icon rail; the menu button opens the full drawer
 * - desktop (>= 1024): full sidebar; the menu button collapses it to the
 *   rail, and the choice is remembered
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

const COLLAPSED_KEY = 'newcp-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(value));
  } catch {
    // Preference simply isn't remembered.
  }
}

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const closeOverlay = () => {
    setOverlayOpen(false);
  };

  const toggleNavigation = () => {
    if (isDesktop) {
      setCollapsed((current) => {
        writeCollapsed(!current);
        return !current;
      });
      return;
    }
    setOverlayOpen((current) => !current);
  };

  const navigationExpanded = isDesktop ? !collapsed : overlayOpen;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SkipLink />
      {isMobile ? (
        <Sidebar variant="overlay" open={overlayOpen} onClose={closeOverlay} />
      ) : isDesktop ? (
        <Sidebar variant={collapsed ? 'rail' : 'full'} open={false} onClose={closeOverlay} />
      ) : (
        <>
          <Sidebar variant="rail" open={false} onClose={closeOverlay} />
          <Sidebar variant="overlay" open={overlayOpen} onClose={closeOverlay} />
        </>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Header onMenuClick={toggleNavigation} navigationExpanded={navigationExpanded} />
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
