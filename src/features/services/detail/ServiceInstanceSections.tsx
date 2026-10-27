/**
 * The body of one service instance: identity, staff fields, Bill To (A23),
 * status and history (A7R), shared by the service page and the order details page
 * (A20). Everything is keyed by the instance UUID and its version, so two
 * same-type services stay independent.
 */

import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { ROUTES } from '@/app/routes';
import { can } from '@/shared/api';
import { StatusBadge } from '@/shared/components/basic';
import { DetailList, SectionCard } from '@/shared/components/data-display';
import { EvidenceBadge } from '@/shared/components/feedback';
import { useSession } from '@/shared/hooks/useSession';
import { BillToSection } from '../billing/BillToSection';
import { serviceApi } from '../data/serviceApi';
import { StaffFieldsForm } from './StaffFieldsForm';
import { StatusPanel } from './StatusPanel';
import type { ServiceDetail } from './useServiceDetail';

export interface ServiceInstanceSectionsProps {
  detail: ServiceDetail;
  /** Reloads the instance (after a save, a move, or to get the latest version). */
  onChanged: () => void;
}

export function ServiceInstanceSections({ detail, onChanged }: ServiceInstanceSectionsProps) {
  const { context } = useSession();
  const { item, etag, serviceName, transitions, history } = detail;
  const lineLabel = `line ${String(item.lineNumber ?? '-')}`;

  return (
    <Stack spacing={3}>
      <SectionCard title="Instance">
        <DetailList
          columns={3}
          items={[
            { label: 'Service', value: serviceName },
            { label: 'Line', value: String(item.lineNumber ?? '-') },
            { label: 'Instance ID', value: item.uuid },
            { label: 'Status', value: <StatusBadge status={item.status} size="sm" /> },
            { label: 'Invoiced', value: item.isInvoiced ? 'Yes (financially locked)' : 'No' },
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
      </SectionCard>
      <SectionCard title="Staff fields">
        <StaffFieldsForm key={etag} item={item} etag={etag} onSaved={onChanged} onReload={onChanged} />
      </SectionCard>
      <SectionCard
        title="Bill To"
        action={serviceApi.billToAvailable ? <EvidenceBadge evidence={serviceApi.evidence} /> : undefined}
      >
        <BillToSection key={etag} item={item} etag={etag} onSaved={onChanged} onReload={onChanged} />
      </SectionCard>
      <SectionCard title="Status">
        <StatusPanel
          key={etag}
          serviceItemUuid={item.uuid}
          lineLabel={lineLabel}
          status={item.status}
          etag={etag}
          transitions={transitions}
          history={history}
          onChanged={onChanged}
        />
      </SectionCard>
    </Stack>
  );
}
