/**
 * Table rules shared by every list: search, typed sort, pagination, CSV.
 *
 * Source: Angular `shared/utils/table-state.ts` and
 * `orders.component.ts#compareOrderValues`.
 *
 * Fix (D2): Angular's generic `sortTableRows` compared values with
 * `String(a).localeCompare(String(b))`, so numbers sorted as text
 * ("1000" < "250") on billing amounts and order counts. `compareValues`
 * compares numbers numerically and ISO dates chronologically everywhere.
 */

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string = string> {
  column: K;
  direction: SortDirection;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Text for primitives; objects and arrays are not sortable or exportable. */
function toText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : '';
}

/** Case-insensitive "contains" search across the given fields. */
export function filterRows<T>(
  rows: readonly T[],
  query: string,
  fields: readonly ((row: T) => unknown)[]
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...rows];
  return rows.filter((row) =>
    fields.some((field) => {
      const value = field(row);
      return (
        (typeof value === 'string' || typeof value === 'number') &&
        String(value).toLowerCase().includes(normalized)
      );
    })
  );
}

/** Nulls first; numbers numeric; ISO dates chronological; text locale-aware. */
export function compareValues(a: unknown, b: unknown): number {
  const aMissing = a == null || a === '';
  const bMissing = b == null || b === '';
  if (aMissing && bMissing) return 0;
  if (aMissing) return -1;
  if (bMissing) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  const aText = toText(a);
  const bText = toText(b);
  if (ISO_DATE.test(aText) && ISO_DATE.test(bText)) {
    return Date.parse(aText) - Date.parse(bText);
  }
  return aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortRows<T>(
  rows: readonly T[],
  accessor: (row: T) => unknown,
  direction: SortDirection
): T[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => compareValues(accessor(left), accessor(right)) * factor);
}

/** Next sort state when a header is clicked (Angular toggleSort). */
export function toggleSort<K extends string>(current: SortState<K>, column: K): SortState<K> {
  if (current.column === column) {
    return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { column, direction: 'asc' };
}

/** 1-based page slice. */
export function paginateRows<T>(rows: readonly T[], page: number, pageSize: number): T[] {
  const start = Math.max(0, page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

/** At least one page, so "Page 1 of 1" shows on empty results. */
export function totalPages(rowCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(rowCount / pageSize));
}

export function clampPage(page: number, rowCount: number, pageSize: number): number {
  return Math.min(Math.max(1, page), totalPages(rowCount, pageSize));
}

/** Unique, trimmed, sorted option values (Angular `uniqueSorted`). */
export function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function escapeCsv(value: unknown): string {
  const text = toText(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [header.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
}
