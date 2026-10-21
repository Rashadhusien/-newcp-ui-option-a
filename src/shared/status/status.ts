/**
 * Status presentation: the ONLY place that maps a service status to a
 * human label and a semantic tone. Never hard-code a status string
 * elsewhere.
 *
 * UI components (StatusBadge) map tone -> theme tokens. Status is never
 * color-only: StatusBadge always renders icon + label.
 *
 * Statuses are provisional (docs/PLAN.md section 4). Tones are
 * [NEEDS VERIFICATION] until Q2 is answered (docs/DEVIATIONS.md D-2).
 * The full mapping with icons and per-service transitions comes in A2.4.
 */

/**
 * Six tones shared by every status:
 * - neutral: not started / inactive
 * - info: queued or informational stage
 * - primary: work actively in progress
 * - warning: waiting on a person (missing input)
 * - success: done / ready
 * - error: failed or blocked
 */
export type StatusSemantic = 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'error';

export interface StatusMeta {
  label: string;
  semantic: StatusSemantic;
}

const STATUS_META = {
  // Models (provisional): Awaiting Models -> On its way -> In Progress -> Done
  'Awaiting Models': { label: 'Awaiting Models', semantic: 'warning' },
  'On its way': { label: 'On its way', semantic: 'info' },
  'In Progress': { label: 'In Progress', semantic: 'primary' },
  Done: { label: 'Done', semantic: 'success' },
  // Conversion (provisional): No Scans -> In Progress -> Download
  'No Scans': { label: 'No Scans', semantic: 'warning' },
  Download: { label: 'Download', semantic: 'success' },
} as const satisfies Record<string, StatusMeta>;

export type StatusValue = keyof typeof STATUS_META;

export function getStatusPresentation(status: StatusValue): StatusMeta {
  return STATUS_META[status];
}
