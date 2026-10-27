/**
 * App shell: sidebar + header + main content + footer + support button (A17,
 * pattern from the earlier POC, Notion-style).
 *
 * The sidebar is hidden by default, so every page uses the full width.
 * Tablet and wider with a mouse: hovering the header menu button or the left
 * edge shows it over the content (peek); clicking the button pins it in the
 * page flow and the content shrinks; clicking again hides it. Phones and
 * touch screens: the button opens a modal drawer. State: useSidebarState.
 */

import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSidebarState } from '@/shared/hooks/useSidebarState';
import { SupportProvider } from '@/shared/components/support/SupportProvider';
import { layoutTokens } from '@/theme/tokens';
import { AppFooter } from './AppFooter';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SkipLink } from './SkipLink';

/** Width of the invisible left-edge strip that peeks the sidebar on hover. */
const PEEK_ZONE_WIDTH = 8;

export function AppShell() {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('sm'));
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const floating = isWide && finePointer;
  const nav = useSidebarState(floating);

  return (
    <SupportProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <SkipLink />
        {!floating ? (
          <Sidebar variant="modal" open={nav.state !== 'closed'} onClose={nav.close} />
        ) : nav.state === 'pinned' ? (
          <Sidebar variant="docked" open onClose={nav.close} />
        ) : (
          <>
            <Box
              aria-hidden="true"
              {...nav.hoverProps}
              sx={{
                position: 'fixed',
                left: 0,
                top: layoutTokens.headerHeight,
                bottom: 0,
                width: PEEK_ZONE_WIDTH,
                zIndex: (t) => t.zIndex.drawer - 1,
              }}
            />
            <Sidebar
              variant="floating"
              open={nav.state === 'peek'}
              onClose={nav.closePeek}
              paperRef={nav.paperRef}
              paperProps={nav.paperProps}
            />
          </>
        )}
        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Header
            state={nav.state}
            floating={floating}
            onMenuClick={nav.toggle}
            menuButtonRef={nav.buttonRef}
            menuHoverProps={nav.hoverProps}
          />
          <Container
            component="main"
            id="main-content"
            maxWidth={false}
            tabIndex={-1}
            sx={{ flex: 1, py: 3, px: { xs: 2, md: 3 }, maxWidth: `${String(layoutTokens.contentMaxWidth)}px` }}
          >
            <Outlet />
          </Container>
          <AppFooter />
        </Box>
      </Box>
    </SupportProvider>
  );
}
