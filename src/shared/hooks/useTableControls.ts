/**
 * useTableControls: view state for one ResponsiveDataTable.
 *
 * Holds sort, page, page size, selection, expanded rows, and hidden columns.
 * `resetKey` should change whenever the filtered result set changes (search
 * text, filters); the page then returns to 1, matching every Angular list
 * (`page.set(1)` on search/filter).
 */

import { useState } from 'react';
import { toggleSort, type SortState } from '@/shared/lib/table';

export interface TableControlsOptions {
  initialSort?: SortState | null;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  resetKey?: string;
  /** Secondary columns hidden until the user shows them (Columns menu). */
  initialHiddenColumns?: readonly string[];
}

export interface TableControls {
  sort: SortState | null;
  setSort: (column: string) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  setPageSize: (size: number) => void;
  selectedIds: ReadonlySet<string>;
  setSelectedIds: (ids: ReadonlySet<string>) => void;
  clearSelection: () => void;
  expandedIds: ReadonlySet<string>;
  toggleExpanded: (id: string) => void;
  hiddenColumns: ReadonlySet<string>;
  toggleColumn: (id: string) => void;
}

const EMPTY: ReadonlySet<string> = new Set();

function toggled(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function useTableControls({
  initialSort = null,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  resetKey = '',
  initialHiddenColumns = [],
}: TableControlsOptions = {}): TableControls {
  const [sort, setSortState] = useState<SortState | null>(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(EMPTY);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(EMPTY);
  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<string>>(
    () => new Set(initialHiddenColumns)
  );
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  // Derived-state reset during render (React-recommended over an effect).
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  return {
    sort,
    setSort: (column) => {
      setSortState((current) =>
        current ? toggleSort(current, column) : { column, direction: 'asc' }
      );
      setPage(1);
    },
    page,
    setPage,
    pageSize,
    pageSizeOptions,
    setPageSize: (size) => {
      setPageSizeState(size);
      setPage(1);
    },
    selectedIds,
    setSelectedIds,
    clearSelection: () => {
      setSelectedIds(EMPTY);
    },
    expandedIds,
    toggleExpanded: (id) => {
      setExpandedIds((current) => toggled(current, id));
    },
    hiddenColumns,
    toggleColumn: (id) => {
      setHiddenColumns((current) => toggled(current, id));
    },
  };
}
