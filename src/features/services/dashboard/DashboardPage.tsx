/**
 * Dashboard (A28, scope addition 27 Oct, D-77): figures over every service
 * instance, computed in the browser by `dashboardSelectors` because the
 * contract has no dashboard endpoint (G3). MOCK only; with the real API the
 * page says BLOCKED and calls nothing.
 *
 * All five roles may see it (`reports.view_all`, checked by the mock like a
 * report read). Links to service pages need `service.read`, so FINANCE and
 * QC see the numbers without links. No export (D-54).
 */

import Box from '@mui/material/Box';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import MoneyOffOutlinedIcon from '@mui/icons-material/MoneyOffOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';
import { can } from '@/shared/api';
import { KpiCard, SectionCard } from '@/shared/components/data-display';
import { EmptyState, ErrorState, InlineAlert, LoadingState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { DashboardStatusList } from './DashboardStatusList';
import { dashboardKpis, dashboardStatusRows, needsAttention, recentActivity } from './dashboardSelectors';
import { NeedsAttentionList } from './NeedsAttentionList';
import { RecentActivityList } from './RecentActivityList';
import { useDashboardData } from './useDashboardData';

const TITLE = 'Dashboard';
const DESCRIPTION = 'Counted in the browser from the service data, one service instance at a time.';

export default function DashboardPage() {
  const { context } = useSession();
  const { state, retry } = useDashboardData();
  const canOpen = can(context, 'service.read');

  if (state.status === 'error') {
    const kind = state.error?.kind;
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} evidence />
        {kind === 'blocked' ? (
          <InlineAlert severity="warning">{`BLOCKED. ${state.error?.message ?? ''}`}</InlineAlert>
        ) : (
          <ErrorState
            title={kind === 'forbidden' ? 'No access' : 'Could not load the dashboard'}
            message={state.error?.message ?? 'Something went wrong. Try again.'}
            onRetry={kind === 'forbidden' ? undefined : retry}
          />
        )}
      </>
    );
  }

  const loading = state.status === 'loading';
  const data = state.status === 'ready' ? state.data : null;
  const services = data?.services ?? [];
  const kpis = dashboardKpis(services);
  const value = (count: number) => (loading ? '' : String(count));

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} evidence />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          mb: 3,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
        }}
      >
        <KpiCard
          label="Open services"
          value={value(kpis.open)}
          caption={`Not done and not cancelled, of ${String(kpis.total)} instances`}
          icon={<AssignmentLateOutlinedIcon />}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="On hold"
          value={value(kpis.onHold)}
          caption="Status is On hold now"
          icon={<PauseCircleOutlinedIcon />}
          tone="warning"
          loading={loading}
        />
        <KpiCard
          label="Completed"
          value={value(kpis.completed)}
          caption="Completed, shipped or delivered (as on the Report)"
          icon={<CheckCircleOutlinedIcon />}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Price override"
          value="Not available"
          caption="The API returns the unit price but not the contract price to compare with (Q-B30)"
          icon={<PriceChangeOutlinedIcon />}
          loading={loading}
        />
        <KpiCard
          label="Zero-charge reason"
          value={value(kpis.zeroChargeReason)}
          caption="Instances with a zero-charge reason set"
          icon={<MoneyOffOutlinedIcon />}
          loading={loading}
        />
      </Box>

      {loading ? (
        <LoadingState label="Loading the dashboard…" rows={6} />
      ) : data === null || services.length === 0 ? (
        <EmptyState title="No services yet" description="When services exist, their counts show here." />
      ) : (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <SectionCard title="Status overview">
            <DashboardStatusList rows={dashboardStatusRows(services)} total={kpis.total} />
          </SectionCard>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              alignItems: 'start',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <SectionCard title="Needs attention">
              <NeedsAttentionList rows={needsAttention(services, data.catalog)} canOpen={canOpen} />
            </SectionCard>
            <SectionCard title="Recent activity">
              <RecentActivityList rows={recentActivity(data.activity, services, data.catalog)} canOpen={canOpen} />
            </SectionCard>
          </Box>
        </Box>
      )}
    </>
  );
}
