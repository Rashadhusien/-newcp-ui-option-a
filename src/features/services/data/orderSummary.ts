/**
 * Order-level list row (A19): one order with all its service instances.
 * PROPOSED shape (Q-B26): Bishoy's `GET /orders` is not in the reference
 * contract yet. The header fields come from the synthetic order fixtures and
 * are display-only (D-61); `services` are contract-shaped service items.
 */

import type { FormAnswer, ServiceItem } from '@/shared/api';
import type { MockOrderHeader } from '@/mocks/orderFixtures';

export interface OrderSummary extends MockOrderHeader {
  services: ServiceItem[];
}

/**
 * Create-order request from the A21 wizard. PROPOSED and mock only: the
 * reference contract creates services on an EXISTING order only; the
 * create-order endpoint and its new database fields are Q-B24, patient
 * fields Q-B25. Answers per service are contract-shaped (reference
 * carriers); teeth are FDI numbers.
 */
export interface CreateOrderRequest {
  clientName: string;
  patientCode: string;
  /** ISO date (yyyy-mm-dd). */
  dueOn: string;
  services: { sellableItemUuid: string; answers: FormAnswer[]; teeth: number[] }[];
}

export interface CreateOrderResult {
  orderUuid: string;
  orderNumber: string;
}
