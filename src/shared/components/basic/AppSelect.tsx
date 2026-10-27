/**
 * AppSelect: single select wrapper for all feature code.
 *
 * States: normal, loading (skeleton), empty (no options -> emptyText),
 * error (error text), disabled. Form selects (size medium) put the label
 * above the field (A23, see fieldLabel.ts); toolbar selects (small) keep
 * the floating label.
 */

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import { useId } from 'react';
import { labelAboveSx } from './fieldLabel';

export interface AppSelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface AppSelectProps<T extends string | number> {
  label: string;
  options: AppSelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  error?: string;
  loading?: boolean;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  onBlur?: () => void;
  /** small: toolbars and filters; medium: forms. */
  size?: 'small' | 'medium';
}

export function AppSelect<T extends string | number>({
  label,
  options,
  value,
  onChange,
  error,
  loading = false,
  emptyText = 'No options available',
  disabled = false,
  required = false,
  name,
  onBlur,
  size = 'medium',
}: AppSelectProps<T>) {
  const id = useId();

  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        height={size === 'small' ? 40 : 56}
        aria-label={`${label} loading`}
        role="status"
      />
    );
  }

  const isEmpty = options.length === 0;
  const above = size === 'medium';
  const effectiveDisabled = disabled || isEmpty;

  return (
    <FormControl
      fullWidth
      size={size}
      error={error != null}
      disabled={effectiveDisabled}
      required={required}
    >
      <InputLabel id={`${id}-label`} shrink={above ? true : undefined} sx={above ? labelAboveSx : undefined}>
        {label}
      </InputLabel>
      <Select
        id={id}
        name={name}
        labelId={`${id}-label`}
        label={above ? undefined : label}
        notched={above ? false : undefined}
        displayEmpty={above}
        value={value ?? ''}
        aria-describedby={error != null ? `${id}-error` : undefined}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === '' ? null : (next as T));
        }}
        onBlur={onBlur}
      >
        {isEmpty ? (
          <MenuItem value="" disabled>
            {emptyText}
          </MenuItem>
        ) : (
          options.map((opt) => (
            <MenuItem key={String(opt.value)} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))
        )}
      </Select>
      {(error ?? (isEmpty ? emptyText : null)) != null && (
        <FormHelperText id={error != null ? `${id}-error` : undefined}>
          {error ?? emptyText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
