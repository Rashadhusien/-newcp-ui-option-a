/**
 * Header bar (design system AppShell):
 * - menu button below 1024 only (opens the drawer); at 1024 and wider the
 *   sidebar is always shown, so there is nothing to toggle;
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
import { UserMenu } from './UserMenu';

const EVIDENCE = evidenceOf(readApiConfig());

interface HeaderProps {
  onMenuClick: () => void;
  /** Whether the navigation drawer is open (for the toggle label). */
  navigationExpanded: boolean;
}

export function Header({ onMenuClick, navigationExpanded }: HeaderProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const tenant = useSession().context?.activeTenant ?? null;
  const menuLabel = navigationExpanded ? 'Close navigation' : 'Open navigation';

  return (
    <AppBar
      component="header"
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
        {!isDesktop && (
          <Tooltip title={menuLabel}>
            <IconButton aria-label={menuLabel} aria-expanded={navigationExpanded} onClick={onMenuClick} edge="start">
              {navigationExpanded ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
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
