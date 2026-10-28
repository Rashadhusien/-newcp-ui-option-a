/**
 * Status counts for the Report summary cards (added in A28; the Dashboard
 * that shared them was removed in A32). Pure: rows with an API `status` in,
 * numbers out. Every row is one service instance. Groups follow the
 * presentation tone from `presentStatus` (never a hard-coded status list).
 */

import { presentStatus, type StatusSemantic } from './status';

export interface HasStatus {
  status: string;
}

export function countBySemantic(rows: readonly HasStatus[], semantic: StatusSemantic): number {
  return rows.filter((row) => presentStatus(row.status).semantic === semantic).length;
}
