/**
 * Application router (react-router-dom v7, data-router API).
 *
 * Every page is lazy: `lazy` loads the page module's default export on
 * first visit, so each feature ships as its own chunk.
 */

import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/shared/components/layout';
import { ROUTES } from './routes';
import { AuthBoundary } from './AuthBoundary';

type PageModule = { default: React.ComponentType };

const page = (load: () => Promise<PageModule>) => async () => ({
  Component: (await load()).default,
});

export const router = createBrowserRouter([
  { path: ROUTES.login, lazy: page(() => import('@/features/auth/LoginPage')) },
  {
    path: ROUTES.root,
    element: (
      <AuthBoundary>
        <AppShell />
      </AuthBoundary>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.reporting} replace /> },
      { path: 'reporting', lazy: page(() => import('@/features/reporting/ReportingPage')) },
      { path: 'orders', lazy: page(() => import('@/features/orders/OrdersPage')) },
      { path: 'models', lazy: page(() => import('@/features/models/ModelsPage')) },
      { path: 'conversion', lazy: page(() => import('@/features/conversion/ConversionPage')) },
      { path: 'settings', lazy: page(() => import('@/features/settings/SettingsPage')) },
      { path: ROUTES.notFound, lazy: page(() => import('./NotFoundPage')) },
    ],
  },
]);
