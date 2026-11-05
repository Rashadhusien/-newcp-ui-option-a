/**
 * Support request form (A17, from the earlier POC): Topic, Message,
 * Priority and a read-only Status. Validation on submit, then on change. A
 * failed or unavailable submission keeps the text and says it was not sent;
 * "Submitted" needs a ticket number from a backend (there is none).
 */

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { AppButton, AppRadioGroup, AppSelect, AppTextField } from '@/shared/components/basic';
import {
  EMPTY_SUPPORT_FORM,
  MESSAGE_MAX,
  STATUS_LABEL,
  SUPPORT_PRIORITIES,
  SUPPORT_TOPICS,
  notConnectedTransport,
  submitSupportRequest,
  supportSchema,
  type SupportFormValues,
  type SupportRequest,
  type SupportResult,
  type SupportStatus,
  type SupportTransport,
} from './supportModel';

export interface SupportFormProps {
  transport?: SupportTransport;
  /** Focus the topic when the form mounts (first open of the panel). */
  focusOnMount?: boolean;
}

function StatusChip({ status }: { status: SupportStatus }) {
  const icon =
    status === 'submitted' ? (
      <TaskAltOutlinedIcon aria-hidden="true" />
    ) : status === 'notSubmitted' ? (
      <ReportProblemOutlinedIcon aria-hidden="true" />
    ) : (
      <EditNoteOutlinedIcon aria-hidden="true" />
    );
  const color = status === 'submitted' ? 'success' : status === 'notSubmitted' ? 'warning' : 'default';
  return <Chip size="small" variant="outlined" color={color} icon={icon} label={STATUS_LABEL[status]} />;
}

export function SupportForm({ transport = notConnectedTransport, focusOnMount = false }: SupportFormProps) {
  const rootRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<SupportStatus>('draft');
  const [result, setResult] = useState<SupportResult | null>(null);
  const { control, handleSubmit, reset, formState } = useForm<SupportFormValues, unknown, SupportRequest>({
    resolver: zodResolver(supportSchema),
    defaultValues: EMPTY_SUPPORT_FORM,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (focusOnMount) rootRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
  }, [focusOnMount]);

  const submit = handleSubmit(async (request) => {
    setStatus('submitting');
    setResult(null);
    const answer = await submitSupportRequest(transport, request);
    setResult(answer);
    if (answer.ok) {
      setStatus('submitted');
      reset(EMPTY_SUPPORT_FORM);
    } else {
      setStatus('notSubmitted');
    }
  });

  return (
    <Stack
      component="form"
      ref={rootRef}
      noValidate
      spacing={2.5}
      onSubmit={(event: React.SyntheticEvent) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Typography variant="body2" color="text.secondary">
        No ticketing system is connected to this demo: nothing you write here is sent or stored. Please leave out patient
        names and other personal data.
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Status
        </Typography>
        <StatusChip status={status} />
      </Stack>
      <Controller
        name="topic"
        control={control}
        render={({ field, fieldState }) => (
          <AppSelect<string>
            label="Topic"
            name="support-topic"
            required
            options={SUPPORT_TOPICS.map((topic) => ({ value: topic.value, label: topic.label }))}
            value={field.value === '' ? null : field.value}
            onChange={(value) => {
              field.onChange(value ?? '');
            }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="message"
        control={control}
        render={({ field, fieldState }) => (
          <AppTextField
            label="Message"
            name="support-message"
            required
            multiline
            minRows={4}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            helperText={`What happened, where, and what you expected. Up to ${String(MESSAGE_MAX)} characters.`}
          />
        )}
      />
      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <AppRadioGroup
            label="Priority"
            name="support-priority"
            options={SUPPORT_PRIORITIES}
            value={field.value}
            onChange={field.onChange}
            helperText="Urgent: work is blocked or a patient appointment is affected."
          />
        )}
      />
      {result !== null && !result.ok && (
        <Alert severity="warning">{result.message} Your text is still here.</Alert>
      )}
      {result?.ok === true && <Alert severity="success">Request submitted. Ticket {result.ticketId}.</Alert>}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <AppButton
          variant="text"
          disabled={status === 'submitting' || (!formState.isDirty && result === null)}
          onClick={() => {
            reset(EMPTY_SUPPORT_FORM);
            setStatus('draft');
            setResult(null);
          }}
        >
          Discard draft
        </AppButton>
        <AppButton type="submit" loading={status === 'submitting'}>
          Submit request
        </AppButton>
      </Stack>
      <Stack spacing={0.5} component="section" aria-label="Contact support directly">
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
          Contact support directly
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Email and phone support are not configured for this build.
        </Typography>
      </Stack>
    </Stack>
  );
}
