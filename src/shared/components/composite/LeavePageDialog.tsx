/**
 * LeavePageDialog: asks before an in-app navigation drops unsaved changes
 * (pairs with useDirtyGuard). Adapted from poc-mui LeavePageDialog.
 */

import type { Blocker } from 'react-router-dom';
import { ConfirmDialog } from './ConfirmDialog';

export interface LeavePageDialogProps {
  blocker: Blocker;
  body?: string;
}

export function LeavePageDialog({
  blocker,
  body = 'You have unsaved changes. If you leave now they will be lost.',
}: LeavePageDialogProps) {
  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave this page?"
      body={body}
      confirmLabel="Leave page"
      cancelLabel="Stay"
      destructive
      onConfirm={() => {
        blocker.proceed?.();
      }}
      onCancel={() => {
        blocker.reset?.();
      }}
    />
  );
}
