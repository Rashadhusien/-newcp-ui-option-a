/**
 * Orders (A19, pattern from the earlier POC's order flow list): one row per
 * ORDER with its service instances; "Show services" opens the order's
 * service lines, each with its own status and an Open link, so two
 * same-type services stay two separate lines. "Open order" shows the
 * order's services page (the full order details page is A20).
 *
 * Data: mock only. Bishoy's `GET /orders` is not in the contract yet
 * (Q-B26): the order header (number, client, patient code, dates) is a
 * PROPOSED, synthetic shape (D-61); with the real API the list is BLOCKED
 * and nothing is called. Search and status filter live in the URL.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ROUTES } from '@/app/routes';
import { isApiError, type ApiError, type CatalogService } from '@/shared/api';
import { AppSelect, StatusBadge, type AppSelectOption } from '@/shared/components/basic';
import { ResponsiveDataTable, TableToolbar, type DataColumn, type FilterChip } from '@/shared/components/data-display';
import { InlineAlert } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { useUrlFilter, useUrlFiltersUpdater, useUrlTableControls } from '@/shared/hooks/useUrlTableControls';
import { formatDate } from '@/shared/lib/formatters';
import { presentStatus } from '@/shared/status/status';
import { typographyTokens } from '@/theme/tokens';
import { NewOrderButton } from './create/NewOrderButton';
import { serviceApi } from './data/serviceApi';
import type { OrderSummary } from './data/orderSummary';

const ALL = 'all';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | null }
  | { status: 'ready'; orders: OrderSummary[]; catalog: CatalogService[] };

function serviceName(catalog: readonly CatalogService[], uuid: string): string {
  return catalog.find((entry) => entry.uuid === uuid)?.name ?? 'Service';
}

function ServiceLines({ order, catalog }: { order: OrderSummary; catalog: readonly CatalogService[] }) {
  return (
    <Stack
      component="ul"
      spacing={1}
      aria-label={`Services of order ${order.orderNumber}`}
      sx={{ m: 0, p: 0, listStyle: 'none' }}
    >
      {order.services.map((item) => (
        <Stack
          key={item.uuid}
          component="li"
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
        >
          <Typography variant="body2" sx={{ minWidth: 150 }}>
            {`Line ${String(item.lineNumber)} · ${serviceName(catalog, item.sellableItemUuid)}`}
          </Typography>
          <StatusBadge status={item.status} size="sm" />
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: typographyTokens.fontFamily.mono }}>
            {item.uuid.slice(-8)}
          </Typography>
          <Link component={RouterLink} to={ROUTES.serviceDetail(item.uuid)} variant="body2" underline="hover">
            Open
          </Link>
        </Stack>
      ))}
    </Stack>
  );
}

export default function OrdersPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useUrlFilter('q');
  const [statusParam, setStatusParam] = useUrlFilter('status');
  const updateFilters = useUrlFiltersUpdater();
  const controls = useUrlTableControls({ initialSort: { column: 'order', direction: 'asc' }, pageSize: 10 });

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([serviceApi.orders(options), serviceApi.catalog(undefined, options)]).then(
      ([orders, catalog]) => {
        if (!controller.signal.aborted) setState({ status: 'ready', orders, catalog });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error: isApiError(error) ? error : null });
      },
    );
    return () => {
      controller.abort();
    };
  }, [attempt]);

  const orders = state.status === 'ready' ? state.orders : [];
  const catalog = state.status === 'ready' ? state.catalog : [];
  const statuses = [...new Set(orders.flatMap((order) => order.services.map((item) => item.status)))].sort((a, b) =>
    presentStatus(a).label.localeCompare(presentStatus(b).label),
  );
  const status = statuses.find((value) => value === statusParam) ?? '';
  const needle = search.trim().toLowerCase();
  const filtered = orders.filter(
    (order) =>
      (needle === '' ||
        [order.orderNumber, order.clientName, order.patientCode].some((value) =>
          value.toLowerCase().includes(needle),
        )) &&
      (status === '' || order.services.some((item) => item.status === status)),
  );

  const columns: DataColumn<OrderSummary>[] = [
    {
      id: 'order',
      header: 'Order',
      priority: 'primary',
      role: 'title',
      render: (order) => (
        <Box component="span" sx={{ fontFamily: typographyTokens.fontFamily.mono }}>
          {order.orderNumber}
        </Box>
      ),
      sortValue: (order) => order.orderNumber,
    },
    {
      id: 'client',
      header: 'Client and patient',
      priority: 'primary',
      render: (order) => (
        <Stack>
          <span>{order.clientName}</span>
          <Typography variant="caption" color="text.secondary">
            {order.patientCode}
          </Typography>
        </Stack>
      ),
      sortValue: (order) => order.clientName,
    },
    {
      id: 'services',
      header: 'Services',
      priority: 'primary',
      render: (order) => (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {order.services.map((item) => (
            <StatusBadge key={item.uuid} status={item.status} size="sm" />
          ))}
        </Stack>
      ),
      sortValue: (order) => order.services.length,
    },
    {
      id: 'received',
      header: 'Received',
      priority: 'secondary',
      render: (order) => formatDate(order.receivedOn),
      sortValue: (order) => order.receivedOn,
    },
    {
      id: 'due',
      header: 'Due',
      priority: 'secondary',
      render: (order) => formatDate(order.dueOn),
      sortValue: (order) => order.dueOn,
    },
  ];

  const statusOptions: AppSelectOption<string>[] = [
    { value: ALL, label: 'All statuses' },
    ...statuses.map((value) => ({ value, label: presentStatus(value).label })),
  ];
  const chips: FilterChip[] = [];
  if (search !== '')
    chips.push({
      key: 'q',
      label: `Search: ${search}`,
      onDelete: () => {
        setSearch('');
      },
    });
  if (status !== '') {
    chips.push({
      key: 'status',
      label: `Status: ${presentStatus(status).label}`,
      onDelete: () => {
        setStatusParam('');
      },
    });
  }
  const clearAll = () => {
    updateFilters({ q: '', status: '' });
  };
  const blocked = state.status === 'error' && state.error?.kind === 'blocked';
  const serviceCount = filtered.reduce((sum, order) => sum + order.services.length, 0);

  return (
    <>
      <PageHeader
        title="All orders"
        description="One row per order. Open a row to see its services: each service is its own instance with its own status."
        evidence
        action={<NewOrderButton />}
      />
      {blocked ? (
        <InlineAlert severity="warning">{`BLOCKED: ${state.error?.message ?? ''}`}</InlineAlert>
      ) : (
        <Paper variant="outlined">
          <TableToolbar
            title="All orders"
            count={
              state.status === 'loading'
                ? 'Loading orders…'
                : state.status === 'error'
                  ? undefined
                  : `${String(filtered.length)} orders · ${String(serviceCount)} services`
            }
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search order number, client, patient code"
            filters={
              <AppSelect
                label="Service status"
                size="small"
                options={statusOptions}
                value={status === '' ? ALL : status}
                onChange={(value) => {
                  setStatusParam(value == null || value === ALL ? '' : value);
                }}
              />
            }
            chips={chips}
            onClearAll={clearAll}
          />
          <ResponsiveDataTable
            rows={filtered}
            columns={columns}
            getRowId={(order) => order.orderUuid}
            controls={controls}
            ariaLabel="All orders"
            loading={state.status === 'loading'}
            error={state.status === 'error' ? (state.error?.message ?? 'Could not load the orders.') : null}
            onRetry={() => {
              setState({ status: 'loading' });
              setAttempt((value) => value + 1);
            }}
            renderExpanded={(order) => <ServiceLines order={order} catalog={catalog} />}
            expandLabel={(order) => `Show services of ${order.orderNumber}`}
            renderActions={(order) => (
              <Link component={RouterLink} to={ROUTES.orderServices(order.orderUuid)} variant="body2" underline="hover">
                Open order
              </Link>
            )}
            empty={
              chips.length > 0
                ? { title: 'No orders match these filters', actionLabel: 'Clear filters', onAction: clearAll }
                : { title: 'No orders yet' }
            }
          />
        </Paper>
      )}
    </>
  );
}
