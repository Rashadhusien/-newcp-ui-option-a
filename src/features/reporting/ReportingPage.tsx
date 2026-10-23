/**
 * Combined Models/Conversion report: one row per service INSTANCE.
 *
 * Search, service type and status filters, sort and page all live in the
 * URL, so a view can be bookmarked or shared. Counts per status come from
 * the search and type filters (not the status filter), so they show what
 * each status filter would return.
 *
 * Data is PROVISIONAL (local fixtures) until the contract arrives (D-13).
 */

import Paper from '@mui/material/Paper';
import { AppSelect, type AppSelectOption } from '@/shared/components/basic';
import {
  ResponsiveDataTable,
  TableToolbar,
  type FilterChip,
} from '@/shared/components/data-display';
import { PageHeader } from '@/shared/components/layout';
import {
  useUrlFilter,
  useUrlFiltersUpdater,
  useUrlTableControls,
} from '@/shared/hooks/useUrlTableControls';
import { presentStatus } from '@/shared/status/status';
import {
  SERVICE_TYPES,
  countByStatus,
  filterBySearchAndType,
  filterReport,
  isServiceType,
  statusOptions,
} from './filterReport';
import { REPORT_COLUMNS } from './reportColumns';
import { StatusCounts } from './StatusCounts';
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

export default function ReportingPage() {
  const { rows, loading, error, retry } = useReportRows();
  const [search, setSearch] = useUrlFilter('q');
  const [typeParam, setTypeParam] = useUrlFilter('type');
  const [statusParam, setStatusParam] = useUrlFilter('status');
  const updateFilters = useUrlFiltersUpdater();

  // URL values are untrusted: anything unknown reads as "all".
  const serviceType: ServiceType | '' = isServiceType(typeParam) ? typeParam : '';
  const statuses = statusOptions(rows, serviceType);
  const status = statuses.find((value) => value === statusParam) ?? '';

  const filters = { search, serviceType, status };
  const filtered = filterReport(rows, filters);
  const counts = countByStatus(rows, filterBySearchAndType(rows, filters), serviceType);
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
    chips.push({ key: 'q', label: `Search: ${search}`, onDelete: () => { setSearch(''); } });
  }
  if (serviceType !== '') {
    chips.push({
      key: 'type',
      label: `Service: ${SERVICE_TYPE_LABEL[serviceType]}`,
      onDelete: () => { setTypeParam(''); },
    });
  }
  if (status !== '') {
    chips.push({ key: 'status', label: `Status: ${presentStatus(status).label}`, onDelete: () => { setStatusParam(''); } });
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
      />
      <Paper variant="outlined">
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
                  const keep = next === '' || statusOptions(rows, isServiceType(next) ? next : '').some((option) => option === status);
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
        {!loading && !error && rows.length > 0 && (
          <StatusCounts
            counts={counts}
            activeType={serviceType}
            activeStatus={status}
            onSelect={(key) => {
              const isActive = status === key.status && serviceType === key.service;
              updateFilters({
                type: isActive ? '' : key.service,
                status: isActive ? '' : key.status,
              });
            }}
          />
        )}
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
      </Paper>
    </>
  );
}
