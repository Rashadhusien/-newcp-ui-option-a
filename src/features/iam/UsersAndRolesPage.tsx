/**
 * Users and roles (IAM admin). Lists the tenant's users with search and a
 * state filter, assigns a role through a dialog, and shows the roles with
 * their capabilities (read only). Roles are never derived on the client and
 * no tenant is chosen or sent: the server decides every call, and its 403
 * message is shown. Search, filter, tab and page live in the URL.
 */

import { useState } from 'react';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import type { IamRoleAssignmentResponse, IamUserSummary } from '@/shared/api';
import { AppButton, AppSelect, type AppSelectOption } from '@/shared/components/basic';
import {
  ResponsiveDataTable,
  SectionTabs,
  TableToolbar,
  sectionTabIds,
  type DataColumn,
  type FilterChip,
  type SectionTab,
} from '@/shared/components/data-display';
import { ErrorState, LoadingState, useToast } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { can } from '@/shared/api';
import { useSession } from '@/shared/hooks/useSession';
import { useUrlFilter, useUrlFiltersUpdater, useUrlTableControls } from '@/shared/hooks/useUrlTableControls';
import { AssignRoleDialog } from './AssignRoleDialog';
import { useIamData } from './data/useIamData';
import { RolesPanel } from './RolesPanel';

type Tab = 'users' | 'roles';
type StateFilter = '' | 'pending' | 'other';

const TABS: readonly SectionTab<Tab>[] = [
  { value: 'users', label: 'Users' },
  { value: 'roles', label: 'Roles' },
];

const ALL = 'all';
const STATE_OPTIONS: AppSelectOption<string>[] = [
  { value: ALL, label: 'All states' },
  { value: 'pending', label: 'Pending' },
  { value: 'other', label: 'Other states' },
];
const ID_PREFIX = 'iam';

/** `state` is a free string in the contract; anything naming "pending" reads as pending. */
/** Suspended users are not shown in the tables. */
function isSuspended(user: IamUserSummary): boolean {
  return /suspend/i.test(user.state);
}

function isPending(user: IamUserSummary): boolean {
  return /pending/i.test(user.state);
}

