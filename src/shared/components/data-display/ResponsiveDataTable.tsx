/**
 * ResponsiveDataTable: the one business table (decision D4).
 *
 * Column priority drives layout; nothing ever scrolls horizontally:
 * - desktop (>= md): table of primary + visible secondary columns; tertiary
 *   and hidden columns open in an expandable details row
 * - tablet (sm..md): primary columns only; the rest in the details row
 * - mobile (< sm): cards (title, status, primary fields) with a details
 *   drawer holding every other field
 *
 * The table uses a fixed layout at 100% width with wrapping cells, so wide
 * content wraps instead of widening the page (Angular used min-width
 * 52-164rem + overflow-x: auto on every table).
 *
 * Sorting, paging, selection, expansion, and column visibility live in
 * `useTableControls`; the page owns search and filters.
 */

import { Fragment, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { clampPage, paginateRows, sortRows } from '@/shared/lib/table';
import type { TableControls } from '@/shared/hooks/useTableControls';
import { DetailList } from './DetailList';
import { TablePager } from './TablePager';
import { useColumnLayout } from './useColumnLayout';

export type ColumnPriority = 'primary' | 'secondary' | 'tertiary';

export interface DataColumn<T> {
  id: string;
  header: string;
  /** primary: always shown; secondary: desktop; tertiary: details only. */
  priority: ColumnPriority;
  render: (row: T) => React.ReactNode;
  /** Enables sorting by this column. */
  sortValue?: (row: T) => unknown;
  align?: 'left' | 'center' | 'right';
  /** Width hint for the desktop table (ignored on tablet, where only primary columns show). */
  width?: number | string;
  /** Card placement on mobile: the heading or the status slot. */
  role?: 'title' | 'status';
  /**
   * Secondary columns only: minimum width to appear in the table (else the
   * details row). Default 'lg' (1280): at 1024 the full sidebar leaves the
   * table ~716 px, so only columns that opt in with 'md' join the primaries.
   */
  showFrom?: 'md' | 'lg' | 'xl';
}

export interface EmptyContent {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ResponsiveDataTableProps<T> {
  rows: readonly T[];
  columns: readonly DataColumn<T>[];
  getRowId: (row: T) => string;
  controls: TableControls;
  ariaLabel: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: EmptyContent;
  /** Makes the title column a link and the row clickable. */
  getRowHref?: (row: T) => string;
  selectable?: boolean;
  renderActions?: (row: T) => React.ReactNode;
  actionsWidth?: number;
  /** Extra content in the details row / drawer (e.g. sub-orders). */
  renderExpanded?: (row: T) => React.ReactNode;
  /** Name for the details disclosure ("Show services"). */
  expandLabel?: (row: T) => string;
  paginate?: boolean;
  /** Rendered inside the table surface above the rows (toolbar). */
  toolbar?: React.ReactNode;
}

/**
 * Screen-reader-only text (header cells for control columns). Pixel units
 * are explicit: in sx, width: 1 means 100%.
 */
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

const SKELETON_ROWS = 5;
/** Expand column: the 44px touch-target icon button plus compact padding. */
const CONTROL_WIDTH = 52;
/** Selection column: small checkbox plus compact padding. */
const CHECKBOX_WIDTH = 48;

function isInteractiveTarget(target: EventTarget): boolean {
  return (
    target instanceof Element &&
    target.closest('a, button, input, label, [role="checkbox"]') != null
  );
}

export function ResponsiveDataTable<T>({
  rows,
  columns,
  getRowId,
  controls,
  ariaLabel,
  loading = false,
  error = null,
  onRetry,
  empty = { title: 'No records found', description: 'There is nothing to display yet.' },
  getRowHref,
  selectable = false,
  renderActions,
  actionsWidth = 112,
  renderExpanded,
  expandLabel,
  paginate = true,
  toolbar,
}: ResponsiveDataTableProps<T>) {
  const navigate = useNavigate();
  const { layout, tableColumns, detailColumns } = useColumnLayout(columns, controls);
  const [drawerRow, setDrawerRow] = useState<T | null>(null);

  const sortColumn = columns.find((column) => column.id === controls.sort?.column);
  const sorted =
    controls.sort && sortColumn?.sortValue
      ? sortRows(rows, sortColumn.sortValue, controls.sort.direction)
      : rows;
  const page = clampPage(controls.page, sorted.length, controls.pageSize);
  const pageRows = paginate ? paginateRows(sorted, page, controls.pageSize) : sorted;

  const expandable = detailColumns.length > 0 || renderExpanded != null;
  const titleColumn = columns.find((column) => column.role === 'title') ?? columns[0];
  const statusColumn = columns.find((column) => column.role === 'status');

  const pageIds = pageRows.map(getRowId);
  const selectedOnPage = pageIds.filter((id) => controls.selectedIds.has(id)).length;
  const toggleRow = (id: string) => {
    const next = new Set(controls.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    controls.setSelectedIds(next);
  };
  const togglePage = () => {
    const next = new Set(controls.selectedIds);
    const allSelected = selectedOnPage === pageIds.length;
    pageIds.forEach((id) => {
      if (allSelected) next.delete(id);
      else next.add(id);
    });
    controls.setSelectedIds(next);
  };

  const renderTitle = (row: T) => {
    const content = titleColumn.render(row);
    const href = getRowHref?.(row);
    return href ? (
      <Link component={RouterLink} to={href} underline="hover" sx={{ fontWeight: 600 }}>
        {content}
      </Link>
    ) : (
      content
    );
  };
  const renderCell = (column: DataColumn<T>, row: T) =>
    column === titleColumn ? renderTitle(row) : column.render(row);

  const details = (row: T) => (
    <Stack spacing={2}>
      {detailColumns.length > 0 && (
        <DetailList
          dense
          columns={4}
          items={detailColumns.map((column) => ({
            label: column.header,
            value: column.render(row),
          }))}
        />
      )}
      {renderExpanded?.(row)}
    </Stack>
  );

  const body = (() => {
    if (error) {
      return <ErrorState title="Could not load records" message={error} onRetry={onRetry} />;
    }
    if (!loading && rows.length === 0) {
      return (
        <EmptyState
          title={empty.title}
          description={empty.description}
          actionLabel={empty.actionLabel}
          onAction={empty.onAction}
        />
      );
    }
    if (layout === 'mobile') {
      return (
        <Stack spacing={1.5} sx={{ p: 1.5 }} aria-label={ariaLabel} role="list">
          {loading
            ? Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} variant="rounded" height={120} />
              ))
            : pageRows.map((row) => {
                const id = getRowId(row);
                const cardFields = columns.filter(
                  (column) =>
                    column.priority === 'primary' &&
                    column !== titleColumn &&
                    column !== statusColumn
                );
                return (
                  <Paper key={id} variant="outlined" role="listitem" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 1.5 }}>
                      {selectable && (
                        <Checkbox
                          size="small"
                          checked={controls.selectedIds.has(id)}
                          onChange={() => {
                            toggleRow(id);
                          }}
                          slotProps={{ input: { 'aria-label': 'Select row' } }}
                          sx={{ m: -1 }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0, typography: 'body2' }}>
                        {renderTitle(row)}
                      </Box>
                      {statusColumn && statusColumn !== titleColumn && statusColumn.render(row)}
                    </Stack>
                    {cardFields.length > 0 && (
                      <DetailList
                        dense
                        columns={2}
                        items={cardFields.map((column) => ({
                          label: column.header,
                          value: column.render(row),
                        }))}
                      />
                    )}
                    {(expandable || renderActions) && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}
                      >
                        {expandable && (
                          <Button
                            size="small"
                            onClick={() => {
                              setDrawerRow(row);
                            }}
                          >
                            Details
                          </Button>
                        )}
                        {renderActions?.(row)}
                      </Stack>
                    )}
                  </Paper>
                );
              })}
        </Stack>
      );
    }

    const columnCount =
      tableColumns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0) + (renderActions ? 1 : 0);
    return (
      <Table size="small" aria-label={ariaLabel} sx={{ tableLayout: 'fixed', width: '100%' }}>
        {/* Fixed layout honors <col> widths first: exact control columns,
            percentage hints for data columns, the rest share what is left. */}
        <colgroup>
          {expandable && <col style={{ width: CONTROL_WIDTH }} />}
          {selectable && <col style={{ width: CHECKBOX_WIDTH }} />}
          {tableColumns.map((column) => (
            <col
              key={column.id}
              style={{ width: layout === 'desktop' ? column.width : undefined }}
            />
          ))}
          {renderActions && <col style={{ width: actionsWidth }} />}
        </colgroup>
        <TableHead>
          <TableRow>
            {expandable && (
              <TableCell sx={{ px: 0.5 }}>
                <Box component="span" sx={visuallyHidden}>
                  Details
                </Box>
              </TableCell>
            )}
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={pageIds.length > 0 && selectedOnPage === pageIds.length}
                  indeterminate={selectedOnPage > 0 && selectedOnPage < pageIds.length}
                  onChange={togglePage}
                  disabled={loading || pageIds.length === 0}
                  slotProps={{ input: { 'aria-label': 'Select all rows on this page' } }}
                />
              </TableCell>
            )}
            {tableColumns.map((column) => {
              const active = controls.sort?.column === column.id;
              return (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  sortDirection={active ? controls.sort?.direction : false}
                >
                  {column.sortValue ? (
                    <TableSortLabel
                      active={active}
                      direction={active ? controls.sort?.direction : 'asc'}
                      onClick={() => {
                        controls.setSort(column.id);
                      }}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              );
            })}
            {renderActions && (
              <TableCell align="right">
                <Box component="span" sx={visuallyHidden}>
                  Actions
                </Box>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columnCount}>
                    <Skeleton variant="text" height={28} />
                  </TableCell>
                </TableRow>
              ))
            : pageRows.map((row) => {
                const id = getRowId(row);
                const expanded = controls.expandedIds.has(id);
                const href = getRowHref?.(row);
                return (
                  <Fragment key={id}>
                    <TableRow
                      hover
                      selected={controls.selectedIds.has(id)}
                      onClick={(event) => {
                        if (href && !isInteractiveTarget(event.target)) void navigate(href);
                      }}
                      sx={{
                        cursor: href ? 'pointer' : undefined,
                        '& > td': expanded ? { borderBottom: 0 } : undefined,
                      }}
                    >
                      {expandable && (
                        <TableCell sx={{ py: 0, px: 0.5 }}>
                          <IconButton
                            size="small"
                            aria-expanded={expanded}
                            aria-label={
                              expandLabel?.(row) ?? (expanded ? 'Hide details' : 'Show details')
                            }
                            onClick={() => {
                              controls.toggleExpanded(id);
                            }}
                          >
                            {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                          </IconButton>
                        </TableCell>
                      )}
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={controls.selectedIds.has(id)}
                            onChange={() => {
                              toggleRow(id);
                            }}
                            slotProps={{ input: { 'aria-label': 'Select row' } }}
                          />
                        </TableCell>
                      )}
                      {tableColumns.map((column) => (
                        <TableCell
                          key={column.id}
                          align={column.align}
                          sx={{ overflowWrap: 'break-word' }}
                        >
                          {renderCell(column, row)}
                        </TableCell>
                      ))}
                      {renderActions && (
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          {renderActions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                    {expandable && expanded && (
                      <TableRow>
                        <TableCell colSpan={columnCount} sx={{ bgcolor: 'action.hover', py: 2 }}>
                          <Collapse in appear>
                            {details(row)}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
        </TableBody>
      </Table>
    );
  })();

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {toolbar}
      {body}
      {paginate && !error && sorted.length > 0 && (
        <TablePager
          total={sorted.length}
          page={page}
          pageSize={controls.pageSize}
          pageSizeOptions={controls.pageSizeOptions}
          onPageChange={controls.setPage}
          onPageSizeChange={controls.setPageSize}
        />
      )}
      <Drawer
        anchor="bottom"
        open={drawerRow != null}
        onClose={() => {
          setDrawerRow(null);
        }}
        slotProps={{
          paper: { sx: { maxHeight: '85vh', borderTopLeftRadius: 12, borderTopRightRadius: 12 } },
        }}
      >
        {drawerRow != null && (
          <Box sx={{ p: 2.5 }} role="dialog" aria-label="Record details">
            <Stack direction="row" sx={{ alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography variant="h3" component="h2" sx={{ flex: 1 }}>
                {titleColumn.render(drawerRow)}
              </Typography>
              {statusColumn?.render(drawerRow)}
            </Stack>
            {details(drawerRow)}
            <Stack direction="row" spacing={1} sx={{ mt: 2.5, justifyContent: 'flex-end' }}>
              {renderActions?.(drawerRow)}
              <Button
                variant="outlined"
                onClick={() => {
                  setDrawerRow(null);
                }}
              >
                Close
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>
    </Paper>
  );
}
