/**
 * One service instance (A7R): identity, staff fields, status and history.
 * Everything is keyed by the instance UUID, so two same-type services on
 * one order are edited, moved and audited independently (A7R.4).
 *
 * Denied states: 403 -> "No access" (no retry: the server decided); 404 ->
 * "not available" without saying whether it exists (tenant-masked); a 401
 * returns to sign-in through the session.
 */

import { useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { ServiceInstanceSections } from './detail/ServiceInstanceSections';
import { useServiceDetail } from './detail/useServiceDetail';

function ServiceDetail({ serviceItemUuid }: { serviceItemUuid: string }) {
  const { state, reload } = useServiceDetail(serviceItemUuid);

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

  const { item, serviceName } = state.detail;
  return (
    <>
      <PageHeader
        title={`${serviceName} service, line ${String(item.lineNumber ?? '-')}`}
        description="This instance only: its own staff fields, status and history."
        evidence
      />
      <ServiceInstanceSections detail={state.detail} onChanged={reload} />
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
