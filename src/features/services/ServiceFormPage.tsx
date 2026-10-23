/**
 * Service form page: `/orders/:orderUuid/services/new/:serviceUuid` creates
 * a new instance; `/services/:serviceItemUuid/edit` edits one (and is where
 * a created instance reopens, showing what was saved).
 */

import { useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { specForService } from './forms/formSpecs';
import { ServiceForm } from './forms/ServiceForm';
import { useServiceFormData, type ServiceFormTarget } from './forms/useServiceFormData';

function shortId(uuid: string): string {
  return uuid.slice(-8);
}

function useTarget(): ServiceFormTarget | null {
  const { orderUuid, serviceUuid, serviceItemUuid } = useParams();
  if (serviceItemUuid) return { mode: 'edit', serviceItemUuid };
  if (orderUuid && serviceUuid) return { mode: 'create', orderUuid, serviceUuid };
  return null;
}

function ServiceFormContent({ target }: { target: ServiceFormTarget }) {
  const { data, retry } = useServiceFormData(target);

  if (data.status === 'loading') {
    return (
      <>
        <PageHeader title={target.mode === 'create' ? 'New service' : 'Service'} />
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
          title={kind === 'notFound' ? 'Service not found' : kind === 'forbidden' ? 'No access' : 'Could not load the form'}
          message={
            kind === 'notFound'
              ? 'This service does not exist, or you do not have access to it.'
              : (data.error?.message ?? 'Something went wrong. Try again.')
          }
          onRetry={denied ? undefined : retry}
        />
      </>
    );
  }

  const { definition, item } = data;
  const spec = specForService(definition.service.code);
  const orderUuid = item?.orderUuid ?? (target.mode === 'create' ? target.orderUuid : '');
  const title =
    item === null
      ? `New ${definition.service.name} service`
      : `${definition.service.name} service, line ${String(item.lineNumber)}`;
  const description =
    item === null
      ? `Order …${shortId(orderUuid)}. A new instance is created even if the order already has this service.`
      : `Order …${shortId(orderUuid)} · Service ID …${shortId(item.uuid)}`;

  if (!spec) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <EmptyState
          title="No form for this service"
          description="Option A has form rules for Biomodel and Conversion only."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} description={description} />
      <ServiceForm
        key={item?.uuid ?? 'new'}
        spec={spec}
        definition={definition}
        item={item}
        orderUuid={orderUuid}
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
  const key = target.mode === 'create' ? `${target.orderUuid}/${target.serviceUuid}` : target.serviceItemUuid;
  return <ServiceFormContent key={key} target={target} />;
}
