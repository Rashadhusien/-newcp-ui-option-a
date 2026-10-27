/**
 * Breadcrumb trail from the current route (A26). Pure: path in, crumbs out.
 *
 * Labels come from the route config (`ROUTE_LABELS`). Dynamic segments show
 * only what the page itself already shows: an order as `Order …<last 8>` and
 * a service as `Service line <n>`, never a full UUID or a patient or client
 * name. The URL of a service page does not carry its order or line, so the
 * page passes them as hints once it has loaded the item; until then the
 * trail is shorter.
 *
 * `capability` marks a crumb whose page needs it; the component shows such a
 * crumb as plain text when the session lacks it (display only).
 */

import { ROUTE_LABELS, ROUTES } from '@/app/routes';
import type { CapabilityCode } from '@/shared/api';

export interface Crumb {
  label: string;
  /** Absent on the last crumb (the current page). */
  to?: string;
  capability?: CapabilityCode;
}

export interface TrailHints {
  /** Order of the service shown on a service page. */
  orderUuid?: string;
  /** Line number of the service shown on a service page. */
  lineNumber?: number;
  /** Which launcher a "new service" page belongs to. */
  section?: 'models' | 'conversion';
}

const HOME: Crumb = { label: ROUTE_LABELS.home, to: ROUTES.home };
const ORDERS: Crumb = { label: ROUTE_LABELS.orders, to: ROUTES.orders, capability: 'orders.read' };

export function shortId(uuid: string): string {
  return `…${uuid.slice(-8)}`;
}

function orderCrumb(orderUuid: string): Crumb {
  return { label: `Order ${shortId(orderUuid)}`, to: ROUTES.orderServices(orderUuid), capability: 'service.read' };
}

function sectionCrumb(section: 'models' | 'conversion'): Crumb {
  return section === 'models'
    ? { label: ROUTE_LABELS.models, to: ROUTES.models, capability: 'service.read' }
    : { label: ROUTE_LABELS.conversion, to: ROUTES.conversion, capability: 'service.read' };
}

function serviceCrumbs(serviceItemUuid: string, hints: TrailHints): Crumb[] {
  const order = hints.orderUuid ? [orderCrumb(hints.orderUuid)] : [];
  const label = hints.lineNumber !== undefined ? `Service line ${String(hints.lineNumber)}` : ROUTE_LABELS.service;
  return [ORDERS, ...order, { label, to: ROUTES.serviceDetail(serviceItemUuid), capability: 'service.read' }];
}

/** Drops the link of the last crumb: it is the current page. */
function current(crumbs: Crumb[]): Crumb[] {
  return crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { label: crumb.label } : crumb));
}

function decode(segment: string): string {
  return decodeURIComponent(segment);
}

export function buildTrail(pathname: string, hints: TrailHints = {}): Crumb[] {
  const parts = pathname.split('/').filter((part) => part !== '');
  // Each branch below checks `parts.length` before reading a segment.
  const [first, second = '', third, fourth] = parts;

  if (parts.length === 0) return current([HOME]);
  if (parts.length === 1) {
    switch (first) {
      case 'home':
        return current([HOME]);
      case 'dashboard':
        return current([HOME, { label: ROUTE_LABELS.dashboard }]);
      case 'reporting':
        return current([HOME, { label: ROUTE_LABELS.reporting }]);
      case 'orders':
        return current([HOME, ORDERS]);
      case 'models':
      case 'conversion':
        return current([HOME, sectionCrumb(first)]);
      case 'settings':
        return current([HOME, { label: ROUTE_LABELS.settings }]);
      default:
        break;
    }
  }
  if (first === 'orders' && second === 'new' && parts.length === 2) {
    return current([HOME, ORDERS, { label: ROUTE_LABELS.orderNew }]);
  }
  if (first === 'orders' && parts.length === 2) {
    return current([HOME, ORDERS, orderCrumb(decode(second))]);
  }
  if (first === 'orders' && third === 'services' && fourth === 'new' && parts.length === 5) {
    const parent = hints.section ? [sectionCrumb(hints.section)] : [ORDERS, orderCrumb(decode(second))];
    return current([HOME, ...parent, { label: ROUTE_LABELS.serviceNew }]);
  }
  if (first === 'services' && parts.length === 2) {
    return current([HOME, ...serviceCrumbs(decode(second), hints)]);
  }
  if (first === 'services' && third === 'edit' && parts.length === 3) {
    return current([HOME, ...serviceCrumbs(decode(second), hints), { label: ROUTE_LABELS.serviceEdit }]);
  }
  return current([HOME, { label: ROUTE_LABELS.notFound }]);
}