function stateLabel(state: string): string {
  const text = state.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function parseStateFilter(value: string): StateFilter {
  return value === 'pending' || value === 'other' ? value : '';
}

const COLUMNS: DataColumn<IamUserSummary>[] = [
  { id: 'email', header: 'Email', priority: 'primary', role: 'title', render: (user) => user.email, sortValue: (user) => user.email },
  {
    id: 'state',
    header: 'State',
    priority: 'primary',
    role: 'status',
    sortValue: (user) => user.state,
    render: (user) =>
      isPending(user) ? (
        <Chip size="small" color="warning" variant="outlined" icon={<ScheduleOutlinedIcon />} label={stateLabel(user.state)} />
      ) : (
        <Chip size="small" variant="outlined" icon={<CheckCircleOutlinedIcon />} label={stateLabel(user.state)} />
      ),
  },
  {
    id: 'profile',
    header: 'Employee profile',
    priority: 'secondary',
    showFrom: 'md',
    render: (user) => (user.hasEmployeeProfile ? 'Yes' : 'No'),
  },
  {
    id: 'roles',
    header: 'Roles',
    priority: 'primary',
    render: (user) =>
      user.roles.length === 0 ? (
        'No roles'
      ) : (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {user.roles.map((role) => (
            <Chip key={role.roleId} size="small" label={role.roleCode} />
          ))}
        </Stack>
      ),
  },
];

export default function UsersAndRolesPage() {
  const { context } = useSession();
  const { showToast } = useToast();
  const { users, roles, loading, error, retry, applyAssignment } = useIamData();
  const [search, setSearch] = useUrlFilter('q');
  const [stateParam, setStateParam] = useUrlFilter('state');
  const [tabParam, setTabParam] = useUrlFilter('tab');
  const updateFilters = useUrlFiltersUpdater();
  const [target, setTarget] = useState<IamUserSummary | null>(null);
  const tab: Tab = tabParam === 'roles' ? 'roles' : 'users';
  const stateFilter = parseStateFilter(stateParam);
  const canAssign = can(context, 'iam.assign_role');
  const controls = useUrlTableControls({ initialSort: { column: 'email', direction: 'asc' }, pageSize: 10 });

  const term = search.trim().toLowerCase();
  const filtered = users.filter(
    (user) => !isSuspended(user),
  ).filter(
    (user) =>
      (term === '' || user.email.toLowerCase().includes(term)) &&
      (stateFilter === '' || (stateFilter === 'pending') === isPending(user)),
  );

  const chips: FilterChip[] = [];
  if (search !== '') chips.push({ key: 'q', label: `Search: ${search}`, onDelete: () => { setSearch(''); } });
  if (stateFilter !== '') {
    chips.push({
      key: 'state',
      label: `State: ${stateFilter === 'pending' ? 'Pending' : 'Other states'}`,
      onDelete: () => { setStateParam(''); },
    });
  }

  const assigned = (assignment: IamRoleAssignmentResponse) => {
    applyAssignment(assignment);
    showToast(`Role ${assignment.roleCode} assigned.`, { severity: 'success' });
    setTarget(null);
  };

  const noAccess = error?.status === 403;

  return (
    <>
      <PageHeader
        title="Users and roles"
        description="People who signed in and the roles they hold. A new role applies on the person's next request."
        evidence
      />
      {loading ? (
        <LoadingState />
      ) : error !== null ? (
        <Paper variant="outlined">
          <ErrorState
            title={noAccess ? 'No access' : 'Users and roles could not be loaded'}
            message={error.message}
            onRetry={noAccess ? undefined : retry}
          />
        </Paper>
      ) : (
        <>
          <SectionTabs
            tabs={TABS}
            value={tab}
            onChange={(value) => { setTabParam(value === 'users' ? '' : value); }}
            ariaLabel="Users and roles sections"
            idPrefix={ID_PREFIX}
          />
          <div role="tabpanel" id={sectionTabIds(ID_PREFIX, tab).panel} aria-labelledby={sectionTabIds(ID_PREFIX, tab).tab}>
            {tab === 'roles' ? (
              <RolesPanel roles={roles} />
            ) : (
              <Paper variant="outlined">
                <TableToolbar
                  title="Users"
                  count={`${String(filtered.length)} ${filtered.length === 1 ? 'user' : 'users'}`}
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search by email"
                  filters={
                    <AppSelect
                      label="State"
                      size="small"
                      options={STATE_OPTIONS}
                      value={stateFilter === '' ? ALL : stateFilter}
                      onChange={(value) => { setStateParam(value == null || value === ALL ? '' : value); }}
                    />
                  }
                  chips={chips}
                  onClearAll={() => { updateFilters({ q: '', state: '' }); }}
                />
                <ResponsiveDataTable
                  rows={filtered}
                  columns={COLUMNS}
                  getRowId={(user) => String(user.userId)}
                  controls={controls}
                  ariaLabel="Users"
                  empty={{ title: 'No users match', description: 'Change or clear the search and filter.' }}
                  actionsWidth={160}
                  renderActions={(user) => (
                    <AppButton
                      variant="secondary"
                      size="sm"
                      startIcon={<PersonAddAltOutlinedIcon />}
                      disabled={!canAssign}
                      ariaLabel={`Assign role to ${user.email}`}
                      onClick={() => { setTarget(user); }}
                    >
                      Assign role
                    </AppButton>
                  )}
                />
              </Paper>
            )}
          </div>
        </>
      )}
      <AssignRoleDialog
        user={target}
        roles={roles}
        onAssigned={assigned}
        onClose={() => { setTarget(null); }}
      />
    </>
  );
}
