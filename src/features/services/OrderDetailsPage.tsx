/**
 * Order details (A20, layout from the earlier POC's order details page):
 * an order summary, then the order's services on the left and the selected
 * service on the right (its identity, staff fields, status buttons, On Hold
 * dialog and history: the same sections as the service page). The selected
 * service is in the URL (`?service=`), so a view can be shared; the first
 * service is shown when none is chosen.
 *
 * Data: the services come from the contract (`GET /orders/{uuid}/services`).
 * The order header (number, client, patient, dates) is mock only: the order
 * endpoint is not in the contract yet (Q-B26, D-61); with the real API the
 * header says so and only the services are shown.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { ROUTES } from '@/app/routes';
import { can, isApiError, type ApiError, type CatalogService, type ServiceItem } from '@/shared/api';
import { StatusBadge } from '@/shared/components/basic';
import { DetailList, SectionCard } from '@/shared/components/data-display';
import { ErrorState, InlineAlert, LoadingState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { formatDate } from '@/shared/lib/formatters';
import { typographyTokens } from '@/theme/tokens';
import { serviceApi } from './data/serviceApi';
import type { OrderSummary } from './data/orderSummary';
import { ServiceInstanceSections } from './detail/ServiceInstanceSections';
import { useServiceDetail } from './detail/useServiceDetail';

type OrderState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | null }
  | {
      status: 'ready';
      services: ServiceItem[];
      catalog: CatalogService[];
      /** null when the order header is not available (real API, Q-B26). */
      header: OrderSummary | null;
    };

function nameOf(catalog: readonly CatalogService[], uuid: string): string {
  return catalog.find((entry) => entry.uuid === uuid)?.name ?? 'Service';
}

function SelectedService({ serviceItemUuid, onChanged }: { serviceItemUuid: string; onChanged: () => void }) {
  const { state, reload } = useServiceDetail(serviceItemUuid);
  if (state.status === 'loading') return <LoadingState label="Loading the service…" rows={6} />;
  if (state.status === 'error') {
    const kind = state.error?.kind;
    return (
      <ErrorState
        title={
          kind === 'notFound'
            ? 'Service not available'
            : kind === 'forbidden'
              ? 'No access'
              : 'Could not load the service'
        }
        message={state.error?.message ?? 'Something went wrong. Try again.'}
        onRetry={kind === 'forbidden' || kind === 'notFound' ? undefined : reload}
      />
    );
  }
  return (
    <ServiceInstanceSections
      detail={state.detail}
      onChanged={() => {
        reload();
        onChanged();
      }}
    />
  );
}

