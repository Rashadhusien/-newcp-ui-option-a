import { describe, expect, it } from 'vitest';
import { buildTrail } from './breadcrumbs';

const ORDER = '00000000-0000-0000-0000-000000000001';
const ITEM = '00000000-0000-0000-0000-000000000014';
const labels = (path: string, hints = {}) => buildTrail(path, hints).map((crumb) => crumb.label);

describe('buildTrail (A26)', () => {
  it('builds the top-level trails from the route labels', () => {
    expect(labels('/')).toEqual(['Home']);
    expect(labels('/home')).toEqual(['Home']);
    expect(labels('/dashboard')).toEqual(['Home', 'Dashboard']);
    expect(labels('/reporting')).toEqual(['Home', 'Report']);
    expect(labels('/orders')).toEqual(['Home', 'Orders']);
    expect(labels('/settings')).toEqual(['Home', 'Settings']);
    expect(labels('/orders/new')).toEqual(['Home', 'Orders', 'New order']);
  });

  it('shows an order by short id and a service by line number, never a full UUID', () => {
    expect(labels(`/orders/${ORDER}`)).toEqual(['Home', 'Orders', 'Order …00000001']);
    const service = labels(`/services/${ITEM}`, { orderUuid: ORDER, lineNumber: 1 });
    expect(service).toEqual(['Home', 'Orders', 'Order …00000001', 'Service line 1']);
    expect(labels(`/services/${ITEM}/edit`, { orderUuid: ORDER, lineNumber: 2 }).at(-1)).toBe('Edit form');
    for (const label of [...service, ...labels(`/orders/${ORDER}`)]) expect(label).not.toContain(ORDER);
  });

  it('puts a new service under Models or Conversion', () => {
    const path = `/orders/${ORDER}/services/new/00000000-0000-0000-0000-000000000003`;
    expect(labels(path, { section: 'models' })).toEqual(['Home', 'Models', 'New service']);
    expect(labels(path, { section: 'conversion' })).toEqual(['Home', 'Conversion', 'New service']);
  });

  it('links every crumb but the last, and marks the capability a crumb needs', () => {
    const trail = buildTrail(`/services/${ITEM}`, { orderUuid: ORDER, lineNumber: 1 });
    expect(trail.slice(0, -1).every((crumb) => crumb.to !== undefined)).toBe(true);
    expect(trail.at(-1)?.to).toBeUndefined();
    expect(trail[1]?.capability).toBe('orders.read');
  });

  it('falls back to a short trail before the service is loaded and for unknown paths', () => {
    expect(labels(`/services/${ITEM}`)).toEqual(['Home', 'Orders', 'Service']);
    expect(labels('/nowhere')).toEqual(['Home', 'Page not found']);
  });
});
