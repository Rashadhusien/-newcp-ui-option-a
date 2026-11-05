/**
 * useUrlTableControls: useTableControls with sort, page and page size kept
 * in the URL (?sort=&dir=&page=&size=), so a filtered, sorted page can be
 * bookmarked, shared and restored with Back.
 *
 * Selection, expansion and hidden columns stay in component state.
 * History entries are replaced, not pushed, so Back leaves the list.
 */

import { useSearchParams } from 'react-router-dom';
import { toggleSort, type SortDirection, type SortState } from '@/shared/lib/table';
import { useTableControls, type TableControls, type TableControlsOptions } from './useTableControls';

const SORT = 'sort';
const DIR = 'dir';
const PAGE = 'page';
const SIZE = 'size';

function parseDirection(value: string | null): SortDirection {
  return value === 'desc' ? 'desc' : 'asc';
}

function parsePositiveInt(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

export function useUrlTableControls(options: TableControlsOptions = {}): TableControls {
  const base = useTableControls(options);
  const [params, setParams] = useSearchParams();

  const sortColumn = params.get(SORT);
  const sort: SortState | null = sortColumn
    ? { column: sortColumn, direction: parseDirection(params.get(DIR)) }
    : (options.initialSort ?? null);
  const size = parsePositiveInt(params.get(SIZE));
  const pageSize = size != null && base.pageSizeOptions.includes(size) ? size : base.pageSize;
  const page = parsePositiveInt(params.get(PAGE)) ?? 1;

  const update = (change: (next: URLSearchParams) => void) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        change(next);
        return next;
      },
      { replace: true },
    );
  };

  return {
    ...base,
    sort,
    setSort: (column) => {
      const next = sort ? toggleSort(sort, column) : { column, direction: 'asc' as const };
      update((p) => {
        p.set(SORT, next.column);
        p.set(DIR, next.direction);
        p.delete(PAGE);
      });
    },
    page,
    setPage: (value) => {
      update((p) => {
        if (value <= 1) p.delete(PAGE);
        else p.set(PAGE, String(value));
      });
    },
    pageSize,
    setPageSize: (value) => {
      update((p) => {
        p.set(SIZE, String(value));
        p.delete(PAGE);
      });
    },
  };
}

/**
 * Sets several URL filters in ONE navigation (separate setSearchParams calls
 * in one event do not compose). Resets the page, because the result set
 * changed. An empty value removes the parameter.
 */
export function useUrlFiltersUpdater(): (changes: Record<string, string>) => void {
  const [, setParams] = useSearchParams();
  return (changes) => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, next]) => {
          if (next === '') updated.delete(key);
          else updated.set(key, next);
        });
        updated.delete(PAGE);
        return updated;
      },
      { replace: true },
    );
  };
}

/** One string filter kept in the URL ('' when absent). */
export function useUrlFilter(key: string): [string, (value: string) => void] {
  const [params] = useSearchParams();
  const update = useUrlFiltersUpdater();
  return [
    params.get(key) ?? '',
    (next) => {
      update({ [key]: next });
    },
  ];
}
