/**
 * TeethChart (A21, ported from the earlier POC's TeethChart): interactive
 * dental arch chart (FDI numbering) built on `react-odontogram` (approved,
 * G17), themed from the MUI palette in light and dark mode.
 *
 * The library is uncontrolled (`defaultSelected` only), so the chart is
 * remounted when `selected` changes from outside (e.g. switching the "Apply
 * teeth to" target). It calls onChange inside a state updater (run twice in
 * StrictMode), so the full selection is reported, deferred to a microtask.
 * Read-only when `onChange` is absent.
 *
 * The viewer picks the layout (arch or rows); the choice is remembered in
 * this browser (convenience only). Phones always get the arch: rows shrink
 * each tooth below a usable touch target at that width.
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import { Odontogram, type ToothDetail } from 'react-odontogram';
import 'react-odontogram/style.css';

export interface TeethChartProps {
  selected: readonly number[];
  /** Receives the full selection, sorted. */
  onChange?: (teeth: number[]) => void;
  /** Accessible name for the chart, e.g. "Teeth for Biomodel, instance 1". */
  label: string;
}

type ChartLayout = 'circle' | 'square';

const LAYOUT_KEY = 'newcp-teeth-chart-layout';
/** Arch is tall (409 x 694), rows are wide (900 x 150): max widths in px. */
const ARCH_MAX_WIDTH = 300;
const ROWS_MAX_WIDTH = 900;

function readLayout(): ChartLayout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'square' ? 'square' : 'circle';
  } catch {
    return 'circle';
  }
}

function writeLayout(value: ChartLayout): void {
  try {
    localStorage.setItem(LAYOUT_KEY, value);
  } catch {
    // The preference is simply not remembered.
  }
}

const toothId = (tooth: number) => `teeth-${String(tooth)}`;
const sortedKey = (teeth: readonly number[]) => [...teeth].sort((a, b) => a - b).join(',');

export function TeethChart({ selected, onChange, label }: TeethChartProps) {
  const readOnly = onChange == null;
  const selectedKey = sortedKey(selected);
  // Last selection the chart itself reported, and a remount counter for
  // selections that arrive from outside (derived state, adjusted in render).
  const [reported, setReported] = useState(selectedKey);
  const [version, setVersion] = useState(0);
  const [preferred, setPreferred] = useState(readLayout);
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const layout: ChartLayout = isPhone ? 'circle' : preferred;
  if (selectedKey !== reported) {
    setReported(selectedKey);
    setVersion(version + 1);
  }

  const handleChange = (teeth: ToothDetail[]) => {
    const next = teeth.map((tooth) => Number(tooth.notations.fdi)).sort((a, b) => a - b);
    queueMicrotask(() => {
      setReported(next.join(','));
      onChange?.(next);
    });
  };

  return (
    <Box role="group" aria-label={label}>
      {!isPhone && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={layout}
            aria-label="Chart layout"
            onChange={(_event, value: ChartLayout | null) => {
              if (value) {
                setPreferred(value);
                writeLayout(value);
              }
            }}
          >
            <ToggleButton value="circle">Arch</ToggleButton>
            <ToggleButton value="square">Rows</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      <Box
        sx={(theme) => {
          // CSS variable references, so both colour schemes resolve at runtime.
          const { palette } = theme.vars ?? theme;
          return {
            maxWidth: layout === 'circle' ? ARCH_MAX_WIDTH : ROWS_MAX_WIDTH,
            mx: 'auto',
            '& .Odontogram svg': {
              '--base-blue': palette.text.disabled,
              '--light-blue': palette.primary.light,
              '--dark-blue': palette.primary.dark,
              backgroundColor: 'transparent',
              ...theme.applyStyles('dark', {
                '--light-blue': palette.primary.dark,
                '--dark-blue': palette.primary.light,
              }),
            },
            '& .Odontogram': {
              '--odontogram-tooltip-bg': palette.grey[800],
              '--odontogram-tooltip-fg': palette.common.white,
            },
            // Selected teeth: solid primary, distinct from the hover tint.
            '& .Odontogram g.selected path:first-of-type': { stroke: palette.primary.main },
            '& .Odontogram g.selected path:nth-of-type(2)': { fill: palette.primary.main },
            '& .odontogram-tooltip': { fontFamily: theme.typography.fontFamily },
            '& .Odontogram g[role=option]:focus-visible': { outlineColor: palette.primary.main },
          };
        }}
      >
        <Odontogram
          key={`${layout}-${String(version)}`}
          defaultSelected={selected.map(toothId)}
          onChange={handleChange}
          readOnly={readOnly}
          layout={layout}
          notation="FDI"
          tooltip={{
            placement: 'top',
            content: (tooth) => (tooth ? `Tooth ${tooth.notations.fdi} · ${tooth.type}` : null),
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {selected.length === 0 ? 'No teeth selected' : `Selected: ${selectedKey.split(',').join(', ')}`}
      </Typography>
    </Box>
  );
}
