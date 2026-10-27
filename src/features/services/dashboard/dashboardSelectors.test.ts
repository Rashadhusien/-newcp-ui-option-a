import { describe, expect, it } from 'vitest';
import { REPORT_FIXTURES } from '@/features/reporting/fixtures';
import { presentStatus } from '@/shared/status/status';
import { MOCK_SERVICE_ITEMS } from '@/mocks/serviceFixtures';
import { dashboardKpis, dashboardStatusRows, needsAttention } from './dashboardSelectors';

// The Report page's own counting, written out as that page does it (ReportingPage, StatusOverview).
const reportDone = (rows: readonly { status: string }[]) =>
  rows.filter((row) => presentStatus(row.status).semantic === 'success').length;
const reportStatusCount = (rows: readonly { status: string }[], status: string) =>
  rows.filter((row) => row.status === status).length;

describe('dashboardSelectors (A28)', () => {
  it('counts the same as the Report page for the same rows', () => {
    for (const rows of [REPORT_FIXTURES, MOCK_SERVICE_ITEMS]) {
      const kpis = dashboardKpis(rows);
      expect(kpis.total).toBe(rows.length);
      expect(kpis.completed).toBe(reportDone(rows));
      expect(kpis.onHold).toBe(reportStatusCount(rows, 'on_hold'));
      const statusRows = dashboardStatusRows(rows);
      for (const { status, count } of statusRows) expect(count).toBe(reportStatusCount(rows, status));
      expect(statusRows.reduce((sum, row) => sum + row.count, 0)).toBe(rows.length);
    }
  });

  it('never invents a price-override figure and lists only services on hold', () => {
    expect(dashboardKpis(MOCK_SERVICE_ITEMS).priceOverride).toBeNull();
    const onHold = needsAttention(MOCK_SERVICE_ITEMS, []);
    expect(onHold).toHaveLength(reportStatusCount(MOCK_SERVICE_ITEMS, 'on_hold'));
    for (const row of onHold) expect(row.orderShortId).toMatch(/^….{8}$/);
  });
});
