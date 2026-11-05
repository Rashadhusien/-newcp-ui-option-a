/**
 * Staff fields of ONE service instance (A7R.2, A23): Redo, redo-of,
 * pending reason and service notes; quantity, unit price override, Billable
 * and zero-charge reason/note. Saved together with If-Match. Bill To has
 * its own section and save (BillToSection), so Billable and Bill To never
 * change each other.
 *
 * - A field is editable only when the item allows it (`canEditPrice`,
 *   `canEditBillability`) and the session has the capability; otherwise it
 *   is read-only with the reason. Display only: the server decides (403).
 * - Only changed fields are sent. 412: nothing saved, the user's values
 *   stay, "Reload latest" offered. 422 with `details.field`: error on that
 *   field (e.g. ZERO_CHARGE_REASON_REQUIRED). 409/403/other: above the form.
 * - Currency and rush are read-only (Q-B2); rush is not in the contract.
 * - Redo-of and pending reason come back on the item (Q-B18, D-79).
 * - An invoiced line locks quantity, unit price and Billable (the server
 *   answers 422/409); the money breakdown is read-only.
 * - Success is shown only after the API returned the saved item.
 */

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { can, isApiError, type ServiceItem, type ZeroChargeReason } from '@/shared/api';
import { AppButton, AppCheckbox, AppSelect, AppTextField } from '@/shared/components/basic';
import { DetailList } from '@/shared/components/data-display';
import { ErrorSummary, InlineAlert, useToast, type SummaryItem } from '@/shared/components/feedback';
import { useSession } from '@/shared/hooks/useSession';
import { serviceApi } from '../data/serviceApi';
import {
  STAFF_LABEL,
  staffFieldOf,
  staffPatch,
  staffSchema,
  staffValuesOf,
  type StaffField,
  type StaffValues,
} from './staffFields';

export interface StaffFieldsFormProps {
  item: ServiceItem;
  etag: string;
  /** Called after a successful save, to reload the instance. */
  onSaved: () => void;
  /** Reloads the latest version (after a 412). */
  onReload: () => void;
}

const FIELD_ID = (field: StaffField) => `staff-${field}`;

function focusField(key: string): void {
  const input = document.querySelector<HTMLElement>(`[name="${FIELD_ID(key as StaffField)}"]`);
  const root = input?.closest<HTMLElement>('.MuiFormControl-root') ?? input?.parentElement;
  root?.scrollIntoView({ block: 'center' });
  root?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, [role="combobox"]')?.focus();
}

