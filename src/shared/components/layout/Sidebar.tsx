/**
 * Sidebar navigation.
 *
 * Variants (chosen by AppShell, state from useSidebarState, A17):
 * - `docked`: pinned 260px sidebar in the page flow; the content shrinks
 * - `floating`: peek over the content under the header (hover), no backdrop
 * - `modal`: temporary drawer for phones and touch screens
 * The sidebar is hidden by default. (The icon-rail rendering of
 * SidebarContent is kept for a later compact mode but unused now.)
 *
 * Follows the active color scheme. Active items expose aria-current="page".
 * Groups (Orders, Report; A33, D-81) open on click and expose aria-expanded;
 * the group holding the current page opens by itself.
 */

import { useState } from 'react';
// A plain Link: NavLink would set its own aria-current by URL prefix (two items current at once).
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
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
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { layoutTokens } from '@/theme/tokens';
import { can } from '@/shared/api';
import { useSession } from '@/shared/hooks/useSession';
import { BrandLogo } from './BrandLogo';
import { NAV_SECTIONS, type NavItem, type NavLink, type NavParent } from './navigation';

const SIDEBAR_WIDTH = layoutTokens.sidebarWidth;

export type SidebarVariant = 'docked' | 'floating' | 'modal';

interface SidebarContentProps {
  rail: boolean;
  onNavigate?: () => void;
}

function SidebarContent({ rail, onNavigate }: SidebarContentProps) {
  const location = useLocation();
  const { context } = useSession();
  const allowed = (link: NavLink) => link.capability === undefined || can(context, link.capability);
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.flatMap((item): NavItem[] => {
      if (item.kind === 'link') return allowed(item) ? [item] : [];
      const links = item.links.filter(allowed);
      return links.length > 0 ? [{ ...item, links }] : [];
    }),
  })).filter((section) => section.items.length > 0);

  // A group opens on click; the group of the current page is open unless the user closed it.
  const activeGroup = sections
    .flatMap((section) => section.items)
    .find((item): item is NavParent => item.kind === 'group' && item.links.some((link) => link.isActive(location)))?.id;
  const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(new Map());
  const [seenActive, setSeenActive] = useState(activeGroup);
  if (seenActive !== activeGroup) {
    // Entering another group's page opens that group again (state adjusted during render, no effect).
    setSeenActive(activeGroup);
    if (activeGroup !== undefined && overrides.has(activeGroup)) {
      const next = new Map(overrides);
      next.delete(activeGroup);
      setOverrides(next);
    }
  }
  const isOpen = (id: string) => overrides.get(id) ?? id === activeGroup;
  const toggle = (id: string) => {
    setOverrides(new Map(overrides).set(id, !isOpen(id)));
  };

  const renderLink = (link: NavLink, nested: boolean) => {
    const active = link.isActive(location);
    const button = (
      <ListItemButton
        component={RouterLink}
        to={link.to}
        aria-current={active ? 'page' : undefined}
        selected={active}
        onClick={onNavigate}
        sx={{
          minHeight: 40,
          mx: 1,
          pl: rail ? 0 : nested ? 4 : 1.5,
          pr: rail ? 0 : 1.5,
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
          {link.icon}
        </ListItemIcon>
        {!rail && (
          <ListItemText
            primary={link.label}
            slotProps={{
              primary: { variant: 'body2', sx: { fontWeight: active ? 600 : 500 } },
            }}
          />
        )}
      </ListItemButton>
    );
    return (
      <ListItem key={link.to} disablePadding sx={{ py: 0.25 }}>
        {rail ? (
          <Tooltip title={link.label} placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </ListItem>
    );
  };

  const renderGroup = (group: NavParent) => {
    // The rail has no room for nesting: its links are listed flat.
    if (rail) return group.links.map((link) => renderLink(link, false));
    const expanded = isOpen(group.id);
    const containsActive = group.links.some((link) => link.isActive(location));
    const listId = `nav-group-${group.id}`;
    return (
      <ListItem key={group.id} disablePadding sx={{ py: 0.25, display: 'block' }}>
        <ListItemButton
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => {
            toggle(group.id);
          }}
          sx={{ minHeight: 40, mx: 1, px: 1.5, borderRadius: 1.5, color: 'text.primary' }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: 1.5,
              justifyContent: 'center',
              color: containsActive ? 'primary.main' : 'text.secondary',
            }}
          >
            {group.icon}
          </ListItemIcon>
          <ListItemText
            primary={group.label}
            slotProps={{ primary: { variant: 'body2', sx: { fontWeight: containsActive ? 600 : 500 } } }}
          />
          {expanded ? <ExpandLessIcon fontSize="small" aria-hidden="true" /> : <ExpandMoreIcon fontSize="small" aria-hidden="true" />}
        </ListItemButton>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List id={listId} disablePadding aria-label={group.label}>
            {group.links.map((link) => renderLink(link, true))}
          </List>
        </Collapse>
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
        <BrandLogo showName={!rail} />
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {sections.map((section, index) => (
          <Box component="section" key={section.label} aria-label={section.label}>
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
                {section.label}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => (item.kind === 'link' ? renderLink(item, false) : renderGroup(item)))}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export const SIDEBAR_ID = 'app-navigation';

interface SidebarProps {
  variant: SidebarVariant;
  /** Floating and modal visibility (docked is always shown). */
  open: boolean;
  onClose: () => void;
  /** Floating only: keeps the peek open while hovered or focused. */
  paperProps?: React.HTMLAttributes<HTMLDivElement>;
  paperRef?: React.Ref<HTMLDivElement>;
}

export function Sidebar({ variant, open, onClose, paperProps, paperRef }: SidebarProps) {
  if (variant === 'modal') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { id: SIDEBAR_ID, sx: { width: SIDEBAR_WIDTH, maxWidth: '82vw' } } }}
      >
        <SidebarContent rail={false} onNavigate={onClose} />
      </Drawer>
    );
  }
  if (variant === 'floating') {
    return (
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        slotProps={{
          paper: {
            id: SIDEBAR_ID,
            ref: paperRef,
            ...paperProps,
            sx: {
              top: layoutTokens.headerHeight,
              height: `calc(100% - ${String(layoutTokens.headerHeight)}px)`,
              width: SIDEBAR_WIDTH,
              boxShadow: 8,
            },
          },
        }}
      >
        <SidebarContent rail={false} onNavigate={onClose} />
      </Drawer>
    );
  }
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, overflowX: 'hidden', boxSizing: 'border-box' },
      }}
      slotProps={{ paper: { id: SIDEBAR_ID } }}
    >
      <SidebarContent rail={false} />
    </Drawer>
  );
}
