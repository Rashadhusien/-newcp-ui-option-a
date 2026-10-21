/**
 * Sidebar navigation.
 *
 * Variants (chosen by AppShell):
 * - `full`: persistent 260px sidebar (desktop, expanded)
 * - `rail`: persistent 72px icon rail (tablet, or desktop collapsed)
 * - `overlay`: temporary full drawer (mobile, or tablet expanded)
 *
 * Follows the active color scheme. Active items expose aria-current="page".
 */

import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { ROUTES } from '@/app/routes';
import { layoutTokens } from '@/theme/tokens';
import { NAV_GROUPS, type NavEntry } from './navigation';

const SIDEBAR_WIDTH = layoutTokens.sidebarWidth;
const SIDEBAR_RAIL_WIDTH = layoutTokens.sidebarRailWidth;

export type SidebarVariant = 'full' | 'rail' | 'overlay';

function isActivePath(pathname: string, to: string): boolean {
  if (to === ROUTES.reporting) return pathname === ROUTES.reporting || pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

interface SidebarContentProps {
  rail: boolean;
  onNavigate?: () => void;
}

function SidebarContent({ rail, onNavigate }: SidebarContentProps) {
  const { pathname } = useLocation();

  const renderEntry = (entry: NavEntry) => {
    const active = isActivePath(pathname, entry.to);
    const button = (
      <ListItemButton
        component={NavLink}
        to={entry.to}
        aria-current={active ? 'page' : undefined}
        selected={active}
        onClick={onNavigate}
        sx={{
          minHeight: 40,
          mx: 1,
          px: rail ? 0 : 1.5,
          borderRadius: 1.5,
          justifyContent: rail ? 'center' : 'flex-start',
          color: active ? 'primary.main' : 'text.primary',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: rail ? 0 : 1.5,
            justifyContent: 'center',
            color: active ? 'primary.main' : 'text.secondary',
          }}
        >
          {entry.icon}
        </ListItemIcon>
        {!rail && (
          <ListItemText
            primary={entry.label}
            slotProps={{
              primary: { variant: 'body2', sx: { fontWeight: active ? 600 : 500 } },
            }}
          />
        )}
      </ListItemButton>
    );
    return (
      <ListItem key={entry.to} disablePadding sx={{ py: 0.25 }}>
        {rail ? (
          <Tooltip title={entry.label} placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </ListItem>
    );
  };

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Toolbar sx={{ gap: 1, px: rail ? 0 : 2.5, justifyContent: rail ? 'center' : 'flex-start' }}>
        <MedicalServicesIcon color="primary" aria-hidden="true" />
        {!rail && (
          <Typography variant="h3" component="span" noWrap>
            New CP
          </Typography>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {NAV_GROUPS.map((group, index) => (
          <Box component="section" key={group.label} aria-label={group.label}>
            {rail ? (
              index > 0 && <Divider sx={{ mx: 2, my: 1 }} />
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  px: 2.5,
                  pt: index === 0 ? 1 : 2,
                  pb: 0.5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {group.label}
              </Typography>
            )}
            <List disablePadding>{group.entries.map(renderEntry)}</List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

interface SidebarProps {
  variant: SidebarVariant;
  /** Overlay drawer visibility. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ variant, open, onClose }: SidebarProps) {
  if (variant === 'overlay') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, maxWidth: '82vw' } }}
      >
        <SidebarContent rail={false} onNavigate={onClose} />
      </Drawer>
    );
  }
  const width = variant === 'rail' ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH;
  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width, overflowX: 'hidden', boxSizing: 'border-box' },
      }}
    >
      <SidebarContent rail={variant === 'rail'} />
    </Drawer>
  );
}
