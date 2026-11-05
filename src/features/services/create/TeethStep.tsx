/**
 * Step 3, teeth (A21, layout from the earlier POC's TeethStep): FDI teeth
 * for all services or for one instance; an instance without its own teeth
 * uses the shared selection. Optional. The teeth are kept in mock data only:
 * the contract's Biomodel and Conversion answers have no tooth field yet
 * (Q-B24).
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AppSelect } from '@/shared/components/basic';
import { DetailList, SectionCard } from '@/shared/components/data-display';
import { TeethChart } from '@/shared/components/teeth/TeethChart';
import { teethFor, type CreateOrderWizard } from './useCreateOrderWizard';

const ALL = '__all__';

export interface TeethStepProps {
  wizard: CreateOrderWizard;
  instanceLabel: (instanceId: string) => string;
}

function assignment(own: number[] | undefined, shared: readonly number[]): string {
  if (own) return own.length > 0 ? own.join(', ') : 'None';
  return shared.length > 0 ? `Uses all: ${shared.join(', ')}` : '—';
}

export function TeethStep({ wizard, instanceLabel }: TeethStepProps) {
  const { state, setTeeth } = wizard;
  const [target, setTarget] = useState(ALL);
  const instanceTarget = state.instances.some((instance) => instance.id === target) ? target : null;
  const selected = instanceTarget ? teethFor(state, instanceTarget) : state.sharedTeeth;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
        alignItems: 'start',
      }}
    >
      <SectionCard
        title="Teeth"
        action={
          <Typography variant="caption" color="text.secondary">
            Optional · FDI numbering
          </Typography>
        }
      >
        <Stack spacing={2}>
          <Box sx={{ maxWidth: 360 }}>
            <AppSelect<string>
              label="Apply teeth to"
              name="teeth-target"
              value={instanceTarget ?? ALL}
              options={[
                { value: ALL, label: 'All services' },
                ...state.instances.map((instance) => ({ value: instance.id, label: instanceLabel(instance.id) })),
              ]}
              onChange={(value) => {
                setTarget(value ?? ALL);
              }}
            />
          </Box>
          <TeethChart
            label={instanceTarget ? `Teeth for ${instanceLabel(instanceTarget)}` : 'Teeth for all services'}
            selected={selected}
            onChange={(teeth) => {
              setTeeth(instanceTarget, teeth);
            }}
          />
        </Stack>
      </SectionCard>
      <SectionCard title="Assignment">
        <Stack spacing={2}>
          <DetailList
            dense
            columns={1}
            items={[
              { label: 'All services', value: state.sharedTeeth.join(', ') || '—' },
              ...state.instances.map((instance) => ({
                label: instanceLabel(instance.id),
                value: assignment(state.instanceTeeth[instance.id], state.sharedTeeth),
              })),
            ]}
          />
          <Typography variant="caption" color="text.secondary">
            A service without its own teeth uses the shared selection. Teeth are kept in mock data only until the new
            database fields are in the API contract (Q-B24).
          </Typography>
        </Stack>
      </SectionCard>
    </Box>
  );
}
