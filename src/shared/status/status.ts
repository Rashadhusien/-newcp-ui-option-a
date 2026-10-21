/**
 * Status presentation: the ONLY place that names a service status and maps
 * it to a label, an icon and a semantic tone. Never hard-code a status
 * string elsewhere.
 *
 * UI components (StatusBadge) map tone -> theme tokens. Status is never
 * color-only: StatusBadge always renders icon + label.
 *
 * Statuses are provisional (docs/PLAN.md section 4) and keyed by their
 * display label. The wire values, the initial status and the permitted
 * transitions are [NEEDS VERIFICATION] until the OpenAPI contract and Q2
 * are answered (docs/DEVIATIONS.md D-9, D-11). The `order` below is the
 * order PLAN lists them in, used for filters and sorting only; it is NOT a
 * transition rule.
 */

import type { SvgIconComponent } from '@mui/icons-material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

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
  icon: SvgIconComponent;
}

export type ServiceType = 'models' | 'conversion';

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  models: 'Models',
  conversion: 'Conversion',
};

const MODELS_STATUS = {
  'Awaiting Models': { label: 'Awaiting Models', semantic: 'warning', icon: HourglassEmptyIcon },
  'On its way': { label: 'On its way', semantic: 'info', icon: LocalShippingOutlinedIcon },
  'In Progress': { label: 'In Progress', semantic: 'primary', icon: AutorenewIcon },
  Done: { label: 'Done', semantic: 'success', icon: CheckCircleOutlineIcon },
} as const satisfies Record<string, StatusMeta>;

const CONVERSION_STATUS = {
  'No Scans': { label: 'No Scans', semantic: 'warning', icon: CloudOffOutlinedIcon },
  'In Progress': { label: 'In Progress', semantic: 'primary', icon: AutorenewIcon },
  Download: { label: 'Download', semantic: 'success', icon: DownloadOutlinedIcon },
} as const satisfies Record<string, StatusMeta>;

export type ModelsStatus = keyof typeof MODELS_STATUS;
export type ConversionStatus = keyof typeof CONVERSION_STATUS;

export interface StatusByService {
  models: ModelsStatus;
  conversion: ConversionStatus;
}

export type StatusValue = StatusByService[ServiceType];

const STATUS_META: { [S in ServiceType]: Record<StatusByService[S], StatusMeta> } = {
  models: MODELS_STATUS,
  conversion: CONVERSION_STATUS,
};

/** Statuses of one service type, in the order PLAN lists them. */
export const STATUS_ORDER: { [S in ServiceType]: readonly StatusByService[S][] } = {
  models: ['Awaiting Models', 'On its way', 'In Progress', 'Done'],
  conversion: ['No Scans', 'In Progress', 'Download'],
};

export function getStatusPresentation<S extends ServiceType>(
  service: S,
  status: StatusByService[S],
): StatusMeta {
  return STATUS_META[service][status];
}

/** Narrows an untrusted value (e.g. from the API) to a known status of the service. */
export function isStatusOf<S extends ServiceType>(
  service: S,
  value: unknown,
): value is StatusByService[S] {
  return typeof value === 'string' && Object.hasOwn(STATUS_META[service], value);
}
