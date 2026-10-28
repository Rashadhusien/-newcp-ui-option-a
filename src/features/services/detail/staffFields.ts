/**
 * Staff (commercial) fields of one service instance: form values, the
 * usability checks, and the PATCH built from what actually changed.
 *
 * Only usability checks run here (CLAUDE.md "Forms"): quantity > 0 with at
 * most 3 decimals (contract `multipleOf: 0.001`, Q-B13); unit price a
 * decimal with at most 2 decimals (Q-B10). Whether a zero total needs a
 * reason is the server's decision (422 ZERO_CHARGE_REASON_REQUIRED on
 * `zeroChargeReasonCode`), so the reason is never forced here.
 *
 * Redo, redo-of, pending reason and service notes (A23): the canonical
 * contract returns all four on the item (Q-B18, D-79), so they start from
 * the saved values and only changes are sent. Redo-of is a uuid in PATCH and
 * cannot be sent empty, so clearing it sends nothing. The source attaches no
 * validator to them (v0.6 "No universal frontend validator proven"); redo-of
 * only gets the contract's uuid format as a usability check.
 */

import { z } from 'zod';
import type { PatchServiceItem, ServiceItem } from '@/shared/api';

export interface StaffValues {
  isRedo: boolean;
  redoOfItemUuid: string;
  pendingReason: string;
  serviceNotes: string;
  quantity: string;
  unitPrice: string;
  isBillable: boolean;
  zeroChargeReasonCode: string;
  zeroChargeNote: string;
}

export type StaffField = keyof StaffValues;

export const STAFF_LABEL: Record<StaffField, string> = {
  isRedo: 'Redo',
  redoOfItemUuid: 'Redo of (service instance ID)',
  pendingReason: 'Pending reason',
  serviceNotes: 'Service notes',
  quantity: 'Quantity',
  unitPrice: 'Unit price',
  isBillable: 'Billable (charged to the client)',
  zeroChargeReasonCode: 'Zero-charge reason',
  zeroChargeNote: 'Zero-charge note',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const staffSchema = z.object({
  isRedo: z.boolean(),
  redoOfItemUuid: z
    .string()
    .trim()
    .refine((value) => value === '' || UUID.test(value), 'Enter a service instance ID, for example 00000000-0000-0000-0000-000000000001.'),
  pendingReason: z.string(),
  serviceNotes: z.string(),
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
    isRedo: item.isRedo,
    redoOfItemUuid: item.redoOfItemUuid ?? '',
    pendingReason: item.pendingReason ?? '',
    serviceNotes: item.serviceNotes ?? '',
    quantity: String(item.quantity),
    unitPrice: item.unitPrice,
    isBillable: item.isBillable,
    zeroChargeReasonCode: item.zeroChargeReasonCode ?? '',
    zeroChargeNote: item.zeroChargeNote ?? '',
  };
}

/** Only the fields the user changed; an emptied reason is sent as null (cleared). */
export function staffPatch(initial: StaffValues, values: StaffValues): PatchServiceItem {
  const patch: PatchServiceItem = {};
  if (values.isRedo !== initial.isRedo) patch.isRedo = values.isRedo;
  const redoOf = values.redoOfItemUuid.trim();
  if (redoOf !== '' && redoOf !== initial.redoOfItemUuid) patch.redoOfItemUuid = redoOf;
  if (values.pendingReason.trim() !== initial.pendingReason) patch.pendingReason = values.pendingReason.trim();
  if (values.serviceNotes !== initial.serviceNotes) patch.serviceNotes = values.serviceNotes;
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
