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
  /** Create a service instance of one catalog service on an order. */
  serviceNew: (orderUuid: string, serviceUuid: string) =>
    `/orders/${encodeURIComponent(orderUuid)}/services/new/${encodeURIComponent(serviceUuid)}`,
  /** Edit one service instance. */
  serviceEdit: (serviceItemUuid: string) => `/services/${encodeURIComponent(serviceItemUuid)}/edit`,
  notFound: '*',
} as const;
