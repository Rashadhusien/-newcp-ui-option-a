/**
 * Report row: one row per service INSTANCE (not per order).
 *
 * PROVISIONAL and partly OBSOLETE (D-23): these fields come from the 20 Oct
 * TASKS A5.1, not from the contract. A5R re-keys the report onto the
 * service adapter; until then the row keeps its fixture fields.
 */

/** Report-local service type until A5R (the contract identifies services by sellableItemUuid). */
export type ServiceType = 'models' | 'conversion';

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  models: 'Models',
  conversion: 'Conversion',
};

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

export interface ReportRow extends ReportRowBase {
  serviceType: ServiceType;
  /** Status value, displayed through shared/status (provisional fixture values until A5R). */
  status: string;
}
