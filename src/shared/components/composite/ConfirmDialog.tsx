/**
 * ConfirmDialog: mandatory confirmation for cancel/delete (SRS 1.3).
 *
 * Traps focus, returns focus to the trigger on close, Esc cancels
 * (unless loading). Destructive variant styles the confirm button danger.
 */

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AppButton } from '@/shared/components/basic/AppButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'escapeKeyDown' && loading) {
          return;
        }
        onCancel();
      }}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-body"
    >
      <DialogTitle id="confirm-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {destructive && <WarningAmberIcon color="error" aria-hidden="true" />}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-body">{body}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <AppButton variant="text" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </AppButton>
        <AppButton
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
