/**
 * Which columns render in the table vs the details row at the current
 * width. Shared by ResponsiveDataTable and ColumnVisibilityMenu.
 *
 * - mobile (< sm): cards (table columns unused)
 * - tablet (sm..md): primary columns only
 * - desktop (>= md): primary + secondary columns whose `showFrom`
 *   breakpoint is reached (default lg; 'md' opts in at 1024) and that the
 *   user has not hidden
 */

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { TableControls } from '@/shared/hooks/useTableControls';
import type { DataColumn } from './ResponsiveDataTable';

export type TableLayout = 'desktop' | 'tablet' | 'mobile';

export interface ColumnLayout<T> {
  layout: TableLayout;
  tableColumns: DataColumn<T>[];
  detailColumns: DataColumn<T>[];
  /** Secondary columns the user can toggle at this width. */
  toggleableColumns: DataColumn<T>[];
}

export function useColumnLayout<T>(
  columns: readonly DataColumn<T>[],
  controls: TableControls
): ColumnLayout<T> {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const isLg = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const isXl = useMediaQuery(theme.breakpoints.up('xl'), { noSsr: true });
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const layout: TableLayout = isDesktop ? 'desktop' : isMobile ? 'mobile' : 'tablet';

  const widthAllows = (column: DataColumn<T>) =>
    column.showFrom === 'xl' ? isXl : column.showFrom === 'md' ? true : isLg;
  const toggleableColumns =
    layout === 'desktop'
      ? columns.filter((column) => column.priority === 'secondary' && widthAllows(column))
      : [];
  const tableColumns = columns.filter((column) =>
    column.priority === 'primary'
      ? true
      : layout === 'desktop' &&
        toggleableColumns.includes(column) &&
        !controls.hiddenColumns.has(column.id)
  );
  return {
    layout,
    tableColumns,
    detailColumns: columns.filter((column) => !tableColumns.includes(column)),
    toggleableColumns,
  };
}
