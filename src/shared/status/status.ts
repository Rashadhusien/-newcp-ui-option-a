/**
 * Status presentation: maps a status VALUE from the API to a chip label, an
 * icon and a semantic tone. It never decides which statuses exist or which
 * moves are allowed: statuses come from the API (`ServiceItem.status`) and
 * moves from `available-transitions` (handoff package v0.9; D-23).
 *
 * Known values: the V3 order-item summary vocabulary (16 codes, V3 docs
 * `orders.order_items.status`, D-17). Whether the API sends these or
 * workflow state codes is Q-B1, so any other value still renders: as a
 * humanised label with a neutral tone. Labels and tones below are
 * CANDIDATE_UNVERIFIED display choices, not business rules.
 *
 * UI components (StatusBadge) map tone -> theme tokens. Status is never
 * colour-only: StatusBadge always renders icon + label.
 */

import type { SvgIconComponent } from '@mui/icons-material';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import DesignServicesOutlinedIcon from '@mui/icons-material/DesignServicesOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import MarkunreadMailboxOutlinedIcon from '@mui/icons-material/MarkunreadMailboxOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';

/**
 * Six tones shared by every status:
 * - neutral: not started / unknown
 * - info: queued or informational stage
 * - primary: work actively in progress
 * - warning: waiting on a person (missing input, hold, approval)
 * - success: done / delivered
 * - error: cancelled or rejected
 */
export type StatusSemantic = 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'error';

export interface StatusPresentation {
  label: string;
  semantic: StatusSemantic;
  icon: SvgIconComponent;
  /** false = value not in the known vocabulary; shown with the neutral fallback. */
  known: boolean;
}

type KnownStatus = Omit<StatusPresentation, 'known'>;

const KNOWN_STATUS: Readonly<Record<string, KnownStatus>> = {
  draft: { label: 'Draft', semantic: 'neutral', icon: EditNoteOutlinedIcon },
  submitted: { label: 'Submitted', semantic: 'info', icon: InboxOutlinedIcon },
  pending_information: { label: 'Pending information', semantic: 'warning', icon: HourglassEmptyIcon },
  in_review: { label: 'In review', semantic: 'info', icon: FactCheckOutlinedIcon },
  confirmed: { label: 'Confirmed', semantic: 'info', icon: ThumbUpOutlinedIcon },
  in_design: { label: 'In design', semantic: 'primary', icon: DesignServicesOutlinedIcon },
  awaiting_approval: { label: 'Awaiting approval', semantic: 'warning', icon: PendingActionsOutlinedIcon },
  in_production: { label: 'In production', semantic: 'primary', icon: PrecisionManufacturingOutlinedIcon },
  quality_check: { label: 'Quality check', semantic: 'primary', icon: VerifiedOutlinedIcon },
  ready_to_ship: { label: 'Ready to ship', semantic: 'info', icon: Inventory2OutlinedIcon },
  shipped: { label: 'Shipped', semantic: 'success', icon: LocalShippingOutlinedIcon },
  delivered: { label: 'Delivered', semantic: 'success', icon: MarkunreadMailboxOutlinedIcon },
  completed: { label: 'Completed', semantic: 'success', icon: CheckCircleOutlineIcon },
  on_hold: { label: 'On hold', semantic: 'warning', icon: PauseCircleOutlineIcon },
  cancelled: { label: 'Cancelled', semantic: 'error', icon: CancelOutlinedIcon },
  not_indicated: { label: 'Not indicated', semantic: 'error', icon: BlockOutlinedIcon },
};

/** "pending_information" -> "Pending information"; "In Progress" stays as it is. */
export function humanizeStatus(value: string): string {
  const text = value.replace(/[_-]+/g, ' ').trim();
  return text === '' ? 'Unknown' : text.charAt(0).toUpperCase() + text.slice(1);
}

export function presentStatus(value: string): StatusPresentation {
  const known = Object.hasOwn(KNOWN_STATUS, value) ? KNOWN_STATUS[value] : undefined;
  if (known) return { ...known, known: true };
  return { label: humanizeStatus(value), semantic: 'neutral', icon: HelpOutlineIcon, known: false };
}
