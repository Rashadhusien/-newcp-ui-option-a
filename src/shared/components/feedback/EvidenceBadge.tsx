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
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import type { ApiEvidence } from '@/shared/api';

export interface EvidenceBadgeProps {
  evidence: ApiEvidence;
}

const DESCRIPTION: Record<ApiEvidence, string> = {
  MOCK: 'Mock data: nothing is saved to the New CP API.',
  INTEGRATED: 'Connected to the New CP API.',
  BLOCKED: 'Not available: the API contract has no endpoint for this yet.',
};

const ICON: Record<ApiEvidence, React.ReactElement> = {
  MOCK: <ScienceOutlinedIcon aria-hidden="true" />,
  INTEGRATED: <CloudDoneOutlinedIcon aria-hidden="true" />,
  BLOCKED: <BlockOutlinedIcon aria-hidden="true" />,
};

const COLOR = { MOCK: 'warning', INTEGRATED: 'success', BLOCKED: 'default' } as const satisfies Record<ApiEvidence, string>;

export function EvidenceBadge({ evidence }: EvidenceBadgeProps) {
  return (
    <Tooltip title={DESCRIPTION[evidence]}>
      <Chip
        size="small"
        variant="outlined"
        color={COLOR[evidence]}
        icon={ICON[evidence]}
        label={evidence}
        aria-label={`Data source: ${evidence}. ${DESCRIPTION[evidence]}`}
      />
    </Tooltip>
  );
}
