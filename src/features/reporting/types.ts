/**
 * Report row: one row per service INSTANCE (not per order).
 *
 * PROVISIONAL: these fields come from TASKS.md A5.1 and the mockups, not
 * from the OpenAPI contract, which has not arrived yet (DEVIATIONS D-12,
 * D-13). Every field name and value set is [NEEDS VERIFICATION] and will be
 * replaced by the contract types from `src/shared/api/` when A2 resumes.
 */

import type { ServiceType, StatusByService } from '@/shared/status/status';

/** [NEEDS VERIFICATION] arch values (Q1). */
export type Arch = 'Upper' | 'Lower' | 'Both';

/** [NEEDS VERIFICATION] priority values (Q1). */
export type Priority = 'Normal' | 'Rush';

interface ReportRowBase {
  /** Service instance id: distinct for two same-type services in one order. */
  serviceId: string;
  orderId: string;
  orderNumber: string;
  client: string;
  /** Patient identity is hidden; only the code is shown (PLAN section 2). */
  patientCode: string;
  option: string;
  arch: Arch;
  quantity: number;
  /** ISO date (yyyy-mm-dd). */
  dueDate: string;
  priority: Priority;
}

/** Status is typed per service type, so a Models row can't hold a Conversion status. */
export type ReportRow = {
  [S in ServiceType]: ReportRowBase & { serviceType: S; status: StatusByService[S] };
}[ServiceType];
