/**
 * Report filtering and per-status counts (pure functions).
 *
 * Every row is one service instance, so every count here is an instance
 * count, never an order count.
 */

import { filterRows } from '@/shared/lib/table';
import {
  ALL_SERVICE_STATUSES,
  STATUS_ORDER,
  type ServiceStatus,
  type ServiceType,
  type StatusValue,
} from '@/shared/status/status';
import type { ReportRow } from './types';

export const SERVICE_TYPES: readonly ServiceType[] = ['models', 'conversion'];

export interface ReportFilters {
  search: string;
  /** '' = all service types. */
  serviceType: ServiceType | '';
  /** '' = all statuses. A label shared by both types (In Progress) matches both. */
  status: StatusValue | '';
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

/** Statuses offered by the status filter for the chosen type (or all types). */
export function statusOptions(serviceType: ServiceType | ''): StatusValue[] {
  const types = serviceType === '' ? SERVICE_TYPES : [serviceType];
  const labels: StatusValue[] = [];
  types.forEach((type) => {
    STATUS_ORDER[type].forEach((status) => {
      if (!labels.includes(status)) labels.push(status);
    });
  });
  return labels;
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

export interface StatusCount {
  key: ServiceStatus;
  count: number;
}

/** One entry per status of each shown service type, in PLAN order, zeros included. */
export function countByStatus(
  rows: readonly ReportRow[],
  serviceType: ServiceType | '',
): StatusCount[] {
  return ALL_SERVICE_STATUSES.filter(
    (key) => serviceType === '' || key.service === serviceType,
  ).map((key) => ({
    key,
    count: rows.filter((row) => row.serviceType === key.service && row.status === key.status)
      .length,
  }));
}
