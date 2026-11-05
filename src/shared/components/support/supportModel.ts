/**
 * Support request model (A17, ported from the earlier POC): topics,
 * priority, validation, the truthful status and the submission seam.
 *
 * There is no ticketing system or support API in New CP (the reference
 * contract has none), so the only transport is `notConnectedTransport`,
 * which always answers "not submitted". The panel shows "Submitted" only for
 * a real ticket id from a backend. Nothing is stored or logged. Topics are
 * dummy demo values.
 */

import { z } from 'zod';

export const SUPPORT_TOPICS = [
  { value: 'orders', label: 'Orders and services' },
  { value: 'status', label: 'Status, hold and history' },
  { value: 'pricing', label: 'Price, billing and Bill To' },
  { value: 'reports', label: 'Reports' },
  { value: 'access', label: 'Sign-in, roles and access' },
  { value: 'other', label: 'Something else' },
] as const;

export const SUPPORT_PRIORITIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'urgent', label: 'Urgent' },
] as const;

const TOPIC_VALUES: readonly string[] = SUPPORT_TOPICS.map((topic) => topic.value);

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

export const supportSchema = z.object({
  topic: z.string().refine((value) => TOPIC_VALUES.includes(value), 'Choose a topic.'),
  message: z
    .string()
    .trim()
    .min(1, 'Describe the problem.')
    .min(MESSAGE_MIN, `Add a little more detail (at least ${String(MESSAGE_MIN)} characters).`)
    .max(MESSAGE_MAX, `Keep it under ${String(MESSAGE_MAX)} characters.`),
  priority: z.enum(['standard', 'urgent']),
});

export type SupportFormValues = z.input<typeof supportSchema>;
export type SupportRequest = z.output<typeof supportSchema>;

export const EMPTY_SUPPORT_FORM: SupportFormValues = { topic: '', message: '', priority: 'standard' };

/** Status of this support interaction as the app knows it; the user never sets it. */
export type SupportStatus = 'draft' | 'submitting' | 'notSubmitted' | 'submitted';

export const STATUS_LABEL: Readonly<Record<SupportStatus, string>> = {
  draft: 'Draft, not submitted',
  submitting: 'Submitting',
  notSubmitted: 'Not submitted',
  submitted: 'Submitted',
};

export type SupportResult = { ok: true; ticketId: string } | { ok: false; message: string };
export type SupportTransport = (request: SupportRequest) => Promise<SupportResult>;

/** No ticketing backend exists: nothing is sent, and the result says so. */
export const notConnectedTransport: SupportTransport = () =>
  Promise.resolve({
    ok: false,
    message: 'Online submission is not connected in this demo, so your request was not sent or saved.',
  });

/** Runs a transport; a thrown error or a missing ticket id is a failure, never a success. */
export async function submitSupportRequest(
  transport: SupportTransport,
  request: SupportRequest,
): Promise<SupportResult> {
  try {
    const result = await transport(request);
    if (result.ok && result.ticketId.trim() === '') {
      return { ok: false, message: 'The support service returned no ticket number, so the request is not confirmed.' };
    }
    return result;
  } catch {
    return { ok: false, message: 'The support service could not be reached. Your request was not sent.' };
  }
}
