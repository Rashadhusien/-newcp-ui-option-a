/**
 * Header bar: navigation toggle, color mode (Light / Dark / System,
 * persisted by MUI), and the account menu.
 */

import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { evidenceOf, readApiConfig } from '@/shared/api';
import { EvidenceBadge } from '@/shared/components/feedback/EvidenceBadge';
import { UserMenu } from './UserMenu';

const EVIDENCE = evidenceOf(readApiConfig());

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <LightModeOutlinedIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeOutlinedIcon fontSize="small" /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessOutlinedIcon fontSize="small" /> },
];

interface HeaderProps {
  onMenuClick: () => void;
  /** Whether the full navigation is currently shown (for the toggle label). */
  navigationExpanded: boolean;
}

export function Header({ onMenuClick, navigationExpanded }: HeaderProps) {
  const { mode, setMode } = useColorScheme();
  const [themeAnchor, setThemeAnchor] = useState<HTMLElement | null>(null);

  const activeTheme: ThemeMode =
    mode === 'light' || mode === 'dark' || mode === 'system' ? mode : 'system';
  const activeOption = THEME_OPTIONS.find((option) => option.value === activeTheme);

  return (
    <AppBar
      component="header"
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
        <Tooltip title={navigationExpanded ? 'Collapse navigation' : 'Expand navigation'}>
          <IconButton
            aria-label={navigationExpanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={navigationExpanded}
            onClick={onMenuClick}
            edge="start"
          >
            {navigationExpanded ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        <EvidenceBadge evidence={EVIDENCE} />

        <Tooltip title={`Color mode: ${activeOption?.label ?? 'System'}`}>
          <IconButton
            aria-label={`Color mode: ${activeOption?.label ?? 'System'}. Change color mode`}
            aria-haspopup="menu"
            aria-expanded={themeAnchor != null ? 'true' : undefined}
            onClick={(event) => {
              setThemeAnchor(event.currentTarget);
            }}
          >
            {activeOption?.icon ?? <SettingsBrightnessOutlinedIcon />}
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={themeAnchor}
          open={themeAnchor != null}
          onClose={() => {
            setThemeAnchor(null);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ list: { 'aria-label': 'Color mode' } }}
        >
          {THEME_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              role="menuitemradio"
              aria-checked={activeTheme === option.value}
              selected={activeTheme === option.value}
              onClick={() => {
                setMode(option.value);
                setThemeAnchor(null);
              }}
            >
              <ListItemIcon>{option.icon}</ListItemIcon>
              {option.label}
            </MenuItem>
          ))}
        </Menu>

        <UserMenu />
      </Toolbar>
    </AppBar>
  );
}
