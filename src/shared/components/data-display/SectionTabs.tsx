/**
 * SectionTabs (POC-1 `src/components/data-display/SectionTabs.tsx`): an
 * in-page tab bar. On phones up to four tabs share the width; more tabs
 * scroll sideways within the bar (the page itself never scrolls). Each tab
 * controls the panel with id `${idPrefix}-panel-${value}`.
 */

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { sectionTabIds } from './sectionTabIds';

export interface SectionTab<V extends string> {
  value: V;
  label: string;
}

export interface SectionTabsProps<V extends string> {
  tabs: readonly SectionTab<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
  idPrefix: string;
}

export function SectionTabs<V extends string>({ tabs, value, onChange, ariaLabel, idPrefix }: SectionTabsProps<V>) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Tabs
      value={value}
      onChange={(_event, next: V) => {
        onChange(next);
      }}
      variant={phone ? (tabs.length <= 4 ? 'fullWidth' : 'scrollable') : 'standard'}
      scrollButtons={false}
      aria-label={ariaLabel}
      sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
    >
      {tabs.map((tab) => {
        const ids = sectionTabIds(idPrefix, tab.value);
        return (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            id={ids.tab}
            aria-controls={ids.panel}
            sx={{ minWidth: 0, minHeight: 48, px: { xs: 1, sm: 2 } }}
          />
        );
      })}
    </Tabs>
  );
}
