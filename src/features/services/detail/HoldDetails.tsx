/**
 * The active hold of one instance (Q-B18, D-79): hold type and the reason's
 * label from `GET /catalog/hold-reasons?holdType=`. Falls back to the
 * reason code when the list cannot be read; synthetic reasons say "Demo
 * only" in their own label.
 */

import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import type { HoldType } from '@/shared/api';
import { serviceApi } from '../data/serviceApi';

export interface HoldDetailsProps {
  holdType: HoldType;
  holdReasonCode: string | null;
}

const TYPE_LABEL: Record<HoldType, string> = { customer: 'Customer hold', internal: 'Internal hold' };

export function HoldDetails({ holdType, holdReasonCode }: HoldDetailsProps) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (holdReasonCode === null) return;
    let active = true;
    serviceApi.holdReasons(holdType).then(
      (reasons) => {
        if (active) setLabel(reasons.find((reason) => reason.code === holdReasonCode)?.label ?? null);
      },
      () => {
        // The code is still shown; the label is a convenience.
      },
    );
    return () => {
      active = false;
    };
  }, [holdType, holdReasonCode]);

  const reason = holdReasonCode === null ? 'no reason given' : (label ?? holdReasonCode);
  return <Typography variant="body2">{`${TYPE_LABEL[holdType]}: ${reason}`}</Typography>;
}
