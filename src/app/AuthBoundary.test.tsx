import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import LoginPage from '@/features/auth/LoginPage';
import { theme } from '@/theme/theme';
import { reportAccessError, chooseMockIdentity, clearMockIdentity } from '@/shared/lib/session';
import { ApiError } from '@/shared/api';
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

afterEach(() => {
  clearMockIdentity();
  vi.unstubAllEnvs();
});

describe('AuthBoundary and sign-in (IAM v0.9.7)', () => {
  it('sends a signed-out visitor to sign-in, then back to the requested page', async () => {
    const router = renderAt('/services/abc/edit?tab=1');
    expect(await screen.findByRole('heading', { name: 'Sign in to New CP' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'OPS (Models and Conversion)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in (mock)' }));
    expect(await screen.findByText('Workspace')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/services/abc/edit');
    expect(router.state.location.search).toBe('?tab=1');
  });

  it('shows Pending Access, with no workspace, for a user without a role or tenant', async () => {
    chooseMockIdentity('PENDING');
    renderAt('/reporting');
    expect(await screen.findByRole('heading', { name: 'Access pending' })).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });

  it('returns to sign-in when any API call answers 401', async () => {
    chooseMockIdentity('CS');
    renderAt('/reporting');
    expect(await screen.findByText('Workspace')).toBeInTheDocument();
    reportAccessError(new ApiError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' }));
    expect(await screen.findByRole('heading', { name: 'Sign in to New CP' })).toBeInTheDocument();
  });

  it('never renders the mock identity picker with mocks off', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: 'Sign in to New CP' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in (mock)' })).not.toBeInTheDocument();
    expect(screen.getByText(/not in the API contract/)).toBeInTheDocument();
  });
});
