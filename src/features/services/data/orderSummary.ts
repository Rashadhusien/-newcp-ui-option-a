/**
 * Order-level list row (A19): one order with all its service instances.
 * PROPOSED shape (Q-B26): Bishoy's `GET /orders` is not in the reference
 * contract yet. The header fields come from the synthetic order fixtures and
 * are display-only (D-61); `services` are contract-shaped service items.
 */

import type { ServiceItem } from '@/shared/api';
import type { MockOrderHeader } from '@/mocks/orderFixtures';

export interface OrderSummary extends MockOrderHeader {
  services: ServiceItem[];
}
