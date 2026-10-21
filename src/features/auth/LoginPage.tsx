/**
 * Login placeholder: one mock sign-in button until Google login (A4).
 *
 * A signed-in visitor is sent straight on; after sign-in the visitor
 * returns to the page they asked for (AuthBoundary passes it), else the
 * report.
 */

import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { LoginRedirectState } from '@/app/AuthBoundary';
import { ROUTES } from '@/app/routes';
import { AppButton } from '@/shared/components/basic';
import { AuthLayout } from '@/shared/components/layout';
import { isAuthenticated, signIn } from '@/shared/lib/session';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requested = (location.state as LoginRedirectState | null)?.from;
  // Only in-app paths; never an external URL.
  const destination =
    requested?.startsWith('/') && !requested.startsWith('//') ? requested : ROUTES.reporting;

  if (isAuthenticated()) return <Navigate to={destination} replace />;

  return (
    <AuthLayout>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h2" component="h1">
            Sign in to New CP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Google sign-in arrives in a later task.
          </Typography>
        </Box>
        <AppButton
          fullWidth
          onClick={() => {
            signIn();
            void navigate(destination, { replace: true });
          }}
        >
          Sign in (mock)
        </AppButton>
      </Stack>
    </AuthLayout>
  );
}
