/**
 * Route path constants (single source of truth for navigation).
 */

export const ROUTES = {
  root: "/",
  login: "/login",
  /** Landing page after sign-in (A27). */
  home: "/home",
  /** Figures over all service instances (A28). */
  dashboard: "/dashboard",
  reporting: "/reporting",
  orders: "/orders",
  orderNew: "/orders/new",
  models: "/models",
  conversion: "/conversion",
  settings: "/settings",
  /** Create a service instance of one catalog service on an order. */
  serviceNew: (orderUuid: string, serviceUuid: string) =>
    `/orders/${encodeURIComponent(orderUuid)}/services/new/${encodeURIComponent(serviceUuid)}`,
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
  dashboard: string;
  reporting: string;
  orders: string;
  orderNew: string;
  models: string;
  conversion: string;
  settings: string;
  serviceNew: (orderUuid: string, serviceUuid: string) => string;
  orderServices: (orderUuid: string) => string;
  serviceDetail: (serviceItemUuid: string) => string;
  serviceEdit: (serviceItemUuid: string) => string;
  notFound: string;
};

/** Breadcrumb labels per route (A26); the trail builder in shared/lib/breadcrumbs.ts reads only these. */
export const ROUTE_LABELS = {
  home: "Home",
  dashboard: "Dashboard",
  reporting: "Report",
  orders: "Orders",
  orderNew: "New order",
  models: "Models",
  conversion: "Conversion",
  settings: "Settings",
  serviceNew: "New service",
  serviceEdit: "Edit form",
  /** Fallback for a service page before its line number is known. */
  service: "Service",
  notFound: "Page not found",
} as const;
