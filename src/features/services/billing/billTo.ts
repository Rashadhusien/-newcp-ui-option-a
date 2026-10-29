/**
 * Bill To display helpers (F07). Roles and origins are the contract's enums
 * (`BilledPartyChoice.role`, `BilledPartyOrigin`); the labels are ours.
 */

import type { BilledPartyChoice, BilledPartyOrigin } from '@/shared/api';

export const BILL_TO_BLOCKED_TEXT =
  'Bill To is not available yet: the payer endpoint has not been checked live on the test server (F07 runtime unverified). Nothing is sent.';

export const BILL_TO_INDEPENDENT_TEXT = 'Independent of Billable: changing one never changes the other.';

const ROLE_LABEL: Record<BilledPartyChoice['role'], string> = {
  doctor: 'Doctor',
  scanning_center: 'Scanning Center',
};

const ORIGIN_LABEL: Record<BilledPartyOrigin, string> = {
  legacy_explicit: 'Set in the legacy data',
  order_default: 'Copied from the order default',
  manual_resolution: 'Resolved manually',
  user_selected: 'Chosen for this service',
  unresolved_legacy: 'Unresolved legacy payer',
};

export function partyLabel(party: BilledPartyChoice): string {
  return `${ROLE_LABEL[party.role]}: ${party.label}`;
}

/** The payer's label, or a short ID when it is not in the eligible list. */
export function payerLabel(parties: readonly BilledPartyChoice[], contactUuid: string): string {
  const party = parties.find((entry) => entry.contactUuid === contactUuid);
  return party ? partyLabel(party) : `Contact …${contactUuid.slice(-8)} (not in the eligible list)`;
}

export function originLabel(origin: BilledPartyOrigin): string {
  return ORIGIN_LABEL[origin];
}
