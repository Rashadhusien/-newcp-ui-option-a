/**
 * Route path constants (single source of truth for navigation).
 */

export const ROUTES = {
  root: "/",
  login: "/login",
  /** Landing page after sign-in (A27). */
  home: "/home",
  reporting: "/reporting",
  orders: "/orders",
  orderNew: "/orders/new",
  models: "/models",
  conversion: "/conversion",
  settings: "/settings",
  adminUsers: "/admin/users",
  /** Create a service instance of one catalog service on an order. */
  serviceNew: (orderUuid: string, serviceUuid: string) =>
    `/orders/${encodeURIComponent(orderUuid)}/services/new/${encodeURIComponent(serviceUuid)}`,
  /** Create a Conversion on an order; the server resolves the catalog variant (PR #28). */
  serviceNewFamily: (orderUuid: string, serviceFamily: 'conversion') =>
    `/orders/${encodeURIComponent(orderUuid)}/services/new/family/${serviceFamily}`,
  /** One order: summary and its services (A20). */
  orderServices: (orderUuid: string) =>
    `/orders/${encodeURIComponent(orderUuid)}`,
  /** One service instance: staff fields, status, history. */
  serviceDetail: (serviceItemUuid: string) =>
    `/services/${encodeURIComponent(serviceItemUuid)}`,
  /** Edit one service instance. */
  serviceEdit: (serviceItemUuid: string) =>
    `/services/${encodeURIComponent(serviceItemUuid)}/edit`,
  notFound: "*",
} satisfies {
  root: string;
  login: string;
  home: string;
  reporting: string;
  orders: string;
  orderNew: string;
  models: string;
  conversion: string;
  settings: string;
  adminUsers: string;
  serviceNew: (orderUuid: string, serviceUuid: string) => string;
  serviceNewFamily: (orderUuid: string, serviceFamily: 'conversion') => string;
  orderServices: (orderUuid: string) => string;
  serviceDetail: (serviceItemUuid: string) => string;
  serviceEdit: (serviceItemUuid: string) => string;
  notFound: string;
};

/** Breadcrumb labels per route (A26); the trail builder in shared/lib/breadcrumbs.ts reads only these. */
export const ROUTE_LABELS = {
  home: "Home",
  reporting: "Report",
  orders: "All orders",
  orderNew: "Add order",
  models: "Models",
  conversion: "Conversion",
  settings: "Settings",
  adminUsers: "Users and roles",
  serviceNew: "New service",
  serviceEdit: "Edit form",
  /** Fallback for a service page before its line number is known. */
  service: "Service",
  notFound: "Page not found",
} as const;
