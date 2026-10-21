/**
 * Report columns. Priority drives the layout (ResponsiveDataTable): primary
 * columns show everywhere, secondary from md/lg, tertiary only in the
 * details row or the phone drawer.
 *
 * Column set from TASKS.md A5.1; PROVISIONAL until the contract (D-13).
 */

import { StatusBadge } from '@/shared/components/basic';
import type { DataColumn } from '@/shared/components/data-display';
import { formatDate } from '@/shared/lib/formatters';
import { SERVICE_TYPE_LABEL, statusIndex, type ServiceStatus } from '@/shared/status/status';
import type { ReportRow } from './types';

function serviceStatus(row: ReportRow): ServiceStatus {
  return row.serviceType === 'models'
    ? { service: 'models', status: row.status }
    : { service: 'conversion', status: row.status };
}

export const REPORT_COLUMNS: readonly DataColumn<ReportRow>[] = [
  {
    id: 'order',
    header: 'Order',
    priority: 'primary',
    role: 'title',
    render: (row) => row.orderNumber,
    sortValue: (row) => row.orderNumber,
  },
  {
    id: 'serviceType',
    header: 'Service',
    priority: 'primary',
    render: (row) => SERVICE_TYPE_LABEL[row.serviceType],
    sortValue: (row) => SERVICE_TYPE_LABEL[row.serviceType],
  },
  {
    id: 'status',
    header: 'Status',
    priority: 'primary',
    role: 'status',
    render: (row) => <StatusBadge value={serviceStatus(row)} size="sm" />,
    // Service type first, then listed position, so sorting follows the flow.
    sortValue: (row) => `${row.serviceType}-${String(statusIndex(serviceStatus(row)))}`,
  },
  {
    id: 'dueDate',
    header: 'Due date',
    priority: 'primary',
    render: (row) => formatDate(row.dueDate),
    sortValue: (row) => row.dueDate,
  },
  {
    id: 'client',
    header: 'Client',
    priority: 'secondary',
    showFrom: 'md',
    render: (row) => row.client,
    sortValue: (row) => row.client,
  },
  {
    id: 'priority',
    header: 'Priority',
    priority: 'secondary',
    showFrom: 'md',
    render: (row) => row.priority,
    sortValue: (row) => row.priority,
  },
  {
    id: 'serviceId',
    header: 'Service ID',
    priority: 'secondary',
    showFrom: 'lg',
    render: (row) => row.serviceId,
    sortValue: (row) => row.serviceId,
  },
  {
    id: 'patientCode',
    header: 'Patient code',
    priority: 'secondary',
    showFrom: 'lg',
    render: (row) => row.patientCode,
    sortValue: (row) => row.patientCode,
  },
  { id: 'option', header: 'Option', priority: 'tertiary', render: (row) => row.option },
  { id: 'arch', header: 'Arch', priority: 'tertiary', render: (row) => row.arch },
  {
    id: 'quantity',
    header: 'Quantity',
    priority: 'tertiary',
    align: 'right',
    render: (row) => row.quantity,
  },
];
