/**
 * Header bar (design system AppShell, A17 sidebar behaviour):
 * - menu button at every width: hover peeks the hidden sidebar, click pins
 *   or hides it (phones: opens the drawer); the brand shows here while the
 *   sidebar is not docked;
 * - data source (MOCK / INTEGRATED) on phones only: from 640 up it sits in
 *   each data page's PageHeader;
 * - read-only active tenant (IAM v0.9.7, from 640 up; the account menu
 *   repeats it on phones);
 * - segmented colour theme (Light / Dark / System) from 640 up, icons only
 *   below 1024; on phones it lives on the Settings page;
 * - the account menu.
 */

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { evidenceOf, readApiConfig } from '@/shared/api';
import { ThemeModeSwitch } from '@/shared/components/basic/ThemeModeSwitch';
import { EvidenceBadge } from '@/shared/components/feedback/EvidenceBadge';
import { TenantBadge } from '@/shared/components/feedback/TenantBadge';
import { useSession } from '@/shared/hooks/useSession';
import type { SidebarState } from '@/shared/hooks/useSidebarState';
import { SIDEBAR_ID } from './Sidebar';
import { UserMenu } from './UserMenu';

const EVIDENCE = evidenceOf(readApiConfig());

export interface HeaderProps {
  state: SidebarState;
  /** Peek/pin behaviour (mouse, tablet and wider) vs a modal drawer. */
  floating: boolean;
  onMenuClick: () => void;
  menuButtonRef: React.Ref<HTMLButtonElement>;
  /** Hovering the button peeks the sidebar. */
  menuHoverProps: Pick<React.HTMLAttributes<HTMLElement>, 'onPointerEnter' | 'onPointerLeave'>;
}

function menuLabel(state: SidebarState, floating: boolean): string {
  if (!floating) return state === 'closed' ? 'Open navigation' : 'Close navigation';
  return state === 'pinned' ? 'Hide navigation' : 'Pin navigation';
}

export function Header({ state, floating, onMenuClick, menuButtonRef, menuHoverProps }: HeaderProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const tenant = useSession().context?.activeTenant ?? null;
  const label = menuLabel(state, floating);

  return (
    <AppBar
      component="header"
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
        <Tooltip title={label}>
          <IconButton
            ref={menuButtonRef}
            aria-label={label}
            aria-controls={SIDEBAR_ID}
            aria-expanded={state !== 'closed'}
            aria-pressed={floating ? state === 'pinned' : undefined}
            onClick={onMenuClick}
            {...menuHoverProps}
            edge="start"
          >
            {state === 'pinned' ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
        {state !== 'pinned' && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <MedicalServicesIcon color="primary" aria-hidden="true" />
            <Typography variant="h3" component="span" noWrap>
              New CP
            </Typography>
          </Stack>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {isPhone && <EvidenceBadge evidence={EVIDENCE} />}
        {tenant && <TenantBadge tenant={tenant} />}
        {!isPhone && <ThemeModeSwitch compact={!isDesktop} />}

        <UserMenu />
      </Toolbar>
    </AppBar>
  );
}
