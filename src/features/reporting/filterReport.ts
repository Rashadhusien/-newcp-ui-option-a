/**
 * Report filtering and per-status counts (pure functions).
 *
 * Every row is one service instance, so every count here is an instance
 * count, never an order count. Statuses are taken from the data, never from
 * a hard-coded list (D-23).
 */

import { filterRows } from '@/shared/lib/table';
import { presentStatus } from '@/shared/status/status';
import type { ReportRow, ServiceType } from './types';

export const SERVICE_TYPES: readonly ServiceType[] = ['models', 'conversion'];

export interface ReportFilters {
  search: string;
  /** '' = all service types. */
  serviceType: ServiceType | '';
  /** '' = all statuses. */
  status: string;
}

const SEARCH_FIELDS: readonly ((row: ReportRow) => unknown)[] = [
  (row) => row.orderNumber,
  (row) => row.serviceId,
  (row) => row.client,
  (row) => row.patientCode,
  (row) => row.option,
];

export function isServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}

function byLabel(a: string, b: string): number {
  return presentStatus(a).label.localeCompare(presentStatus(b).label);
}

/** Statuses present in the data for the chosen type (or all types), by label. */
export function statusOptions(rows: readonly ReportRow[], serviceType: ServiceType | ''): string[] {
  const values = new Set(
    rows.filter((row) => serviceType === '' || row.serviceType === serviceType).map((row) => row.status),
  );
  return [...values].sort(byLabel);
}

/** Search and service type only: the base the status counts are taken from. */
export function filterBySearchAndType(
  rows: readonly ReportRow[],
  filters: Pick<ReportFilters, 'search' | 'serviceType'>,
): ReportRow[] {
  return filterRows(rows, filters.search, SEARCH_FIELDS).filter(
    (row) => filters.serviceType === '' || row.serviceType === filters.serviceType,
  );
}

export function filterReport(rows: readonly ReportRow[], filters: ReportFilters): ReportRow[] {
  return filterBySearchAndType(rows, filters).filter(
    (row) => filters.status === '' || row.status === filters.status,
  );
}

export interface StatusCountKey {
  service: ServiceType;
  status: string;
}

export interface StatusCount {
  key: StatusCountKey;
  count: number;
}

/**
 * One entry per (service type, status) pair found in `allRows` for the shown
 * type(s), counted over `matchingRows`; zeros stay, so chips don't jump while
 * searching.
 */
export function countByStatus(
  allRows: readonly ReportRow[],
  matchingRows: readonly ReportRow[],
  serviceType: ServiceType | '',
): StatusCount[] {
  const types = serviceType === '' ? SERVICE_TYPES : [serviceType];
  return types.flatMap((service) =>
    statusOptions(allRows, service).map((status) => ({
      key: { service, status },
      count: matchingRows.filter((row) => row.serviceType === service && row.status === status).length,
    })),
  );
}
