/**
 * TablePager: result range, rows-per-page, and page buttons.
 *
 * Replaces Angular's enterprise-paginator. Rows-per-page hides on phones;
 * page buttons collapse to the current page with neighbours.
 */

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { totalPages } from '@/shared/lib/table';

interface TablePagerProps {
  total: number;
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePager({
  total,
  page,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: TablePagerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const pages = totalPages(total, pageSize);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary" aria-live="polite">
        {`${String(first)}–${String(last)} of ${String(total)}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {!isMobile && pageSizeOptions.length > 1 && (
          <TextField
            select
            size="small"
            label="Rows per page"
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
            }}
            sx={{ width: 128 }}
          >
            {pageSizeOptions.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </TextField>
        )}
        {pages > 1 && (
          <Pagination
            count={pages}
            page={page}
            onChange={(_, next) => {
              onPageChange(next);
            }}
            shape="rounded"
            size="small"
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={1}
            aria-label="Table pages"
          />
        )}
      </Box>
    </Box>
  );
}
