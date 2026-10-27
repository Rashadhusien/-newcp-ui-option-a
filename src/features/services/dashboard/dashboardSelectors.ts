/**
 * Dashboard figures (A28), computed in the frontend because the contract
 * has no dashboard endpoint. Pure functions over contract-shaped data
 * (`DashboardData`), so a real endpoint can replace the source without
 * touching the page. Status counts use the same functions as the Report
 * summary cards (`shared/status/statusFigures`).
 *
 * Only figures the data can support: a price override cannot be told apart
 * from the contract price (the item has `unitPrice` but no contract or list
 * price, Q-B30), so that figure is `null` and the page says why. Hold type
 * and reason are not returned on the item (Q-B18).
 */

import type { CatalogService, ServiceItem } from '@/shared/api';
import {
  countBySemantic,
  countOpen,
  countStatus,
  statusCounts,
  type HasStatus,
  type StatusCount,
} from '@/shared/status/statusFigures';
import type { ActivityEvent } from '../data/dashboardData';

export interface DashboardKpis {
  total: number;
  open: number;
  onHold: number;
  completed: number;
  /** null: not derivable from the fields the API returns (Q-B30). */
  priceOverride: number | null;
  zeroChargeReason: number;
}

/** Any rows with a status (service items, report rows); the zero-charge count needs the item field. */
export type KpiRow = HasStatus & { zeroChargeReasonCode?: string | null };

export function dashboardKpis(services: readonly KpiRow[]): DashboardKpis {
  return {
    total: services.length,
    open: countOpen(services),
    onHold: countStatus(services, 'on_hold'),
    completed: countBySemantic(services, 'success'),
    priceOverride: null,
    zeroChargeReason: services.filter((item) => (item.zeroChargeReasonCode ?? '') !== '').length,
  };
}

export function dashboardStatusRows(services: readonly HasStatus[]): StatusCount[] {
  return statusCounts(services);
}

export function shortId(uuid: string | undefined): string {
  return uuid ? `…${uuid.slice(-8)}` : '-';
}

function serviceName(catalog: readonly CatalogService[], item: ServiceItem | undefined): string {
  return catalog.find((entry) => entry.uuid === item?.sellableItemUuid)?.name ?? 'Service';
}

export interface AttentionRow {
  uuid: string;
  serviceName: string;
  orderShortId: string;
  lineNumber: number | undefined;
}

/** Services on hold now, by order then line. */
export function needsAttention(services: readonly ServiceItem[], catalog: readonly CatalogService[]): AttentionRow[] {
  return services
    .filter((item) => item.status === 'on_hold')
    .sort((a, b) => a.orderUuid.localeCompare(b.orderUuid) || (a.lineNumber ?? 0) - (b.lineNumber ?? 0))
    .map((item) => ({
      uuid: item.uuid,
      serviceName: serviceName(catalog, item),
      orderShortId: shortId(item.orderUuid),
      lineNumber: item.lineNumber,
    }));
}

export interface ActivityRow {
  key: string;
  serviceItemUuid: string;
  serviceName: string;
  lineNumber: number | undefined;
  orderShortId: string;
  fromCode: string | undefined;
  toCode: string | undefined;
  occurredAt: string | undefined;
  /** Short id only: actor names are not in the contract (Q-B6). */
  actorShortId: string;
}

/** Latest status changes first; events without a time go last. */
export function recentActivity(
  activity: readonly ActivityEvent[],
  services: readonly ServiceItem[],
  catalog: readonly CatalogService[],
  limit = 8,
): ActivityRow[] {
  return [...activity]
    .sort((a, b) => (b.occurredAt ?? '').localeCompare(a.occurredAt ?? ''))
    .slice(0, limit)
    .map((event, index) => {
      const item = services.find((entry) => entry.uuid === event.serviceItemUuid);
      return {
        key: `${event.serviceItemUuid}-${event.occurredAt ?? ''}-${String(index)}`,
        serviceItemUuid: event.serviceItemUuid,
        serviceName: serviceName(catalog, item),
        lineNumber: item?.lineNumber,
        orderShortId: shortId(item?.orderUuid),
        fromCode: event.fromCode,
        toCode: event.toCode,
        occurredAt: event.occurredAt,
        actorShortId: shortId(event.actorUserUuid),
      };
    });
}
