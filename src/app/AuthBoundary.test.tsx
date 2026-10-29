import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import LoginPage from '@/features/auth/LoginPage';
import { theme } from '@/theme/theme';
import { reportAccessError } from '@/shared/lib/session';
import { ApiError, clearSessionToken, setSessionToken } from '@/shared/api';
import { AuthBoundary } from './AuthBoundary';
import { SessionProvider } from './SessionProvider';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/*',
        element: (
          <AuthBoundary>
            <p>Workspace</p>
          </AuthBoundary>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <ThemeProvider theme={theme}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </ThemeProvider>,
  );
  return router;
}

/** Signs in for real: a session token in memory and `GET /auth/me` answering with this context. */
function signedInAs(roleCodes: string[], isPendingAccess = false) {
  const me = {
    email: 'clerk@example.test',
    userUuid: '00000000-0000-4000-a000-000000000099',
    tenantSlug: isPendingAccess ? null : 'demo-tenant',
    roleCodes,
    capabilities: isPendingAccess ? [] : ['reports.view_all'],
    isPendingAccess,
  };
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(() => Promise.resolve(new Response(JSON.stringify(me), { status: 200 }))));
  setSessionToken({ sessionToken: 'synthetic-session', expiresAt: null });
}

afterEach(() => {
  clearSessionToken();
  vi.unstubAllGlobals();
});

describe('AuthBoundary and sign-in (IAM v0.9.7)', () => {
  it('sends a signed-out visitor to sign-in, with no workspace', async () => {
    renderAt('/services/abc/edit?tab=1');
    expect(await screen.findByRole('heading', { name: 'Sign in to New CP' })).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });

  it('shows Pending Access, with no workspace, for a user without a role or tenant', async () => {
    signedInAs([], true);
    renderAt('/reporting');
    expect(await screen.findByRole('heading', { name: 'Access pending' })).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });

  it('returns to sign-in when any API call answers 401', async () => {
    signedInAs(['CS']);
    renderAt('/reporting');
    expect(await screen.findByText('Workspace')).toBeInTheDocument();
    reportAccessError(new ApiError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' }));
    expect(await screen.findByRole('heading', { name: 'Sign in to New CP' })).toBeInTheDocument();
  });

  it('never renders a mock identity picker (A38)', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: 'Sign in to New CP' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in with Google (mock)' })).not.toBeInTheDocument();
    // No Google client ID configured in tests: the real sign-in says BLOCKED (A25, Q-B28).
    expect(screen.getByText(/Sign-in is BLOCKED/)).toBeInTheDocument();
  });
});
