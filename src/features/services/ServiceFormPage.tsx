/**
 * Service form page: `/orders/:orderUuid/services/new/:serviceUuid` creates
 * a new instance (`.../new/family/conversion`: a Conversion the server
 * resolves); `/services/:serviceItemUuid/edit` edits one (and is where
 * a created instance reopens, showing what was saved).
 */

import { useParams } from 'react-router-dom';
import { can } from '@/shared/api';
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import type { TrailHints } from '@/shared/lib/breadcrumbs';
import { useSession } from '@/shared/hooks/useSession';
import { resolveFormSpec } from './forms/catalogFormBridge';
import { ServiceForm } from './forms/ServiceForm';
import { useServiceFormData, type ServiceFormTarget } from './forms/useServiceFormData';

function shortId(uuid: string): string {
  return uuid.slice(-8);
}

function useTarget(): ServiceFormTarget | null {
  const { orderUuid, serviceUuid, serviceFamily, serviceItemUuid } = useParams();
  if (serviceItemUuid) return { mode: 'edit', serviceItemUuid };
  if (orderUuid && serviceFamily === 'conversion') return { mode: 'createFamily', orderUuid, serviceFamily };
  if (orderUuid && serviceUuid) return { mode: 'create', orderUuid, serviceUuid };
  return null;
}

function ServiceFormContent({ target }: { target: ServiceFormTarget }) {
  const { data, retry } = useServiceFormData(target);
  const { context } = useSession();

  if (data.status === 'loading') {
    return (
      <>
        <PageHeader title={target.mode === 'edit' ? 'Service' : 'New service'} />
        <LoadingState label="Loading the service form…" rows={6} />
      </>
    );
  }

  if (data.status === 'error') {
    const kind = data.error?.kind;
    const denied = kind === 'forbidden' || kind === 'notFound';
    return (
      <>
        <PageHeader title="Service" />
        <ErrorState
          title={kind === 'notFound' ? 'Service not available' : kind === 'forbidden' ? 'No access' : 'Could not load the form'}
          message={
            kind === 'notFound'
              ? 'This service is not available.'
              : (data.error?.message ?? 'Something went wrong. Try again.')
          }
          onRetry={denied ? undefined : retry}
        />
      </>
    );
  }

  const { definition, item, etag } = data;
  const spec = resolveFormSpec(definition.service);
  const orderUuid = item?.orderUuid ?? (target.mode === 'edit' ? '' : target.orderUuid);
  const title =
    item === null
      ? `New ${definition.service.name} service`
      : `${definition.service.name} service, line ${String(item.lineNumber)}`;
  const breadcrumbs: TrailHints =
    item === null
      ? spec
        ? { section: spec.key === 'biomodel' ? 'models' : 'conversion' }
        : {}
      : { orderUuid: item.orderUuid, lineNumber: item.lineNumber };
  const description =
    item === null
      ? `Order …${shortId(orderUuid)}. A new instance is created even if the order already has this service.`
      : `Order …${shortId(orderUuid)} · Service ID …${shortId(item.uuid)}`;

  if (!spec) {
    return (
      <>
        <PageHeader title={title} description={description} evidence breadcrumbs={breadcrumbs} />
        <EmptyState
          title={`No form for ${definition.service.name} yet`}
          description={`Catalog code ${definition.service.code} is not mapped to a form. Option A has form rules for Biomodel and Conversion only.`}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} description={description} evidence breadcrumbs={breadcrumbs} />
      <ServiceForm
        key={`${item?.uuid ?? 'new'}|${etag ?? ''}`}
        spec={spec}
        definition={definition}
        item={item}
        etag={etag}
        orderUuid={orderUuid}
        onReload={retry}
        billToAllowed={can(context, 'service.billing.bill_to.edit')}
      />
    </>
  );
}

export default function ServiceFormPage() {
  const target = useTarget();
  if (!target) {
    return (
      <>
        <PageHeader title="Service" />
        <EmptyState title="Nothing to show" description="This address does not name a service." />
      </>
    );
  }
  const key =
    target.mode === 'create'
      ? `${target.orderUuid}/${target.serviceUuid}`
      : target.mode === 'createFamily'
        ? `${target.orderUuid}/${target.serviceFamily}`
        : target.serviceItemUuid;
  return <ServiceFormContent key={key} target={target} />;
}
