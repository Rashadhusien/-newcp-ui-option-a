/**
 * DetailList: label / value pairs in a responsive grid (description list).
 *
 * Used for table row details, the mobile details drawer, and record
 * summaries on detail pages. Values wrap; nothing scrolls horizontally.
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  /** Span the full row (long text such as notes). */
  wide?: boolean;
}

interface DetailListProps {
  items: readonly DetailItem[];
  /** Maximum columns at the widest breakpoint. */
  columns?: 1 | 2 | 3 | 4;
  dense?: boolean;
}

const EMPTY = '—';

function isEmpty(value: React.ReactNode): boolean {
  return value == null || value === '' || value === false;
}

export function DetailList({ items, columns = 3, dense = false }: DetailListProps) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: 'grid',
        gap: dense ? 1.5 : 2,
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: `repeat(${String(Math.min(columns, 3))}, minmax(0, 1fr))`,
          lg: `repeat(${String(columns)}, minmax(0, 1fr))`,
        },
      }}
    >
      {items.map((item) => (
        <Box key={item.label} sx={{ minWidth: 0, gridColumn: item.wide ? '1 / -1' : undefined }}>
          <Typography component="dt" variant="caption" color="text.secondary">
            {item.label}
          </Typography>
          <Typography
            component="dd"
            variant="body2"
            sx={{ m: 0, mt: 0.25, overflowWrap: 'break-word' }}
          >
            {isEmpty(item.value) ? EMPTY : item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
