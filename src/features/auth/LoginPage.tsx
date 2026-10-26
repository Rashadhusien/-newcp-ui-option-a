/**
 * Sign-in page. Google sign-in is backend-driven and not available yet
 * (Q-B20, Q-B21): with the real API this page says so and offers nothing.
 * In mock mode it offers a mock identity (CS, OPS, ADMIN, FINANCE, QC,
 * PENDING) so the role differences can be shown; the picker is never
 * rendered with mocks off.
 *
 * A signed-in visitor is sent straight on; after sign-in the visitor
 * returns to the in-app page they asked for (AuthBoundary passes it), else
 * the report.
 */

import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { LoginRedirectState } from '@/app/AuthBoundary';
import { ROUTES } from '@/app/routes';
import { readApiConfig } from '@/shared/api';
import { AppButton, AppRadioGroup } from '@/shared/components/basic';
import { InlineAlert } from '@/shared/components/feedback';
import { AuthLayout } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { SESSION_BLOCKED_MESSAGE, safeReturnPath } from '@/shared/lib/session';
import { MOCK_IDENTITIES, MOCK_IDENTITY_LABEL, isMockIdentity, type MockIdentity } from '@/mocks/sessionFixtures';

const OPTIONS = MOCK_IDENTITIES.map((identity) => ({ value: identity, label: MOCK_IDENTITY_LABEL[identity] }));

export default function LoginPage() {
  const location = useLocation();
  const { state, signIn } = useSession();
  const [identity, setIdentity] = useState<MockIdentity>('CS');
  const destination = safeReturnPath((location.state as LoginRedirectState | null)?.from, ROUTES.reporting);
  const { useMocks } = readApiConfig();

  if (state.status === 'ready') return <Navigate to={destination} replace />;

  return (
    <AuthLayout>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h2" component="h1">
            Sign in to New CP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {useMocks
              ? 'Mock sign-in: choose who you are signed in as. Nothing is real or saved.'
              : 'Google sign-in is handled by the New CP server.'}
          </Typography>
        </Box>
        {useMocks ? (
          <>
            <AppRadioGroup
              label="Mock identity"
              name="mock-identity"
              options={OPTIONS}
              value={identity}
              onChange={(value) => {
                if (isMockIdentity(value)) setIdentity(value);
              }}
            />
            <AppButton
              fullWidth
              loading={state.status === 'loading'}
              onClick={() => {
                signIn(identity);
              }}
            >
              Sign in (mock)
            </AppButton>
          </>
        ) : (
          <InlineAlert severity="warning">{SESSION_BLOCKED_MESSAGE}</InlineAlert>
        )}
      </Stack>
    </AuthLayout>
  );
}
