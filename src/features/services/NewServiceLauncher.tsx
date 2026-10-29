/**
 * NewServiceLauncher: starts a new Biomodel or Conversion service on the
 * demo order. The contract has no order lookup yet (Q-B3), so only the mock
 * names an order; with the real API this says what is missing.
 */

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { isApiError } from '@/shared/api';
import { ErrorState, InlineAlert, LoadingState } from '@/shared/components/feedback';
import { serviceApi } from './data/serviceApi';
import { serviceChoices, type ServiceChoice } from './forms/catalogFormBridge';
import { BIOMODEL_SPEC, CONVERSION_SPEC, type FormKey } from './forms/formSpecs';

export interface NewServiceLauncherProps {
  formKey: FormKey;
}

type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string; denied: boolean }
  | { status: 'ready'; service: ServiceChoice | null };

export function NewServiceLauncher({ formKey }: NewServiceLauncherProps) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    serviceApi.catalog(undefined, { signal: controller.signal }).then(
      (services) => {
        if (controller.signal.aborted) return;
        // One choice per family: Conversion is found by serviceFamily, never by a catalog row's position or code.
        const service = serviceChoices(services).find((choice) => choice.family === formKey) ?? null;
        setState({ status: 'ready', service });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: isApiError(error) ? error.message : 'Could not load the catalog.',
          // A 403 is the server's decision: retrying cannot change it.
          denied: isApiError(error) && error.kind === 'forbidden',
        });
      },
    );
    return () => {
      controller.abort();
    };
  }, [formKey, attempt]);

  if (state.status === 'loading') return <LoadingState label="Loading the catalog…" rows={2} />;
  if (state.status === 'error') {
    return (
      <ErrorState
        title={state.denied ? 'No access' : 'Could not load the catalog'}
        message={state.message}
        onRetry={
          state.denied
            ? undefined
            : () => {
                setState({ status: 'loading' });
                setAttempt((value) => value + 1);
              }
        }
      />
    );
  }
  if (state.service === null) {
    const title = (formKey === 'biomodel' ? BIOMODEL_SPEC : CONVERSION_SPEC).title;
    return (
      <InlineAlert severity="warning">
        {`${title} is not available yet: no service in your account's catalog belongs to the ${title} family.`}
      </InlineAlert>
    );
  }

  const service = state.service;
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="body1">
          Add a {service.spec.title} service to an existing order. Each one is a separate instance with its own ID, even
          when the order already has a {service.spec.title} service.
        </Typography>
        <InlineAlert severity="info">
          The API has no order lookup yet, so an order cannot be chosen here (question Q-B3 to the backend). Open an
          order to add a service to it.
        </InlineAlert>
      </Stack>
    </Paper>
  );
}
