/**
 * One service instance (A7R): identity, staff fields, status and history.
 * Everything is keyed by the instance UUID, so two same-type services on
 * one order are edited, moved and audited independently (A7R.4).
 *
 * Denied states: 403 -> "No access" (no retry: the server decided); 404 ->
 * "not available" without saying whether it exists (tenant-masked); a 401
 * returns to sign-in through the session.
 */

import { Link as RouterLink, useParams } from 'react-router-dom';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ROUTES } from '@/app/routes';
import { can } from '@/shared/api';
import { StatusBadge } from '@/shared/components/basic';
import { DetailList } from '@/shared/components/data-display';
import { ErrorState, LoadingState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { StaffFieldsForm } from './detail/StaffFieldsForm';
import { StatusPanel } from './detail/StatusPanel';
import { useServiceDetail } from './detail/useServiceDetail';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" component="section" aria-label={title} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h2" component="h2">
          {title}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}

function ServiceDetail({ serviceItemUuid }: { serviceItemUuid: string }) {
  const { state, reload } = useServiceDetail(serviceItemUuid);
  const { context } = useSession();

  if (state.status === 'loading') {
    return (
      <>
        <PageHeader title="Service" />
        <LoadingState label="Loading the service…" rows={6} />
      </>
    );
  }
  if (state.status === 'error') {
    const kind = state.error?.kind;
    const denied = kind === 'forbidden' || kind === 'notFound';
    return (
      <>
        <PageHeader title="Service" />
        <ErrorState
          title={
            kind === 'notFound'
              ? 'Service not available'
              : kind === 'forbidden'
                ? 'No access'
                : 'Could not load the service'
          }
          message={state.error?.message ?? 'Something went wrong. Try again.'}
          onRetry={denied ? undefined : reload}
        />
      </>
    );
  }

  const { item, etag, serviceName, transitions, history } = state.detail;
  const lineLabel = `line ${String(item.lineNumber ?? '-')}`;
  return (
    <>
      <PageHeader
        title={`${serviceName} service, ${lineLabel}`}
        description="This instance only: its own staff fields, status and history."
      />
      <Stack spacing={3}>
        <Section title="Instance">
          <DetailList
            columns={3}
            items={[
              { label: 'Service', value: serviceName },
              { label: 'Line', value: String(item.lineNumber ?? '-') },
              { label: 'Instance ID', value: item.uuid },
              {
                label: 'Status',
                value: <StatusBadge status={item.status} size="sm" />,
              },
              {
                label: 'Invoiced',
                value: item.isInvoiced ? 'Yes (financially locked)' : 'No',
              },
              {
                label: 'Form answers',
                value: can(context, 'service.update') ? (
                  <Link component={RouterLink} to={ROUTES.serviceEdit(item.uuid)}>
                    Edit the form answers
                  </Link>
                ) : (
                  'Read-only'
                ),
              },
            ]}
          />
        </Section>
        <Section title="Staff fields">
          <StaffFieldsForm key={etag} item={item} etag={etag} onSaved={reload} onReload={reload} />
        </Section>
        <Section title="Status">
          <StatusPanel
            key={etag}
            serviceItemUuid={item.uuid}
            lineLabel={lineLabel}
            status={item.status}
            etag={etag}
            transitions={transitions}
            history={history}
            onChanged={reload}
          />
        </Section>
      </Stack>
    </>
  );
}

export default function ServiceDetailPage() {
  const { serviceItemUuid } = useParams();
  if (!serviceItemUuid) {
    return <ErrorState title="Service not available" message="No service was given." />;
  }
  return <ServiceDetail key={serviceItemUuid} serviceItemUuid={serviceItemUuid} />;
}
