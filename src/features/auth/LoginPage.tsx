/**
 * Sign-in page (A25, backend Auth implementation, D-67; IAM v0.9.7).
 *
 * One primary action: "Sign in with Google". Google Identity Services gives
 * a Google ID token, which goes once to `POST /api/v1/auth/login`; the New CP
 * session token that comes back is kept in memory and sent as a Bearer token.
 * The page never asks for an email, password or workstation and never lets
 * the user choose a role or tenant: the server decides access.
 *
 * States: Google loading, Google failure, signing in, authorized (go on to
 * the requested in-app page), Pending Access, session expired (401), access
 * denied (403), not configured (BLOCKED: no Google client ID, Q-B28).
 *
 * Mock mode: Google is simulated (nothing is sent to Google) and the mock
 * identity stands in for the server's answer (G18). `?fail=google` or
 * `?fail=403` on this page shows the failure and denied states.
 */

import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
import type { LoginRedirectState } from '@/app/AuthBoundary';
import { ROUTES } from '@/app/routes';
import { isApiError, loginWithGoogleIdToken, readApiConfig, readGoogleClientId } from '@/shared/api';
import { AppButton, AppRadioGroup } from '@/shared/components/basic';
import { EvidenceBadge, InlineAlert } from '@/shared/components/feedback';
import { AuthLayout } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { safeReturnPath } from '@/shared/lib/session';
import { MOCK_IDENTITIES, MOCK_IDENTITY_LABEL, isMockIdentity, type MockIdentity } from '@/mocks/sessionFixtures';
import { renderGoogleButton } from './googleIdentity';

const OPTIONS = MOCK_IDENTITIES.map((identity) => ({ value: identity, label: MOCK_IDENTITY_LABEL[identity] }));
const GOOGLE_BUTTON_WIDTH = 320;
/** Simulated Google round trip in mock mode (ms), so the loading state is visible. */
const MOCK_GOOGLE_DELAY = 700;

type Phase =
  | { kind: 'idle' }
  | { kind: 'googleLoading' }
  | { kind: 'signingIn' }
  | { kind: 'googleFailed'; message: string }
  | { kind: 'denied'; message: string }
  | { kind: 'pending' }
  | { kind: 'error'; message: string };

function failParam(): string | null {
  return new URLSearchParams(window.location.search).get('fail');
}

export default function LoginPage() {
  const location = useLocation();
  const { state, signIn, signInWithSession } = useSession();
  const { mode, systemMode } = useColorScheme();
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  const { useMocks, baseUrl } = readApiConfig();
  const clientId = useMocks ? null : readGoogleClientId();
  const destination = safeReturnPath((location.state as LoginRedirectState | null)?.from, ROUTES.home);
  const [identity, setIdentity] = useState<MockIdentity>('CS');
  const [phase, setPhase] = useState<Phase>(() =>
    !useMocks && readGoogleClientId() !== null ? { kind: 'googleLoading' } : { kind: 'idle' },
  );
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  // Real API: render Google's button once GIS has loaded.
  useEffect(() => {
    const parent = googleButtonRef.current;
    if (useMocks || clientId === null || !parent) return;
    let active = true;
    parent.replaceChildren();
    renderGoogleButton(parent, {
      clientId,
      dark,
      width: GOOGLE_BUTTON_WIDTH,
      onFailure: () => {
        setPhase({ kind: 'googleFailed', message: 'Google did not return a sign-in. Try again.' });
      },
      onIdToken: (idToken) => {
        setPhase({ kind: 'signingIn' });
        loginWithGoogleIdToken(baseUrl, idToken).then(signInWithSession, (error: unknown) => {
          if (isApiError(error) && error.kind === 'accessNotAssigned') setPhase({ kind: 'pending' });
          else if (isApiError(error) && (error.kind === 'forbidden' || error.kind === 'unauthorized')) {
            setPhase({ kind: 'denied', message: error.message });
          } else setPhase({ kind: 'error', message: isApiError(error) ? error.message : 'Sign-in failed. Try again.' });
        });
      },
    }).then(
      () => {
        if (active) setPhase((current) => (current.kind === 'googleLoading' ? { kind: 'idle' } : current));
      },
      () => {
        if (active) setPhase({ kind: 'googleFailed', message: 'Google sign-in could not be loaded. Check the connection and try again.' });
      },
    );
    return () => {
      active = false;
    };
  }, [useMocks, clientId, dark, baseUrl, signInWithSession]);

  if (state.status === 'ready') return <Navigate to={destination} replace />;

  const mockGoogleSignIn = () => {
    setPhase({ kind: 'signingIn' });
    window.setTimeout(() => {
      const fail = failParam();
      if (fail === 'google') setPhase({ kind: 'googleFailed', message: 'Google sign-in was cancelled or failed (mock). Try again.' });
      else if (fail === '403') setPhase({ kind: 'denied', message: 'You do not have access to New CP (mock 403).' });
      else signIn(identity);
    }, MOCK_GOOGLE_DELAY);
  };

  const busy = phase.kind === 'signingIn' || state.status === 'loading';
  const expired = state.status === 'signedOut' && state.reason === 'expired' && phase.kind === 'idle';

  return (
    <AuthLayout>
      <Stack spacing={2.5}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h2" component="h1">
              Sign in to New CP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use your 3D Diagnostix Google account. Access is checked by the New CP server for every request.
            </Typography>
          </Box>
          {useMocks && <EvidenceBadge evidence="MOCK" />}
        </Stack>

        {expired && <InlineAlert severity="warning">Your session has ended. Sign in again to continue.</InlineAlert>}
        {phase.kind === 'googleFailed' && <InlineAlert severity="error">{phase.message}</InlineAlert>}
        {phase.kind === 'denied' && (
          <InlineAlert severity="error">{`Access denied. ${phase.message}`}</InlineAlert>
        )}
        {phase.kind === 'error' && <InlineAlert severity="error">{phase.message}</InlineAlert>}
        {phase.kind === 'pending' && (
          <InlineAlert severity="info">
            Your account is authenticated, but access has not been assigned yet. Ask an administrator to grant access.
          </InlineAlert>
        )}

        {useMocks ? (
          <>
            <AppButton fullWidth startIcon={<GoogleIcon />} loading={busy} onClick={mockGoogleSignIn}>
              Sign in with Google (mock)
            </AppButton>
            <AppRadioGroup
              label="Mock identity (simulates the server's answer)"
              name="mock-identity"
              options={OPTIONS}
              value={identity}
              onChange={(value) => {
                if (isMockIdentity(value)) setIdentity(value);
              }}
              disabled={busy}
              helperText="Mock mode only: on the real server the role comes from New CP access, never from this page."
            />
          </>
        ) : clientId === null ? (
          <InlineAlert severity="warning">
            Sign-in is BLOCKED: no Google client ID is configured for this build (VITE_GOOGLE_CLIENT_ID, question Q-B28).
          </InlineAlert>
        ) : (
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              ref={googleButtonRef}
              aria-busy={phase.kind === 'googleLoading' || busy}
              sx={{ minHeight: 44, display: 'flex', justifyContent: 'center', width: '100%' }}
            />
            {(phase.kind === 'googleLoading' || busy) && (
              <Typography variant="body2" color="text.secondary" role="status">
                {busy ? 'Signing you in…' : 'Loading Google sign-in…'}
              </Typography>
            )}
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary">
          Google is used only to confirm who you are. Your role and tenant come from New CP, not from Google.
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
