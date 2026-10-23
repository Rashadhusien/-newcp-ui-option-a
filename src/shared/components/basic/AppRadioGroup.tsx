/**
 * AppRadioGroup: a labelled radio group (fieldset + legend) with an error
 * linked through aria-describedby. Options wrap on narrow screens.
 */

import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { useId } from 'react';

export interface AppRadioOption {
  value: string;
  label: string;
}

export interface AppRadioGroupProps {
  label: string;
  options: readonly AppRadioOption[];
  /** '' = nothing chosen. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

export function AppRadioGroup({
  label,
  options,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  name,
}: AppRadioGroupProps) {
  const id = useId();
  const message = error ?? helperText;
  return (
    <FormControl component="fieldset" error={error != null} required={required} disabled={disabled}>
      <FormLabel component="legend" id={`${id}-label`}>
        {label}
      </FormLabel>
      <RadioGroup
        row
        name={name ?? id}
        value={value}
        aria-labelledby={`${id}-label`}
        aria-describedby={message != null ? `${id}-help` : undefined}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={onBlur}
      >
        {options.map((option) => (
          <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
        ))}
      </RadioGroup>
      {message != null && <FormHelperText id={`${id}-help`}>{message}</FormHelperText>}
    </FormControl>
  );
}
