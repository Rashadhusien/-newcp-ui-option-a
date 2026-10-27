/**
 * Status counts shared by the Report summary cards and the Dashboard (A28),
 * so both pages count the same way. Pure: rows with an API `status` in,
 * numbers out. Every row is one service instance. Groups follow the
 * presentation tone from `presentStatus` (never a hard-coded status list):
 * - done: success tone (completed, shipped, delivered);
 * - closed: error tone (cancelled, not indicated);
 * - open: everything else, including unknown values.
 */

import { presentStatus, type StatusSemantic } from './status';

export interface HasStatus {
  status: string;
}

export function countBySemantic(rows: readonly HasStatus[], semantic: StatusSemantic): number {
  return rows.filter((row) => presentStatus(row.status).semantic === semantic).length;
}

export function countStatus(rows: readonly HasStatus[], status: string): number {
  return rows.filter((row) => row.status === status).length;
}

/** Not done and not closed. */
export function countOpen(rows: readonly HasStatus[]): number {
  return rows.filter((row) => {
    const { semantic } = presentStatus(row.status);
    return semantic !== 'success' && semantic !== 'error';
  }).length;
}

export interface StatusCount {
  status: string;
  count: number;
}

/** One entry per status present in the data, most frequent first. */
export function statusCounts(rows: readonly HasStatus[]): StatusCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}
