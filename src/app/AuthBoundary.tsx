/**
 * Route guard driven by the session context (IAM v0.9.7):
 * - signed out (or any 401) -> /login; the requested in-app path travels in
 *   router state so sign-in returns to it;
 * - PENDING -> Pending Access, with no workspace or business features;
 * - BLOCKED (real API: no context endpoint yet) -> a plain explanation;
 * - AUTHORIZED -> the workspace.
 */

import { Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { PendingAccess } from '@/features/auth/PendingAccess';
import { ErrorState, LoadingState } from '@/shared/components/feedback';
import { AuthLayout } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';

export interface LoginRedirectState {
  from?: string;
}

export function AuthBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, refresh } = useSession();

  switch (state.status) {
    case 'loading':
      return (
        <Box sx={{ p: 3 }}>
          <LoadingState label="Checking your access…" />
        </Box>
      );
    case 'signedOut': {
      const redirect: LoginRedirectState = { from: `${location.pathname}${location.search}` };
      return <Navigate to="/login" replace state={redirect} />;
    }
    case 'blocked':
      return (
        <AuthLayout>
          <ErrorState title="Sign-in not available (BLOCKED)" message={state.message} />
        </AuthLayout>
      );
    case 'error':
      return (
        <AuthLayout>
          <ErrorState
            title="Could not check your access"
            message={state.error?.message ?? 'Something went wrong. Try again.'}
            onRetry={refresh}
          />
        </AuthLayout>
      );
    case 'ready':
      return state.context.accessStatus === 'PENDING' ? <PendingAccess /> : <>{children}</>;
  }
}
