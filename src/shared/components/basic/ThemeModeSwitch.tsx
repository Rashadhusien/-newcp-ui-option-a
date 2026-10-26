/**
 * ThemeModeSwitch: segmented Light / Dark / System control (design system
 * AppShell "theme control"). The choice is persisted by MUI's colour-scheme
 * storage. Icon + text; `compact` keeps the icons and moves the words into
 * each button's accessible name (narrow headers).
 */

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useColorScheme } from '@mui/material/styles';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';

type ThemeMode = 'light' | 'dark' | 'system';

const OPTIONS: readonly { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <LightModeOutlinedIcon fontSize="small" aria-hidden="true" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeOutlinedIcon fontSize="small" aria-hidden="true" /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessOutlinedIcon fontSize="small" aria-hidden="true" /> },
];

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export interface ThemeModeSwitchProps {
  /** Icons only (labels stay in the accessible names). */
  compact?: boolean;
}

export function ThemeModeSwitch({ compact = false }: ThemeModeSwitchProps) {
  const { mode, setMode } = useColorScheme();
  const active: ThemeMode = isThemeMode(mode) ? mode : 'system';

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={active}
      aria-label="Colour theme"
      onChange={(_event, value: unknown) => {
        // A click on the active button sends null; the mode stays.
        if (isThemeMode(value)) setMode(value);
      }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          aria-label={`${option.label} theme`}
          sx={{ gap: 0.75, px: compact ? 1 : 1.5 }}
        >
          {option.icon}
          {!compact && option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