export function StaffFieldsForm({ item, etag, onSaved, onReload }: StaffFieldsFormProps) {
  const { context } = useSession();
  const { showToast } = useToast();
  const initial = staffValuesOf(item);
  const [reasons, setReasons] = useState<ZeroChargeReason[]>([]);
  const [reasonsError, setReasonsError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const canUpdate = can(context, 'service.update');
  const editable: Record<StaffField, boolean> = {
    isRedo: canUpdate,
    redoOfItemUuid: canUpdate,
    pendingReason: canUpdate,
    serviceNotes: canUpdate,
    quantity: canUpdate && !item.isInvoiced,
    unitPrice: item.canEditPrice && !item.isInvoiced && can(context, 'service.price.override'),
    isBillable: item.canEditBillability && !item.isInvoiced && can(context, 'service.billing.is_billable.edit'),
    zeroChargeReasonCode: can(context, 'service.zero_charge_reason.edit'),
    zeroChargeNote: can(context, 'service.zero_charge_reason.edit'),
  };
  const anyEditable = Object.values(editable).some(Boolean);

  const { control, formState, handleSubmit, setError } = useForm<StaffValues>({
    defaultValues: initial,
    resolver: zodResolver(staffSchema),
  });

  useEffect(() => {
    let active = true;
    serviceApi.zeroChargeReasons().then(
      (list) => {
        if (active) setReasons(list.filter((reason) => reason.active));
      },
      (error: unknown) => {
        if (active) setReasonsError(isApiError(error) ? error.message : 'Zero-charge reasons could not be loaded.');
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const summary: SummaryItem[] = (Object.keys(STAFF_LABEL) as StaffField[]).flatMap((field) => {
    const message = formState.errors[field]?.message;
    return message ? [{ key: field, label: STAFF_LABEL[field], message }] : [];
  });

  const submit = handleSubmit(
    async (values) => {
      setStale(false);
      setServerError(null);
      const patch = staffPatch(initial, values);
      if (Object.keys(patch).length === 0) {
        showToast('Nothing changed.', { severity: 'info' });
        return;
      }
      try {
        await serviceApi.edit(item.uuid, patch, etag);
        showToast(`Line ${String(item.lineNumber)} saved.`, {
          severity: 'success',
        });
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
        const field = staffFieldOf(error.problem?.details?.field);
        if (error.kind === 'validation' && field) {
          setError(field, { type: 'server', message: error.message });
          setAttempt((value) => value + 1);
          return;
        }
        setServerError(error.message);
      }
    },
    () => {
      setAttempt((value) => value + 1);
    },
  );

  const lockedByInvoice = (field: StaffField) =>
    item.isInvoiced && (field === 'quantity' || field === 'unitPrice' || field === 'isBillable');
  const readOnlyNote = (field: StaffField) => {
    if (editable[field]) return undefined;
    return lockedByInvoice(field) ? 'Locked: this service is invoiced.' : 'Read-only for your role.';
  };

  return (
    <Stack
      component="form"
      noValidate
      spacing={2}
      aria-label={`Staff fields, line ${String(item.lineNumber)}`}
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
          Someone else changed this service since you opened it, so nothing was saved. Your values are still in the
          form. Reload latest to see their version (your values will be replaced).
        </Alert>
      )}
      {serverError !== null && <InlineAlert severity="error">{serverError}</InlineAlert>}
      <ErrorSummary items={summary} attempt={attempt} onSelect={focusField} />
      <Typography variant="subtitle2" component="h3">
        Production
      </Typography>
      <Controller
        name="isRedo"
        control={control}
        render={({ field }) => (
          <AppCheckbox
            label={STAFF_LABEL.isRedo}
            name={FIELD_ID('isRedo')}
            checked={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            helperText={readOnlyNote('isRedo') ?? 'This service remakes an earlier one.'}
            disabled={!editable.isRedo || formState.isSubmitting}
          />
        )}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Controller
          name="redoOfItemUuid"
          control={control}
          render={({ field, fieldState }) => (
            <AppTextField
              label={STAFF_LABEL.redoOfItemUuid}
              name={FIELD_ID('redoOfItemUuid')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              helperText={readOnlyNote('redoOfItemUuid') ?? 'The service instance this one remakes.'}
              disabled={!editable.redoOfItemUuid || formState.isSubmitting}
            />
          )}
        />
        <Controller
          name="pendingReason"
          control={control}
          render={({ field, fieldState }) => (
            <AppTextField
              label={STAFF_LABEL.pendingReason}
              name={FIELD_ID('pendingReason')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              helperText={readOnlyNote('pendingReason') ?? 'Why this service waits for information.'}
              disabled={!editable.pendingReason || formState.isSubmitting}
            />
          )}
        />
      </Stack>
      <Controller
        name="serviceNotes"
        control={control}
        render={({ field, fieldState }) => (
          <AppTextField
            label={STAFF_LABEL.serviceNotes}
            name={FIELD_ID('serviceNotes')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            helperText={readOnlyNote('serviceNotes') ?? 'Internal: for staff, not for the client.'}
            disabled={!editable.serviceNotes || formState.isSubmitting}
            multiline
            minRows={2}
          />
        )}
      />
      <Typography variant="subtitle2" component="h3">
        Charges
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Controller
          name="quantity"
          control={control}
          render={({ field, fieldState }) => (
            <AppTextField
              label={STAFF_LABEL.quantity}
              name={FIELD_ID('quantity')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              helperText={readOnlyNote('quantity') ?? 'More than 0; decimals allowed.'}
              disabled={!editable.quantity || formState.isSubmitting}
              required
            />
          )}
        />
        <Controller
          name="unitPrice"
          control={control}
          render={({ field, fieldState }) => (
            <AppTextField
              label={`${STAFF_LABEL.unitPrice} (${item.currencyCode})`}
              name={FIELD_ID('unitPrice')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              helperText={readOnlyNote('unitPrice') ?? 'Contract price; change it only to override.'}
              disabled={!editable.unitPrice || formState.isSubmitting}
              required
            />
          )}
        />
      </Stack>
      <Controller
        name="isBillable"
        control={control}
        render={({ field }) => (
          <AppCheckbox
            label={STAFF_LABEL.isBillable}
            name={FIELD_ID('isBillable')}
            checked={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            helperText={readOnlyNote('isBillable') ?? 'Independent of Bill To: changing one never changes the other.'}
            disabled={!editable.isBillable || formState.isSubmitting}
          />
        )}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Controller
          name="zeroChargeReasonCode"
          control={control}
          render={({ field, fieldState }) => (
            <AppSelect<string>
              label={`${STAFF_LABEL.zeroChargeReasonCode} (mock list)`}
              name={FIELD_ID('zeroChargeReasonCode')}
              options={[
                { value: '', label: 'None' },
                ...reasons.map((reason) => ({
                  value: reason.code,
                  label: reason.label,
                })),
              ]}
              value={field.value === '' ? null : field.value}
              onChange={(value) => {
                field.onChange(value ?? '');
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message ?? reasonsError ?? undefined}
              disabled={!editable.zeroChargeReasonCode || formState.isSubmitting}
            />
          )}
        />
        <Controller
          name="zeroChargeNote"
          control={control}
          render={({ field, fieldState }) => (
            <AppTextField
              label={STAFF_LABEL.zeroChargeNote}
              name={FIELD_ID('zeroChargeNote')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              helperText={readOnlyNote('zeroChargeNote') ?? 'Needed only when the final total is zero.'}
              disabled={!editable.zeroChargeNote || formState.isSubmitting}
            />
          )}
        />
      </Stack>
      <DetailList
        columns={3}
        dense
        items={[
          // Money breakdown from the server (D-79): lineTotal = unit price x quantity + fields - discount - voucher.
          { label: 'Field surcharges', value: `${item.fieldsAmount} ${item.currencyCode}` },
          { label: 'Discount', value: `${item.discountAmount} ${item.currencyCode}` },
          { label: 'Voucher', value: `${item.voucherAmount} ${item.currencyCode}` },
          { label: 'Line total', value: `${item.lineTotal} ${item.currencyCode}` },
          { label: 'Currency (read-only)', value: item.currencyCode },
          {
            label: 'Rush (read-only)',
            value: 'Not in the API contract (Q-B2)',
          },
        ]}
      />
      {anyEditable && (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <AppButton type="submit" loading={formState.isSubmitting}>
            Save staff fields
          </AppButton>
        </Stack>
      )}
    </Stack>
  );
}
