/**
 * AppTextField: single text input wrapper for all feature code.
 *
 * States: normal (value), loading (skeleton), empty (no value +
 * placeholder), error (error text linked via aria-describedby),
 * disabled. Validation display follows SRS 9.4. The label sits above the
 * field (A23, see fieldLabel.ts).
 */

import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import { useId } from 'react';
import { labelAboveSx } from './fieldLabel';

interface AppTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  name?: string;
  onBlur?: () => void;
  multiline?: boolean;
  minRows?: number;
  /** Number inputs: inclusive bounds. */
  min?: number;
  max?: number;
}

export function AppTextField({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  loading = false,
  disabled = false,
  type = 'text',
  placeholder,
  name,
  onBlur,
  multiline = false,
  minRows,
  min,
  max,
}: AppTextFieldProps) {
  const id = useId();

  if (loading) {
    return <Skeleton variant="rounded" height={56} aria-label={`${label} loading`} role="status" />;
  }

  const describedBy = error != null ? `${id}-error` : undefined;
  return (
    <TextField
      id={id}
      name={name}
      label={label}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onBlur={onBlur}
      error={error != null}
      helperText={error ?? helperText}
      required={required}
      disabled={disabled}
      type={type}
      placeholder={placeholder}
      multiline={multiline}
      minRows={minRows}
      fullWidth
      slotProps={{
        formHelperText: error != null ? { id: `${id}-error` } : undefined,
        // Label above the field (A23): no notch in the outline.
        input: { notched: false, ...(describedBy != null ? { 'aria-describedby': describedBy } : {}) },
        htmlInput: { min, max },
        inputLabel: { shrink: true, sx: labelAboveSx },
      }}
    />
  );
}
