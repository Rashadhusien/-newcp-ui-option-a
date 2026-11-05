/**
 * On Hold dialog (Q-B9): a move into `on_hold` needs a hold type
 * (customer/internal) and one reason for that type from
 * `GET /catalog/hold-reasons?holdType=`; both travel in the SAME transition
 * request, so the service never sits on hold without a reason. The reasons
 * are synthetic and labelled "Demo only". The parent mounts it only while
 * open, so every opening starts empty.
 */

import { useEffect, useState } from 'react';
import { isApiError, type HoldReasonOption, type HoldType } from '@/shared/api';
import { AppRadioGroup, AppSelect } from '@/shared/components/basic';
import { FormDialog } from '@/shared/components/composite';
import { InlineAlert } from '@/shared/components/feedback';
import { serviceApi } from '../data/serviceApi';

export interface HoldDialogProps {
  open: boolean;
  /** Line label for the title, e.g. "line 2". */
  lineLabel: string;
  loading: boolean;
  /** Server error from the transition, if it failed. */
  error: string | null;
  onSubmit: (holdType: HoldType, holdReasonCode: string) => void;
  onClose: () => void;
}

const HOLD_TYPES = [
  { value: 'customer', label: 'Customer hold (waiting for the customer)' },
  { value: 'internal', label: 'Internal hold (waiting on 3DDX)' },
] as const;

function isHoldType(value: string): value is HoldType {
  return value === 'customer' || value === 'internal';
}

export function HoldDialog({ open, lineLabel, loading, error, onSubmit, onClose }: HoldDialogProps) {
  const [holdType, setHoldType] = useState<HoldType | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [reasons, setReasons] = useState<HoldReasonOption[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [reasonsError, setReasonsError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (holdType === null) return;
    let active = true;
    serviceApi.holdReasons(holdType).then(
      (list) => {
        if (!active) return;
        setReasons(list.filter((reason) => reason.holdType === undefined || reason.holdType === holdType));
        setReasonsLoading(false);
      },
      (failure: unknown) => {
        if (!active) return;
        setReasons([]);
        setReasonsError(isApiError(failure) ? failure.message : 'Hold reasons could not be loaded.');
        setReasonsLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [holdType]);

  return (
    <FormDialog
      open={open}
      title={`Put ${lineLabel} on hold`}
      description="Choose why the service is on hold. The type and reason are saved together with the status."
      submitLabel="Put on hold"
      loading={loading}
      error={error}
      onClose={onClose}
      onSubmit={() => {
        setTried(true);
        if (holdType !== null && reasonCode !== null) onSubmit(holdType, reasonCode);
      }}
    >
      <InlineAlert severity="info">Demo only: these hold reasons are synthetic, not real reasons.</InlineAlert>
      <AppRadioGroup
        label="Hold type"
        name="hold-type"
        options={HOLD_TYPES}
        value={holdType ?? ''}
        onChange={(value) => {
          if (!isHoldType(value)) return;
          setHoldType(value);
          setReasonCode(null);
          setReasonsError(null);
          setReasonsLoading(true);
        }}
        error={tried && holdType === null ? 'Choose a hold type.' : undefined}
        required
      />
      <AppSelect<string>
        label="Hold reason (Demo only)"
        name="hold-reason"
        options={reasons.map((reason) => ({
          value: reason.code,
          label: reason.label,
        }))}
        value={reasonCode}
        onChange={setReasonCode}
        loading={reasonsLoading}
        emptyText={holdType === null ? 'Choose a hold type first' : 'No reasons for this type'}
        error={reasonsError ?? (tried && reasonCode === null ? 'Choose a hold reason.' : undefined)}
        required
      />
    </FormDialog>
  );
}
