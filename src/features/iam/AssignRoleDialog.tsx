/**
 * Assign one role to one user. The role list comes from the server; the
 * server decides (403 shows its message here). The same request twice is
 * fine: the endpoint is idempotent.
 */

import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ApiError, type IamRoleAssignmentResponse, type IamRoleSummary, type IamUserSummary } from '@/shared/api';
import { AppSelect } from '@/shared/components/basic';
import { FormDialog } from '@/shared/components/composite';
import { CapabilityChips } from './CapabilityChips';
import { iamApi } from './data/iamApi';

export interface AssignRoleDialogProps {
  user: IamUserSummary | null;
  roles: readonly IamRoleSummary[];
  onAssigned: (assignment: IamRoleAssignmentResponse) => void;
  onClose: () => void;
}

export function AssignRoleDialog({ user, roles, onAssigned, onClose }: AssignRoleDialogProps) {
  const [roleId, setRoleId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = roles.find((role) => role.roleId === roleId) ?? null;

  const close = () => {
    setRoleId(null);
    setError(null);
    onClose();
  };

  const submit = () => {
    if (user === null) return;
    if (selected === null) {
      setError('Choose a role first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    iamApi
      .assignRole(user.userId, selected.roleId)
      .then((assignment) => {
        setSubmitting(false);
        onAssigned(assignment);
        setRoleId(null);
      })
      .catch((caught: unknown) => {
        setSubmitting(false);
        setError(caught instanceof ApiError ? caught.message : 'The role could not be assigned.');
      });
  };

  return (
    <FormDialog
      open={user !== null}
      title="Assign role"
      description={user?.email}
      submitLabel="Confirm"
      loading={submitting}
      error={error}
      maxWidth="xs"
      onSubmit={submit}
      onClose={close}
    >
      <Stack spacing={2}>
        <AppSelect
          label="Role"
          options={roles.map((role) => ({ value: role.roleId, label: `${role.name} (${role.code})` }))}
          value={roleId}
          onChange={setRoleId}
          emptyText="No roles available"
        />
        {selected !== null && (
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              This role allows
            </Typography>
            <CapabilityChips capabilities={selected.capabilities} />
          </Stack>
        )}
      </Stack>
    </FormDialog>
  );
}