export default function OrderDetailsPage() {
  const { orderUuid: orderParam } = useParams();
  const orderUuid = orderParam ?? serviceApi.demoOrderUuid ?? '';
  const [params, setParams] = useSearchParams();
  const { context } = useSession();
  const [state, setState] = useState<OrderState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const header = serviceApi.orders(options).then(
      (orders) => orders.find((order) => order.orderUuid === orderUuid) ?? null,
      () => null, // header is mock-only; without it the services still show
    );
    Promise.all([serviceApi.orderItems(orderUuid, options), serviceApi.catalog(undefined, options), header]).then(
      ([services, catalog, found]) => {
        if (!controller.signal.aborted) setState({ status: 'ready', services, catalog, header: found });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error: isApiError(error) ? error : null });
      },
    );
    return () => {
      controller.abort();
    };
  }, [orderUuid, attempt]);

  if (state.status === 'loading') {
    return (
      <>
        <PageHeader title="Order" />
        <LoadingState label="Loading the order…" rows={6} />
      </>
    );
  }
  if (state.status === 'error') {
    const kind = state.error?.kind;
    return (
      <>
        <PageHeader title="Order" />
        <ErrorState
          title={
            kind === 'notFound'
              ? 'Order not available'
              : kind === 'forbidden'
                ? 'No access'
                : 'Could not load the order'
          }
          message={state.error?.message ?? 'Something went wrong. Try again.'}
          onRetry={kind === 'forbidden' || kind === 'notFound' ? undefined : reload}
        />
      </>
    );
  }

  const { services, catalog, header } = state;
  const selected = services.find((item) => item.uuid === params.get('service')) ?? services.at(0) ?? null;
  const title = header ? `Order ${header.orderNumber}` : `Order …${orderUuid.slice(-8)}`;
  const addActions = can(context, 'service.create')
    ? catalog.map((service) => (
        <Box
          key={service.uuid}
          component={RouterLink}
          to={ROUTES.serviceNew(orderUuid, service.uuid)}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, typography: 'body2', color: 'primary.main' }}
        >
          <AddOutlinedIcon fontSize="small" aria-hidden="true" />
          {`New ${service.name}`}
        </Box>
      ))
    : null;

  return (
    <>
      <PageHeader
        title={title}
        description={`${String(services.length)} service${services.length === 1 ? '' : 's'} on this order. Each one has its own status, staff fields and history.`}
        evidence
        action={addActions}
      />
      <Stack spacing={3}>
        <SectionCard title="Order summary">
          {header ? (
            <>
              <DetailList
                columns={3}
                items={[
                  { label: 'Order number', value: header.orderNumber },
                  { label: 'Client', value: header.clientName },
                  { label: 'Patient code', value: header.patientCode },
                  { label: 'Received', value: formatDate(header.receivedOn) },
                  { label: 'Due', value: formatDate(header.dueOn) },
                  { label: 'Services', value: String(services.length) },
                  ...(header.teethByService
                    ? [
                        {
                          label: 'Teeth (FDI, mock)',
                          value:
                            services
                              .map((item) => {
                                const teeth = header.teethByService?.[item.uuid] ?? [];
                                return `Line ${String(item.lineNumber)}: ${teeth.length > 0 ? teeth.join(', ') : 'none'}`;
                              })
                              .join(' · ') || '—',
                          wide: true,
                        },
                      ]
                    : []),
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                Order number, client, patient code and dates are mock data: the order endpoint is not in the API
                contract yet (Q-B26).
              </Typography>
            </>
          ) : (
            <InlineAlert severity="info">
              The order header (number, client, patient, dates) is not in the API contract yet (Q-B26). The services
              below come from the API.
            </InlineAlert>
          )}
        </SectionCard>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '260px minmax(0, 1fr)' },
          }}
        >
          <Box component="nav" aria-label="Services of this order">
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1, fontWeight: 600 }}>
              {`${String(services.length)} SERVICE${services.length === 1 ? '' : 'S'}`}
            </Typography>
            <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {services.map((item) => {
                const current = item.uuid === selected?.uuid;
                return (
                  <li key={item.uuid}>
                    <ButtonBase
                      aria-current={current ? 'true' : undefined}
                      onClick={() => {
                        setParams({ service: item.uuid }, { replace: true });
                      }}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 0.75,
                        textAlign: 'left',
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        border: 1,
                        borderColor: current ? 'primary.main' : 'divider',
                        bgcolor: current ? 'action.selected' : 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: current ? 700 : 500 }}>
                        {`Line ${String(item.lineNumber)} · ${nameOf(catalog, item.sellableItemUuid)}`}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <StatusBadge status={item.status} size="sm" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: typographyTokens.fontFamily.mono }}
                        >
                          {item.uuid.slice(-8)}
                        </Typography>
                      </Stack>
                    </ButtonBase>
                  </li>
                );
              })}
            </Stack>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {selected ? (
              <SelectedService key={selected.uuid} serviceItemUuid={selected.uuid} onChanged={reload} />
            ) : (
              <InlineAlert severity="info">This order has no services yet.</InlineAlert>
            )}
          </Box>
        </Box>
      </Stack>
    </>
  );
}
