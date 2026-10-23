/**
 * EvidenceBadge: says whether the screen runs on mock data or the real API,
 * so a demo never passes mock results off as integrated ones (package
 * rule: visible MOCK vs INTEGRATED distinction). Icon + text, never colour
 * alone.
 */

import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import type { ApiEvidence } from '@/shared/api';

export interface EvidenceBadgeProps {
  evidence: ApiEvidence;
}

const DESCRIPTION: Record<ApiEvidence, string> = {
  MOCK: 'Mock data: nothing is saved to the New CP API.',
  INTEGRATED: 'Connected to the New CP API.',
};

export function EvidenceBadge({ evidence }: EvidenceBadgeProps) {
  const mock = evidence === 'MOCK';
  return (
    <Tooltip title={DESCRIPTION[evidence]}>
      <Chip
        size="small"
        variant="outlined"
        color={mock ? 'warning' : 'success'}
        icon={mock ? <ScienceOutlinedIcon aria-hidden="true" /> : <CloudDoneOutlinedIcon aria-hidden="true" />}
        label={evidence}
        aria-label={`Data source: ${evidence}. ${DESCRIPTION[evidence]}`}
      />
    </Tooltip>
  );
}
