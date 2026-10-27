/**
 * SYNTHETIC order headers for the orders list (A19). Invented values only:
 * no real client, clinic or patient. The order-level list endpoint
 * (Bishoy's `GET /orders`) is not in the reference contract yet (Q-B3,
 * Q-B26), so this header shape is PROPOSED and `[NEEDS VERIFICATION]`:
 * order number, client and patient code are display fields the contract
 * does not have (D-61). The services of each order are the mock's real
 * service items (serviceFixtures), so every line opens a working page.
 */

import { MOCK_ORDER_UUID } from './serviceFixtures';

export interface MockOrderHeader {
  orderUuid: string;
  orderNumber: string;
  clientName: string;
  patientCode: string;
  /** ISO date (yyyy-mm-dd). */
  receivedOn: string;
  /** ISO date (yyyy-mm-dd). */
  dueOn: string;
  /** A21: teeth (FDI) per service instance uuid, from the create-order wizard; mock only (Q-B24). */
  teethByService?: Readonly<Record<string, readonly number[]>>;
}

export const MOCK_ORDER_2_UUID = '00000000-0000-0000-0000-0000000000c2';
export const MOCK_ORDER_3_UUID = '00000000-0000-0000-0000-0000000000c3';
export const MOCK_ORDER_4_UUID = '00000000-0000-0000-0000-0000000000c4';
export const MOCK_ORDER_5_UUID = '00000000-0000-0000-0000-0000000000c5';

export const MOCK_ORDERS: readonly MockOrderHeader[] = [
  { orderUuid: MOCK_ORDER_UUID, orderNumber: 'ORD-2041', clientName: 'Mock Dental Studio A', patientCode: 'PT-0101', receivedOn: '2026-10-20', dueOn: '2026-10-29' },
  { orderUuid: MOCK_ORDER_2_UUID, orderNumber: 'ORD-2042', clientName: 'Sample Ortho Clinic B', patientCode: 'PT-0102', receivedOn: '2026-10-21', dueOn: '2026-10-30' },
  { orderUuid: MOCK_ORDER_3_UUID, orderNumber: 'ORD-2043', clientName: 'Test Smile Center C', patientCode: 'PT-0103', receivedOn: '2026-10-22', dueOn: '2026-10-28' },
  { orderUuid: MOCK_ORDER_4_UUID, orderNumber: 'ORD-2044', clientName: 'Demo Implant Lab D', patientCode: 'PT-0104', receivedOn: '2026-10-23', dueOn: '2026-11-02' },
  { orderUuid: MOCK_ORDER_5_UUID, orderNumber: 'ORD-2045', clientName: 'Mock Dental Studio A', patientCode: 'PT-0105', receivedOn: '2026-10-24', dueOn: '2026-11-04' },
];
