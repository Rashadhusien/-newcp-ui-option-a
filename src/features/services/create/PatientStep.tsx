/**
 * Step 1, patient and client (A21). Synthetic only: which patient fields the
 * UI may collect is open (Q-B25), so the step asks for a patient CODE, never
 * a name. The client list is mock data (no client lookup in the contract).
 */

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AppSelect, AppTextField } from '@/shared/components/basic';
import { SectionCard } from '@/shared/components/data-display';
import type { CreateOrderWizard } from './useCreateOrderWizard';

export interface PatientStepProps {
  wizard: CreateOrderWizard;
  clients: readonly string[];
}

export function PatientStep({ wizard, clients }: PatientStepProps) {
  const { state, update, showBlocked } = wizard;
  return (
    <SectionCard title="Patient and client">
      <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
        <AppSelect<string>
          label="Client (mock list)"
          name="client"
          required
          options={clients.map((client) => ({ value: client, label: client }))}
          value={state.clientName === '' ? null : state.clientName}
          onChange={(value) => {
            update({ clientName: value ?? '' });
          }}
          error={showBlocked && state.clientName === '' ? 'Choose a client.' : undefined}
        />
        <AppTextField
          label="Patient code"
          name="patientCode"
          required
          placeholder="e.g. PT-0110"
          value={state.patientCode}
          onChange={(value) => {
            update({ patientCode: value });
          }}
          helperText="A code only, never a patient name (question Q-B25)."
          error={showBlocked && state.patientCode.trim() === '' ? 'Enter a patient code.' : undefined}
        />
        <AppTextField
          label="Due date"
          name="dueOn"
          type="date"
          value={state.dueOn}
          onChange={(value) => {
            update({ dueOn: value });
          }}
        />
        <Typography variant="caption" color="text.secondary">
          The order header is mock data until the create-order endpoint is in the API contract (Q-B24).
        </Typography>
      </Stack>
    </SectionCard>
  );
}
