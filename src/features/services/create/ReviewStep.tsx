/**
 * Step 5, review (A21): what will be created, per instance, before the
 * clerk confirms. Nothing has been sent yet.
 */

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DetailList, SectionCard } from '@/shared/components/data-display';
import { formatDate } from '@/shared/lib/formatters';
import { teethFor, type CreateOrderWizard } from './useCreateOrderWizard';

export interface ReviewStepProps {
  wizard: CreateOrderWizard;
  instanceLabel: (instanceId: string) => string;
  answeredCount: (instanceId: string) => number;
}

export function ReviewStep({ wizard, instanceLabel, answeredCount }: ReviewStepProps) {
  const { state } = wizard;
  return (
    <Stack spacing={2}>
      <SectionCard title="Order">
        <DetailList
          columns={3}
          items={[
            { label: 'Client', value: state.clientName },
            { label: 'Patient code', value: state.patientCode },
            { label: 'Due', value: formatDate(state.dueOn) },
          ]}
        />
      </SectionCard>
      <SectionCard title={`Services (${String(state.instances.length)})`}>
        <DetailList
          columns={1}
          items={state.instances.map((instance) => ({
            label: instanceLabel(instance.id),
            value: `${String(answeredCount(instance.id))} answers · teeth: ${teethFor(state, instance.id).join(', ') || 'none'}`,
          }))}
        />
        <Typography variant="caption" color="text.secondary">
          Each service is created as its own instance with its own status, history and staff fields.
        </Typography>
      </SectionCard>
    </Stack>
  );
}
