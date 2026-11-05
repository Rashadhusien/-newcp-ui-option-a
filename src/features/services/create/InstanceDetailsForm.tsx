/**
 * Service details for ONE wizard instance (A21): the same Connect form
 * fields, conditions and attached validators as the service form (A6R),
 * but nothing is sent here; the values go to the wizard and are sent with
 * the order on Review. The page validates every instance on Continue via
 * the `register` callback.
 */

import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { SectionCard } from '@/shared/components/data-display';
import type { FormDefinition } from '@/shared/api';
import { definedValues, formSchema, initialValues, resolveFields, warnings } from '../forms/formLogic';
import type { FormSpec, FormValues } from '../forms/formSpecs';
import { ServiceFormFields } from '../forms/ServiceFormFields';

export interface InstanceDetailsFormProps {
  title: string;
  spec: FormSpec;
  definition: FormDefinition;
  /** Values kept from an earlier visit to this step. */
  saved: FormValues | undefined;
  onValues: (values: FormValues) => void;
  /** Registers this form's validator; returns an unregister function. */
  register: (validate: () => Promise<boolean>) => () => void;
}

export function InstanceDetailsForm({ title, spec, definition, saved, onValues, register }: InstanceDetailsFormProps) {
  const fields = useMemo(() => resolveFields(spec, definition), [spec, definition]);
  const { control, formState, setValue, trigger } = useForm<FormValues>({
    defaultValues: saved ?? initialValues(fields),
    resolver: zodResolver(formSchema(spec.key, fields)),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const values = definedValues(useWatch({ control }));
  const key = JSON.stringify(values);

  useEffect(() => {
    onValues(values);
    // `key` is the serialised values: report only real changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => register(() => trigger()), [register, trigger]);

  return (
    <SectionCard title={title}>
      <ServiceFormFields
        formKey={spec.key}
        sections={spec.sections}
        fields={fields}
        values={values}
        control={control}
        errors={formState.errors}
        setValue={setValue}
        warnings={warnings(spec.key, values)}
      />
    </SectionCard>
  );
}
