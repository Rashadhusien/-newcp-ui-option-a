/**
 * AppCheckbox: a single labelled checkbox with an optional error/help text
 * linked through aria-describedby.
 */

import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { useId } from 'react';

export interface AppCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  name?: string;
}

export function AppCheckbox({
  label,
  checked,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  name,
}: AppCheckboxProps) {
  const id = useId();
  const message = error ?? helperText;
  return (
    <FormControl error={error != null} disabled={disabled}>
      <FormControlLabel
        label={label}
        control={
          <Checkbox
            name={name}
            checked={checked}
            onChange={(event) => {
              onChange(event.target.checked);
            }}
            onBlur={onBlur}
            slotProps={{ input: { 'aria-describedby': message != null ? `${id}-help` : undefined } }}
          />
        }
      />
      {message != null && <FormHelperText id={`${id}-help`}>{message}</FormHelperText>}
    </FormControl>
  );
}
