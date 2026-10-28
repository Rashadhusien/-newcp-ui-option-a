/**
 * Loads the user and role lists and keeps the users in state, so an
 * assignment can update a row in place without a reload.
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError, type IamRoleAssignmentResponse, type IamRoleSummary, type IamUserSummary } from '@/shared/api';
import { iamApi } from './iamApi';

export interface IamData {
  users: IamUserSummary[];
  roles: IamRoleSummary[];
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
  applyAssignment: (assignment: IamRoleAssignmentResponse) => void;
}

export function useIamData(): IamData {
  const [users, setUsers] = useState<IamUserSummary[]>([]);
  const [roles, setRoles] = useState<IamRoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([iamApi.users({ signal }), iamApi.roles({ signal })])
      .then(([loadedUsers, loadedRoles]) => {
        setUsers(loadedUsers);
        setRoles(loadedRoles);
        setError(null);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (signal.aborted) return;
        setError(caught instanceof ApiError ? caught : ApiError.network());
        setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  const applyAssignment = useCallback((assignment: IamRoleAssignmentResponse) => {
    setUsers((current) =>
      current.map((user) =>
        user.userId !== assignment.userId || user.roles.some((role) => role.roleId === assignment.roleId)
          ? user
          : { ...user, roles: [...user.roles, { roleId: assignment.roleId, roleCode: assignment.roleCode }] },
      ),
    );
  }, []);

  return { users, roles, loading, error, retry, applyAssignment };
}
