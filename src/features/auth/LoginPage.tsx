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
 * Always real (A38): the mock identity picker is gone, whatever VITE_USE_MOCKS says.
 */

import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import type { LoginRedirectState } from '@/app/AuthBoundary';
import { isApiError, loginWithGoogleIdToken, readApiConfig, readGoogleClientId } from '@/shared/api';
import { InlineAlert } from '@/shared/components/feedback';
import { AuthLayout } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { clearReturnTo } from '@/shared/lib/returnTo';
import { resolveLanding } from './landing';
import { renderGoogleButton } from './googleIdentity';

const GOOGLE_BUTTON_WIDTH = 320;

type Phase =
  | { kind: 'idle' }
  | { kind: 'googleLoading' }
  | { kind: 'signingIn' }
  | { kind: 'googleFailed'; message: string }
  | { kind: 'denied'; message: string }
  | { kind: 'pending' }
  | { kind: 'error'; message: string };

export default function LoginPage() {
  const location = useLocation();
  const { state, signInWithSession } = useSession();
  const { mode, systemMode } = useColorScheme();
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  const { baseUrl } = readApiConfig();
  const clientId = readGoogleClientId();

  const [phase, setPhase] = useState<Phase>(() => (clientId !== null ? { kind: 'googleLoading' } : { kind: 'idle' }));
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  // A36: silent Google re-sign-in only on a fresh load (a reload), never after a sign-out or a timeout.
  const endedBy = state.status === 'signedOut' ? state.reason : undefined;
  const autoSelect = endedBy === undefined;
  const signedIn = state.status === 'ready';

  // The saved page is used once: clear it as soon as the next sign-in lands.
  useEffect(() => {
    if (signedIn) clearReturnTo();
  }, [signedIn]);

  // Render Google's button once GIS has loaded.
  useEffect(() => {
    const parent = googleButtonRef.current;
    if (clientId === null || !parent) return;
    let active = true;
    parent.replaceChildren();
    renderGoogleButton(parent, {
      clientId,
      dark,
      width: GOOGLE_BUTTON_WIDTH,
      autoSelect,
      onFailure: () => {
        setPhase({ kind: 'googleFailed', message: 'Google did not return a sign-in. Try again.' });
      },
      onIdToken: (idToken) => {
        setPhase({ kind: 'signingIn' });
        loginWithGoogleIdToken(baseUrl, idToken).then(
          (outcome) => {
            // PENDING_ACCESS issues no token (Q-B27): show Pending Access, stay signed out.
            if (outcome.kind === 'pendingAccess') setPhase({ kind: 'pending' });
            else signInWithSession(outcome.session);
          },
          (error: unknown) => {
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
  }, [clientId, dark, baseUrl, signInWithSession, autoSelect]);

  if (state.status === 'ready') {
    const requested = (location.state as LoginRedirectState | null)?.from;
    return <Navigate to={resolveLanding(state.context, requested)} replace />;
  }

  const busy = phase.kind === 'signingIn' || state.status === 'loading';
  const endedMessage =
    phase.kind !== 'idle' || endedBy === undefined
      ? null
      : {
          expired: 'Your session expired. Please sign in again.',
          idle: 'You were signed out after 30 minutes without activity. Sign in again to continue.',
          max: 'Your session reached its 8-hour limit. Sign in again to continue.',
        }[endedBy];

  return (
    <AuthLayout>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h2" component="h1">
            Sign in to New CP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use your 3D Diagnostix Google account. Access is checked by the New CP server for every request.
          </Typography>
        </Box>

        {endedMessage !== null && <InlineAlert severity="warning">{endedMessage}</InlineAlert>}
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

        {clientId === null ? (
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
