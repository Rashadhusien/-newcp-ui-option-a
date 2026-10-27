/**
 * Combined Models/Conversion report: one row per service INSTANCE.
 *
 * Layout from the earlier POC's reports (A18): summary cards, then report
 * tabs ("Service instances", "Status overview"), then the content. The old
 * per-type status-chip rows are gone; service type and status stay toolbar
 * filters. Search, filters, tab, sort and page live in the URL, so a view
 * can be bookmarked or shared.
 *
 * Data is PROVISIONAL (local fixtures, statuses re-keyed to API codes in
 * A18) until a report endpoint exists (G3, Q-B3). No charts (`@mui/x-charts`
 * is not approved).
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import { AppSelect, type AppSelectOption } from '@/shared/components/basic';
import { KpiCard, ResponsiveDataTable, TableToolbar, type FilterChip } from '@/shared/components/data-display';
import { PageHeader } from '@/shared/components/layout';
import { useUrlFilter, useUrlFiltersUpdater, useUrlTableControls } from '@/shared/hooks/useUrlTableControls';
import { presentStatus, type StatusSemantic } from '@/shared/status/status';
import { countBySemantic } from '@/shared/status/statusFigures';
import { SERVICE_TYPES, filterReport, isServiceType, statusOptions } from './filterReport';
import { REPORT_COLUMNS } from './reportColumns';
import { StatusOverview } from './StatusOverview';
import { SERVICE_TYPE_LABEL, type ServiceType } from './types';
import { useReportRows } from './useReportRows';

const ALL = 'all';

const TYPE_OPTIONS: AppSelectOption<string>[] = [
  { value: ALL, label: 'All services' },
  ...SERVICE_TYPES.map((type) => ({ value: type, label: SERVICE_TYPE_LABEL[type] })),
];

function instances(count: number): string {
  return `${String(count)} service ${count === 1 ? 'instance' : 'instances'}`;
}

type ReportView = 'instances' | 'status';

const VIEWS: readonly { value: ReportView; label: string }[] = [
  { value: 'instances', label: 'Service instances' },
  { value: 'status', label: 'Status overview' },
];

export default function ReportingPage() {
  const { rows, loading, error, retry } = useReportRows();
  const [search, setSearch] = useUrlFilter('q');
  const [typeParam, setTypeParam] = useUrlFilter('type');
  const [statusParam, setStatusParam] = useUrlFilter('status');
  const [viewParam] = useUrlFilter('view');
  const view: ReportView = viewParam === 'status' ? 'status' : 'instances';
  const updateFilters = useUrlFiltersUpdater();

  // URL values are untrusted: anything unknown reads as "all".
  const serviceType: ServiceType | '' = isServiceType(typeParam) ? typeParam : '';
  const statuses = statusOptions(rows, serviceType);
  const status = statuses.find((value) => value === statusParam) ?? '';

  const filters = { search, serviceType, status };
  const filtered = filterReport(rows, filters);
  // Shared with the Dashboard (A28), so both pages count the same way.
  const bySemantic = (semantic: StatusSemantic) => countBySemantic(rows, semantic);
  const orderCount = new Set(rows.map((row) => row.orderId)).size;
  const controls = useUrlTableControls({
    initialSort: { column: 'dueDate', direction: 'asc' },
    pageSize: 10,
    pageSizeOptions: [10, 25, 50],
  });

  const statusSelectOptions: AppSelectOption<string>[] = [
    { value: ALL, label: 'All statuses' },
    ...statuses.map((value) => ({ value, label: presentStatus(value).label })),
  ];

  const chips: FilterChip[] = [];
  if (search !== '') {
    chips.push({
      key: 'q',
      label: `Search: ${search}`,
      onDelete: () => {
        setSearch('');
      },
    });
  }
  if (serviceType !== '') {
    chips.push({
      key: 'type',
      label: `Service: ${SERVICE_TYPE_LABEL[serviceType]}`,
      onDelete: () => {
        setTypeParam('');
      },
    });
  }
  if (status !== '') {
    chips.push({
      key: 'status',
      label: `Status: ${presentStatus(status).label}`,
      onDelete: () => {
        setStatusParam('');
      },
    });
  }
  const clearAll = () => {
    updateFilters({ q: '', type: '', status: '' });
  };
  const filtersActive = chips.length > 0;

  return (
    <>
      <PageHeader
        title="Models and Conversion report"
        description="One row per service instance. Two services of the same type in one order are two rows."
        evidence
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          mb: 3,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        <KpiCard
          label="Service instances"
          value={String(rows.length)}
          caption={`On ${String(orderCount)} orders`}
          icon={<AssignmentOutlinedIcon />}
          loading={loading}
        />
        <KpiCard
          label="In progress"
          value={String(bySemantic('primary'))}
          caption="In design or production"
          icon={<AutorenewOutlinedIcon />}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Waiting on someone"
          value={String(bySemantic('warning'))}
          caption="On hold or pending information"
          icon={<PauseCircleOutlinedIcon />}
          tone="warning"
          loading={loading}
        />
        <KpiCard
          label="Done"
          value={String(bySemantic('success'))}
          caption="Completed, shipped or delivered"
          icon={<CheckCircleOutlinedIcon />}
          tone="success"
          loading={loading}
        />
      </Box>
      <Paper variant="outlined">
        <Tabs
          value={view}
          onChange={(_event, value: ReportView) => {
            updateFilters({ view: value === 'instances' ? '' : value });
          }}
          aria-label="Report pages"
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
        >
          {VIEWS.map((option) => (
            <Tab key={option.value} value={option.value} label={option.label} />
          ))}
        </Tabs>
        {view === 'status' ? (
          <StatusOverview
            rows={rows}
            onOpenStatus={(value) => {
              updateFilters({ view: '', type: '', status: value });
            }}
          />
        ) : (
          <>
            <TableToolbar
              title="Services"
              // The count is a polite live region, so loading is announced too.
              count={loading ? 'Loading services…' : error ? undefined : instances(filtered.length)}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search order, service ID, client, patient code"
              filters={
                <>
                  <AppSelect
                    label="Service type"
                    size="small"
                    options={TYPE_OPTIONS}
                    value={serviceType === '' ? ALL : serviceType}
                    onChange={(value) => {
                      const next = value == null || value === ALL ? '' : value;
                      // A status the new type doesn't have is dropped with it.
                      const keep =
                        next === '' ||
                        statusOptions(rows, isServiceType(next) ? next : '').some((option) => option === status);
                      updateFilters({ type: next, status: keep ? status : '' });
                    }}
                  />
                  <AppSelect
                    label="Status"
                    size="small"
                    options={statusSelectOptions}
                    value={status === '' ? ALL : status}
                    onChange={(value) => {
                      setStatusParam(value == null || value === ALL ? '' : value);
                    }}
                  />
                </>
              }
              chips={chips}
              onClearAll={clearAll}
            />
            <ResponsiveDataTable
              rows={filtered}
              columns={REPORT_COLUMNS}
              getRowId={(row) => row.serviceId}
              controls={controls}
              ariaLabel="Service instances"
              loading={loading}
              error={error}
              onRetry={retry}
              empty={
                filtersActive
                  ? {
                      title: 'No services match these filters',
                      description: 'Change or clear the filters to see more services.',
                      actionLabel: 'Clear filters',
                      onAction: clearAll,
                    }
                  : {
                      title: 'No services yet',
                      description: 'Models and Conversion services appear here once orders include them.',
                    }
              }
            />
          </>
        )}
      </Paper>
    </>
  );
}
