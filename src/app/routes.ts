/**
 * Route path constants (single source of truth for navigation).
 */

export const ROUTES = {
  root: '/',
  login: '/login',
  reporting: '/reporting',
  orders: '/orders',
  models: '/models',
  conversion: '/conversion',
  settings: '/settings',
  notFound: '*',
} as const;
