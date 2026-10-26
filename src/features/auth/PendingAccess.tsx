/**
 * Pending Access (IAM-005): signed in, but no role or tenant assigned yet.
 * No business features, no navigation into the workspace; only who is
 * signed in and a way to sign out (tenant spec D1.4, D3).
 */

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import { AppButton } from '@/shared/components/basic';
import { AuthLayout } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';

export function PendingAccess() {
  const { context, refresh, signOut } = useSession();
  return (
    <AuthLayout>
      <Stack spacing={2.5} component="section" aria-labelledby="pending-access-title">
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <HourglassEmptyOutlinedIcon color="warning" aria-hidden="true" />
          <Typography id="pending-access-title" variant="h2" component="h1">
            Access pending
          </Typography>
        </Stack>
        <Typography variant="body2">
          {context ? `${context.user.displayName}, you are signed in, ` : 'You are signed in, '}
          but no role or tenant is assigned to your account yet. Ask an administrator to grant access.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <AppButton variant="secondary" onClick={refresh}>
            Check again
          </AppButton>
          <AppButton variant="text" onClick={signOut}>
            Sign out
          </AppButton>
        </Stack>
      </Stack>
    </AuthLayout>
  );
}
