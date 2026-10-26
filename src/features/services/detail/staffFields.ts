/**
 * Staff (commercial) fields of one service instance: form values, the
 * usability checks, and the PATCH built from what actually changed.
 *
 * Only usability checks run here (CLAUDE.md "Forms"): quantity > 0 with at
 * most 3 decimals (contract `multipleOf: 0.001`, Q-B13); unit price a
 * decimal with at most 2 decimals (Q-B10). Whether a zero total needs a
 * reason is the server's decision (422 ZERO_CHARGE_REASON_REQUIRED on
 * `zeroChargeReasonCode`), so the reason is never forced here.
 * Redo, redo-of, pending reason and notes are cut for the demo (D-55).
 */

import { z } from 'zod';
import type { PatchServiceItem, ServiceItem } from '@/shared/api';

export interface StaffValues {
  quantity: string;
  unitPrice: string;
  isBillable: boolean;
  zeroChargeReasonCode: string;
  zeroChargeNote: string;
}

export type StaffField = keyof StaffValues;

export const STAFF_LABEL: Record<StaffField, string> = {
  quantity: 'Quantity',
  unitPrice: 'Unit price',
  isBillable: 'Billable (charged to the client)',
  zeroChargeReasonCode: 'Zero-charge reason',
  zeroChargeNote: 'Zero-charge note',
};

export const staffSchema = z.object({
  quantity: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,3})?$/, 'Enter a number with up to 3 decimals, for example 1 or 1.5.')
    .refine((value) => Number(value) > 0, 'Quantity must be more than 0.'),
  unitPrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount with up to 2 decimals, for example 18 or 18.50.'),
  isBillable: z.boolean(),
  zeroChargeReasonCode: z.string(),
  zeroChargeNote: z.string().max(255, 'Keep the note under 255 characters.'),
});

export function staffValuesOf(item: ServiceItem): StaffValues {
  return {
    quantity: String(item.quantity ?? 1),
    unitPrice: item.unitPrice ?? '',
    isBillable: item.isBillable,
    zeroChargeReasonCode: item.zeroChargeReasonCode ?? '',
    zeroChargeNote: item.zeroChargeNote ?? '',
  };
}

/** Only the fields the user changed; an emptied reason is sent as null (cleared). */
export function staffPatch(initial: StaffValues, values: StaffValues): PatchServiceItem {
  const patch: PatchServiceItem = {};
  if (Number(values.quantity) !== Number(initial.quantity)) patch.quantity = Number(values.quantity);
  if (values.unitPrice.trim() !== initial.unitPrice) patch.unitPrice = values.unitPrice.trim();
  if (values.isBillable !== initial.isBillable) patch.isBillable = values.isBillable;
  if (values.zeroChargeReasonCode !== initial.zeroChargeReasonCode) {
    patch.zeroChargeReasonCode = values.zeroChargeReasonCode === '' ? null : values.zeroChargeReasonCode;
  }
  if (values.zeroChargeNote !== initial.zeroChargeNote) patch.zeroChargeNote = values.zeroChargeNote;
  return patch;
}

/** Maps a server `details.field` to a form field, if it is one of ours. */
export function staffFieldOf(field: unknown): StaffField | null {
  return typeof field === 'string' && field in STAFF_LABEL ? (field as StaffField) : null;
}
