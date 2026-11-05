/**
 * ServiceFormFields: renders the visible fields of one service form, grouped
 * in titled sections. Each field sits in a wrapper with id `field-<key>` so
 * the error summary can move focus to it. Changing a field applies the
 * source's dependent resets (e.g. software -> format).
 */

import Box from '@mui/material/Box';
import { Controller, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { AppCheckbox, AppRadioGroup, AppSelect, AppTextField } from '@/shared/components/basic';
import {
  dependentChanges,
  isVisible,
  optionsFor,
  type RenderField,
  type SectionWarning,
} from './formLogic';
import type { FieldValue, FormKey, FormValues } from './formSpecs';
import { FormSection } from './FormSection';

export interface ServiceFormFieldsProps {
  formKey: FormKey;
  sections: readonly string[];
  fields: readonly RenderField[];
  values: FormValues;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  warnings: readonly SectionWarning[];
  disabled?: boolean;
}

export function ServiceFormFields({
  formKey,
  sections,
  fields,
  values,
  control,
  errors,
  setValue,
  warnings,
  disabled = false,
}: ServiceFormFieldsProps) {
  const allSections = [...sections, ...(fields.some((field) => field.spec.section === 'Other') ? ['Other'] : [])];

  const change = (key: string, value: FieldValue, onChange: (value: FieldValue) => void) => {
    onChange(value);
    for (const [dependentKey, dependentValue] of Object.entries(dependentChanges(formKey, key, value))) {
      setValue(dependentKey, dependentValue, { shouldDirty: true, shouldValidate: false });
    }
  };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      {allSections.map((section) => {
        const visible = fields.filter((field) => field.spec.section === section && isVisible(field.spec, values));
        if (visible.length === 0) return null;
        const notes = warnings.filter((warning) => warning.section === section).map((warning) => warning.message);
        return (
          <FormSection key={section} title={section} notes={notes}>
            {visible.map((field) => {
              const { spec, label } = field;
              const error = errors[spec.key]?.message;
              const fieldDisabled = disabled || (spec.disabled?.(values) ?? false);
              const wide = spec.control === 'textarea' || spec.control === 'radio';
              return (
                <Box key={spec.key} id={`field-${spec.key}`} sx={{ gridColumn: wide ? '1 / -1' : undefined }}>
                  <Controller
                    name={spec.key}
                    control={control}
                    render={({ field: input }) => {
                      if (spec.control === 'checkbox') {
                        return (
                          <AppCheckbox
                            label={label}
                            checked={input.value === true}
                            onChange={(checked) => {
                              change(spec.key, checked, input.onChange);
                            }}
                            onBlur={input.onBlur}
                            error={error}
                            disabled={fieldDisabled}
                            name={spec.key}
                          />
                        );
                      }
                      if (spec.control === 'radio') {
                        return (
                          <AppRadioGroup
                            label={label}
                            options={optionsFor(field, values).map((option) => ({ value: option.code, label: option.label }))}
                            value={typeof input.value === 'string' ? input.value : ''}
                            onChange={(value) => {
                              change(spec.key, value, input.onChange);
                            }}
                            onBlur={input.onBlur}
                            error={error}
                            required={spec.required}
                            disabled={fieldDisabled}
                            name={spec.key}
                          />
                        );
                      }
                      if (spec.control === 'select') {
                        return (
                          <AppSelect<string>
                            label={label}
                            options={optionsFor(field, values).map((option) => ({ value: option.code, label: option.label }))}
                            value={typeof input.value === 'string' && input.value !== '' ? input.value : null}
                            onChange={(value) => {
                              change(spec.key, value ?? '', input.onChange);
                            }}
                            onBlur={input.onBlur}
                            error={error}
                            required={spec.required}
                            disabled={fieldDisabled}
                            emptyText={spec.disabled?.(values) ? 'Choose a brand first' : 'No options available'}
                            name={spec.key}
                          />
                        );
                      }
                      return (
                        <AppTextField
                          label={label}
                          value={typeof input.value === 'string' ? input.value : ''}
                          onChange={(value) => {
                            change(spec.key, value, input.onChange);
                          }}
                          onBlur={input.onBlur}
                          error={error}
                          required={spec.required}
                          disabled={fieldDisabled}
                          multiline={spec.control === 'textarea'}
                          minRows={spec.control === 'textarea' ? 3 : undefined}
                          name={spec.key}
                        />
                      );
                    }}
                  />
                </Box>
              );
            })}
          </FormSection>
        );
      })}
    </Box>
  );
}
