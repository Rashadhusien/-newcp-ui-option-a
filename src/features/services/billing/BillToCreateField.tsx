/**
 * Optional Bill To when creating ONE service (F07 `CreateServiceItem`):
 * empty = the order default is copied once by the server; a choice applies
 * to this new service only. BLOCKED (A38) until a live check of the payer
 * endpoint (A31): it says BLOCKED and the form sends no payer. The page shows it only with the
 * Bill To capability (display only; the server decides).
 */

import Stack from '@mui/material/Stack';
import { AppSelect } from '@/shared/components/basic';
import { InlineAlert } from '@/shared/components/feedback';
import { BILL_TO_BLOCKED_TEXT, BILL_TO_INDEPENDENT_TEXT, partyLabel } from './billTo';
import { useEligibleBilledParties } from './useEligibleBilledParties';

export interface BillToCreateFieldProps {
  orderUuid: string;
  /** '' = use the order default. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function BillToCreateField({ orderUuid, value, onChange, error, disabled = false }: BillToCreateFieldProps) {
  const parties = useEligibleBilledParties(orderUuid);
  if (parties.status === 'blocked') return <InlineAlert severity="warning">{`BLOCKED. ${BILL_TO_BLOCKED_TEXT}`}</InlineAlert>;
  if (parties.status === 'error') return <InlineAlert severity="error">{parties.message}</InlineAlert>;

  return (
    <Stack id="field-billedToContactUuid" spacing={1}>
      <AppSelect<string>
        label="Bill To (mock)"
        name="billedToContactUuid"
        loading={parties.status === 'loading'}
        options={[
          { value: '', label: 'Order default' },
          ...(parties.status === 'ready'
            ? parties.parties.map((party) => ({ value: party.contactUuid, label: partyLabel(party) }))
            : []),
        ]}
        value={value}
        onChange={(next) => {
          onChange(next ?? '');
        }}
        error={error}
        disabled={disabled}
      />
      <InlineAlert severity="info">{`For this new service only. ${BILL_TO_INDEPENDENT_TEXT}`}</InlineAlert>
    </Stack>
  );
}
