/**
 * Service-level Bill To of ONE instance (F07, A23 restores A8R): who pays
 * for this service, Doctor or Scanning Center, chosen from the order's
 * eligible billed parties.
 *
 * - MOCK only (D-44): with the real API the section says BLOCKED, the
 *   payer endpoint is never called and nothing is sent.
 * - Saves only `billedToContactUuid`, for this one instance, with If-Match.
 *   Never billedPartyOrigin or a tenant; never an order-level payer.
 * - Its own save, separate from the staff fields, so Billable and Bill To
 *   never change each other.
 * - `canEditBilledParty` and the session capability hide the save
 *   (display only; the server decides). 403/409 above the form, 422 on the
 *   field, 412 keeps the choice and offers a reload. Success only after the
 *   API returned the saved item.
 */

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { can, isApiError, type ServiceItem } from '@/shared/api';
import { AppButton, AppSelect } from '@/shared/components/basic';
import { DetailList } from '@/shared/components/data-display';
import { ErrorSummary, InlineAlert, LoadingState, useToast } from '@/shared/components/feedback';
import { useSession } from '@/shared/hooks/useSession';
import { serviceApi } from '../data/serviceApi';
import { BILL_TO_BLOCKED_TEXT, BILL_TO_INDEPENDENT_TEXT, originLabel, partyLabel, payerLabel } from './billTo';
import { useEligibleBilledParties } from './useEligibleBilledParties';

export interface BillToSectionProps {
  item: ServiceItem;
  etag: string;
  /** Called after a successful save, to reload the instance. */
  onSaved: () => void;
  /** Reloads the latest version (after a 412). */
  onReload: () => void;
}

const LABEL = 'Bill To';
const FIELD_NAME = 'billto-billedToContactUuid';

const schema = z.object({
  billedToContactUuid: z.string().min(1, 'Choose who pays for this service.'),
});

type BillToValues = z.infer<typeof schema>;

function focusField(): void {
  document.querySelector<HTMLElement>(`[name="${FIELD_NAME}"]`)?.parentElement?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
}

export function BillToSection({ item, etag, onSaved, onReload }: BillToSectionProps) {
  const { context } = useSession();
  const { showToast } = useToast();
  const parties = useEligibleBilledParties(item.orderUuid);
  const [stale, setStale] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const editable = item.canEditBilledParty !== false && can(context, 'service.billing.bill_to.edit');
  const lineLabel = `line ${String(item.lineNumber ?? '-')}`;

  const { control, formState, handleSubmit, setError } = useForm<BillToValues>({
    defaultValues: { billedToContactUuid: item.billedToContactUuid },
    resolver: zodResolver(schema),
  });

  if (parties.status === 'blocked') {
    return <InlineAlert severity="warning">{`BLOCKED. ${BILL_TO_BLOCKED_TEXT}`}</InlineAlert>;
  }
  if (parties.status === 'loading') return <LoadingState label="Loading who can be billed…" rows={2} />;
  if (parties.status === 'error') return <InlineAlert severity="error">{parties.message}</InlineAlert>;

  const list = parties.parties;
  const message = formState.errors.billedToContactUuid?.message;

  const submit = handleSubmit(
    async ({ billedToContactUuid }) => {
      setStale(false);
      setServerError(null);
      if (billedToContactUuid === item.billedToContactUuid) {
        showToast('Nothing changed.', { severity: 'info' });
        return;
      }
      try {
        await serviceApi.edit(item.uuid, { billedToContactUuid }, etag);
        showToast(`Bill To saved for ${lineLabel}.`, { severity: 'success' });
        onSaved();
      } catch (error) {
        if (!isApiError(error)) {
          setServerError('Something went wrong. Nothing was saved.');
          return;
        }
        if (error.kind === 'stale') {
          setStale(true);
          return;
        }
        if (error.kind === 'validation' && error.problem?.details?.field === 'billedToContactUuid') {
          setError('billedToContactUuid', { type: 'server', message: error.message });
          setAttempt((value) => value + 1);
          return;
        }
        setServerError(`${error.message} Nothing was saved.`);
      }
    },
    () => {
      setAttempt((value) => value + 1);
    },
  );

  return (
    <Stack
      component="form"
      noValidate
      spacing={2}
      aria-label={`Bill To, ${lineLabel}`}
      onSubmit={(event: React.SyntheticEvent) => {
        event.preventDefault();
        void submit();
      }}
    >
      {stale && (
        <Alert
          severity="warning"
          action={
            <AppButton variant="text" onClick={onReload}>
              Reload latest
            </AppButton>
          }
        >
          Someone else changed this service since you opened it, so nothing was saved. Your choice is still selected.
          Reload latest to see their version (your choice will be replaced).
        </Alert>
      )}
      {serverError !== null && <InlineAlert severity="error">{serverError}</InlineAlert>}
      <ErrorSummary
        items={message ? [{ key: 'billedToContactUuid', label: LABEL, message }] : []}
        attempt={attempt}
        onSelect={focusField}
      />
      <DetailList
        columns={2}
        dense
        items={[
          { label: 'Billed to now', value: payerLabel(list, item.billedToContactUuid) },
          { label: 'How it was set', value: originLabel(item.billedPartyOrigin) },
        ]}
      />
      <Controller
        name="billedToContactUuid"
        control={control}
        render={({ field }) => (
          <AppSelect<string>
            label={LABEL}
            name={FIELD_NAME}
            options={list.map((party) => ({ value: party.contactUuid, label: partyLabel(party) }))}
            value={field.value === '' ? null : field.value}
            onChange={(value) => {
              field.onChange(value ?? '');
            }}
            onBlur={field.onBlur}
            error={message}
            emptyText="No one can be billed for this order."
            disabled={!editable || formState.isSubmitting}
            required
          />
        )}
      />
      <InlineAlert severity="info">
        {editable
          ? `Applies to this service only (${lineLabel}). ${BILL_TO_INDEPENDENT_TEXT}`
          : `Read-only for you on this service. ${BILL_TO_INDEPENDENT_TEXT}`}
      </InlineAlert>
      {editable && (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <AppButton type="submit" loading={formState.isSubmitting}>
            Save Bill To
          </AppButton>
        </Stack>
      )}
    </Stack>
  );
}
