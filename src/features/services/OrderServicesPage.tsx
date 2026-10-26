/**
 * Order services (A7R.1): every service instance of the demo order, one row
 * per instance with its own line number and short UUID, so two same-type
 * services are visibly two separate things. Each row opens that instance.
 *
 * Lives in the services feature because it only reads service data (no
 * cross-feature imports); the Orders nav entry points here.
 *
 * The contract has no order list or lookup (Q-B3): the mock names one
 * synthetic demo order; with the real API there is no order to show.
 */

import { useEffect, useState } from 'react';
import { ROUTES } from '@/app/routes';
import { isApiError, type ServiceItem } from '@/shared/api';
import { StatusBadge } from '@/shared/components/basic';
import { ResponsiveDataTable, type DataColumn } from '@/shared/components/data-display';
import { InlineAlert } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { useTableControls } from '@/shared/hooks/useTableControls';
import { serviceApi } from './data/serviceApi';

interface OrderServiceRow {
  item: ServiceItem;
  serviceName: string;
}

const COLUMNS: readonly DataColumn<OrderServiceRow>[] = [
  {
    id: 'line',
    header: 'Line',
    priority: 'primary',
    role: 'title',
    render: (row) => `Line ${String(row.item.lineNumber ?? '-')}: ${row.serviceName}`,
    sortValue: (row) => row.item.lineNumber,
  },
  {
    id: 'status',
    header: 'Status',
    priority: 'primary',
    role: 'status',
    render: (row) => <StatusBadge status={row.item.status} size="sm" />,
  },
  {
    id: 'id',
    header: 'Instance ID',
    priority: 'primary',
    render: (row) => row.item.uuid.slice(-8),
  },
  {
    id: 'total',
    header: 'Line total',
    priority: 'secondary',
    align: 'right',
    render: (row) => (row.item.lineTotal ? `${row.item.lineTotal} ${row.item.currencyCode ?? ''}` : '-'),
  },
];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: OrderServiceRow[] };

export default function OrderServicesPage() {
  const orderUuid = serviceApi.demoOrderUuid;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const controls = useTableControls({
    initialSort: { column: 'line', direction: 'asc' },
  });

  useEffect(() => {
    if (orderUuid === null) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([serviceApi.orderItems(orderUuid, options), serviceApi.catalog(undefined, options)]).then(
      ([items, catalog]) => {
        if (controller.signal.aborted) return;
        const nameOf = (uuid: string) => catalog.find((entry) => entry.uuid === uuid)?.name ?? 'Service';
        setState({
          status: 'ready',
          rows: items.map((item) => ({
            item,
            serviceName: nameOf(item.sellableItemUuid),
          })),
        });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: isApiError(error) ? error.message : 'Could not load the services.',
        });
      },
    );
    return () => {
      controller.abort();
    };
  }, [orderUuid, attempt]);

  return (
    <>
      <PageHeader
        title="Order services"
        description="Every service on the demo order. Two services of the same type are two separate instances."
        evidence
      />
      {orderUuid === null ? (
        <InlineAlert severity="info">
          The API has no order list or lookup yet (question Q-B3), so there is no order to show.
        </InlineAlert>
      ) : (
        <ResponsiveDataTable
          rows={state.status === 'ready' ? state.rows : []}
          columns={COLUMNS}
          getRowId={(row) => row.item.uuid}
          getRowHref={(row) => ROUTES.serviceDetail(row.item.uuid)}
          controls={controls}
          ariaLabel="Services on the demo order"
          loading={state.status === 'loading'}
          error={state.status === 'error' ? state.message : null}
          onRetry={() => {
            setState({ status: 'loading' });
            setAttempt((value) => value + 1);
          }}
          empty={{ title: 'No services on this order yet' }}
          paginate={false}
        />
      )}
    </>
  );
}
