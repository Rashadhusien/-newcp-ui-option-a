/**
 * Capability codes as small chips (read only, as the server sent them).
 */

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface CapabilityChipsProps {
  capabilities: readonly string[];
}

export function CapabilityChips({ capabilities }: CapabilityChipsProps) {
  if (capabilities.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No capabilities.
      </Typography>
    );
  }
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }} role="list" aria-label="Capabilities">
      {capabilities.map((code) => (
        <Chip key={code} size="small" variant="outlined" label={code} role="listitem" />
      ))}
    </Stack>
  );
}
