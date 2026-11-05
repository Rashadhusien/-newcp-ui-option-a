/**
 * TableToolbar: the header of every business list.
 *
 * Title + result count, search, filter controls, active filter chips with
 * "Clear all", page actions, and a selection bar for bulk actions
 * (Angular data-table-toolbar + search-filter-toolbar + orders bulk bar).
 * Wraps on narrow screens instead of scrolling.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';

export interface FilterChip {
  key: string;
  label: string;
  onDelete: () => void;
}

interface TableToolbarProps {
  title?: string;
  /** e.g. "64 orders". */
  count?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Selects / toggles shown next to the search. */
  filters?: React.ReactNode;
  chips?: readonly FilterChip[];
  onClearAll?: () => void;
  /** Right-aligned actions (export, refresh, columns). */
  actions?: React.ReactNode;
  selectedCount?: number;
  /** Bulk actions shown while rows are selected. */
  selectionActions?: React.ReactNode;
  onClearSelection?: () => void;
}

export function TableToolbar({
  title,
  count,
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  filters,
  chips = [],
  onClearAll,
  actions,
  selectedCount = 0,
  selectionActions,
  onClearSelection,
}: TableToolbarProps) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      {(title != null || actions != null) && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
            px: 2,
            pt: 2,
          }}
        >
          {title != null && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" component="h2">
                {title}
              </Typography>
              {count != null && (
                <Typography variant="caption" color="text.secondary" aria-live="polite">
                  {count}
                </Typography>
              )}
            </Box>
          )}
          {actions != null && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: 'auto' }}>
              {actions}
            </Stack>
          )}
        </Stack>
      )}
      {(onSearchChange != null || filters != null) && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            px: 2,
            py: 2,
            '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } },
            // Filter selects (full-width form controls) keep a fixed width beside
            // the search from sm up.
            '& > .MuiFormControl-root': { width: { sm: 200 } },
          }}
        >
          {onSearchChange != null && (
            <TextField
              size="small"
              value={search ?? ''}
              onChange={(event) => {
                onSearchChange(event.target.value);
              }}
              placeholder={searchPlaceholder}
              sx={{ flexGrow: { sm: 1 }, maxWidth: { sm: 420 } }}
              slotProps={{
                htmlInput: { 'aria-label': searchPlaceholder },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" aria-hidden="true" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
          {filters}
        </Box>
      )}
      {chips.length > 0 && (
        <Stack
          direction="row"
          sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', px: 2, pb: 2 }}
          aria-label="Active filters"
        >
          {chips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              size="small"
              onDelete={chip.onDelete}
              variant="outlined"
            />
          ))}
          {onClearAll != null && (
            <Button size="small" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </Stack>
      )}
      {selectedCount > 0 && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            px: 2,
            py: 1,
            bgcolor: 'action.selected',
          }}
          role="region"
          aria-label="Selection actions"
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mr: 'auto' }}>
            {selectedCount} selected
          </Typography>
          {selectionActions}
          {onClearSelection != null && (
            <Button size="small" onClick={onClearSelection}>
              Clear selection
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
