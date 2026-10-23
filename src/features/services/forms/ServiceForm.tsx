/**
 * ServiceForm: create or edit one service instance with every Connect
 * control of its form (react-hook-form + zod).
 *
 * - Create always makes a NEW instance (the contract allows several of the
 *   same type on one order); one Idempotency-Key per form, so a retried
 *   submit can't create a duplicate, while a second intentional create
 *   (a new form) gets a new key.
 * - Success is shown only after the API returned the saved item.
 * - A 422 naming a field (`details.field`) is shown on that field; any other
 *   error is shown above the form and nothing is saved.
 * - An error summary lists every problem after a failed submit; unsaved
 *   edits are guarded on navigation and reload.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import {
  isApiError,
  type FormDefinition,
  type ServiceItem,
} from '@/shared/api';
import { AppButton } from '@/shared/components/basic';
import { LeavePageDialog } from '@/shared/components/composite';
import { ErrorSummary, InlineAlert, useToast } from '@/shared/components/feedback';
import { useDirtyGuard } from '@/shared/hooks/useDirtyGuard';
import { serviceApi } from '../data/serviceApi';
import {
  definedValues,
  formSchema,
  initialValues,
  keyForServerField,
  resolveFields,
  toAnswers,
  warnings,
} from './formLogic';
import type { FormSpec, FormValues } from './formSpecs';
import { ServiceFormFields } from './ServiceFormFields';

export interface ServiceFormProps {
  spec: FormSpec;
  definition: FormDefinition;
  /** null = create on `orderUuid`. */
  item: ServiceItem | null;
  orderUuid: string;
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

function focusField(key: string): void {
  const wrapper = document.getElementById(`field-${key}`);
  wrapper?.scrollIntoView({ block: 'center' });
  wrapper?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, [role="combobox"]')?.focus();
}

export function ServiceForm({ spec, definition, item, orderUuid }: ServiceFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fields = useMemo(() => resolveFields(spec, definition), [spec, definition]);
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [attempt, setAttempt] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  const form = useForm<FormValues>({
    defaultValues: initialValues(fields, item?.answers),
    resolver: zodResolver(formSchema(spec.key, fields)),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const { control, formState, handleSubmit, reset, setError, setValue } = form;
  const values = definedValues(useWatch({ control }));
  const blocker = useDirtyGuard(formState.isDirty && leaveTo === null);

  // Navigate only after the saved values were reset, so the dirty guard lets us go.
  useEffect(() => {
    if (leaveTo !== null && !formState.isDirty) void navigate(leaveTo, { replace: true });
  }, [leaveTo, formState.isDirty, navigate]);

  const summary = fields
    .map(({ spec: field, label }) => ({ key: field.key, label, message: formState.errors[field.key]?.message }))
    .filter((entry): entry is { key: string; label: string; message: string } => typeof entry.message === 'string');

  const submit = handleSubmit(
    async (submitted) => {
      setServerError(null);
      const answers = toAnswers(fields, submitted);
      try {
        if (item === null) {
          const created = await serviceApi.create(
            orderUuid,
            { sellableItemUuid: definition.service.uuid, answers },
            idempotencyKey,
          );
          reset(initialValues(fields, created.answers));
          showToast(`${definition.service.name} service created (line ${String(created.lineNumber)}).`, {
            severity: 'success',
          });
          setLeaveTo(ROUTES.serviceEdit(created.uuid));
        } else {
          const saved = await serviceApi.edit(item.uuid, { answers });
          reset(initialValues(fields, saved.answers));
          showToast(`${definition.service.name} service saved.`, { severity: 'success' });
        }
      } catch (error: unknown) {
        setAttempt((value) => value + 1);
        if (!isApiError(error)) {
          setServerError('Something went wrong. Nothing was saved. Try again.');
          return;
        }
        const fieldKey = error.kind === 'validation' ? keyForServerField(fields, error.problem?.details?.field) : undefined;
        if (fieldKey !== undefined) {
          setError(fieldKey, { type: 'server', message: error.message });
        } else {
          setServerError(`${error.message} Nothing was saved.`);
        }
      }
    },
    () => {
      setAttempt((value) => value + 1);
    },
  );

  return (
    <Box
      component="form"
      noValidate
      aria-label={`${definition.service.name} service form`}
      onSubmit={(event: React.SyntheticEvent) => {
        void submit(event);
      }}
      sx={{ display: 'grid', gap: 3 }}
    >
      {definition.evidence !== undefined && <InlineAlert severity="info">{definition.evidence}</InlineAlert>}
      {serverError !== null && <InlineAlert severity="error">{serverError}</InlineAlert>}
      <ErrorSummary items={summary} attempt={attempt} onSelect={focusField} />
      <ServiceFormFields
        formKey={spec.key}
        sections={spec.sections}
        fields={fields}
        values={values}
        control={control}
        errors={formState.errors}
        setValue={setValue}
        warnings={warnings(spec.key, values)}
        disabled={formState.isSubmitting}
      />
      <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
        <AppButton
          variant="text"
          onClick={() => {
            void navigate(-1);
          }}
          disabled={formState.isSubmitting}
        >
          Cancel
        </AppButton>
        <AppButton type="submit" loading={formState.isSubmitting}>
          {item === null ? `Create ${definition.service.name} service` : 'Save changes'}
        </AppButton>
      </Stack>
      <LeavePageDialog blocker={blocker} />
    </Box>
  );
}
