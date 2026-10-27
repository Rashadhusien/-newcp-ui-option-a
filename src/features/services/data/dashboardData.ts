/**
 * What the Dashboard (A28) reads: every service instance the user's tenant
 * has, the catalog (for service names) and each instance's history events.
 * Contract types only, so a real dashboard or report endpoint (none exists,
 * G3) can fill the same shape later.
 */

import type { CatalogService, HistoryEvent, ServiceItem } from '@/shared/api';

export interface ActivityEvent extends HistoryEvent {
  serviceItemUuid: string;
}

export interface DashboardData {
  services: ServiceItem[];
  catalog: CatalogService[];
  activity: ActivityEvent[];
}
