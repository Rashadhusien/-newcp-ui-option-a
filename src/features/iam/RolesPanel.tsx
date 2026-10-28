/**
 * Read-only list of roles with their capabilities.
 */

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { IamRoleSummary } from '@/shared/api';
import { SectionCard } from '@/shared/components/data-display';
import { EmptyState } from '@/shared/components/feedback';
import { CapabilityChips } from './CapabilityChips';

export interface RolesPanelProps {
  roles: readonly IamRoleSummary[];
}

export function RolesPanel({ roles }: RolesPanelProps) {
  if (roles.length === 0) return <EmptyState title="No roles" description="The server returned no roles." />;
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
      }}
    >
      {roles.map((role) => (
        <SectionCard key={role.roleId} title={`${role.name} (${role.code})`}>
          <Stack spacing={1.5}>
            {role.isSystem && <Chip size="small" label="System role" sx={{ alignSelf: 'flex-start' }} />}
            <Typography variant="caption" color="text.secondary">
              What this role can do
            </Typography>
            <CapabilityChips capabilities={role.capabilities} />
          </Stack>
        </SectionCard>
      ))}
    </Box>
  );
}
