/**
 * Route guard: signed-out users go to /login (Angular AuthGuard). The page
 * they asked for travels in router state so sign-in returns them to it
 * (Angular always landed on the dashboard, losing deep links).
 */

import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/shared/lib/session';

export interface LoginRedirectState {
  from?: string;
}

export function AuthBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (isAuthenticated()) return <>{children}</>;
  const state: LoginRedirectState = {
    from: `${location.pathname}${location.search}`,
  };
  return <Navigate to="/login" replace state={state} />;
}
