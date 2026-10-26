/**
 * NewServiceLauncher: starts a new Biomodel or Conversion service on the
 * demo order. The contract has no order lookup yet (Q-B3), so only the mock
 * names an order; with the real API this says what is missing.
 */

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { isApiError, type CatalogService } from '@/shared/api';
import { AppButton } from '@/shared/components/basic';
import { ErrorState, InlineAlert, LoadingState } from '@/shared/components/feedback';
import { serviceApi } from './data/serviceApi';
import { specForService, type FormKey } from './forms/formSpecs';

export interface NewServiceLauncherProps {
  formKey: FormKey;
}

type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string; denied: boolean }
  | { status: 'ready'; service: CatalogService | null };

export function NewServiceLauncher({ formKey }: NewServiceLauncherProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    serviceApi.catalog(undefined, { signal: controller.signal }).then(
      (services) => {
        if (controller.signal.aborted) return;
        const service = services.find((entry) => specForService(entry.code)?.key === formKey) ?? null;
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
    return <InlineAlert severity="warning">This service is not in the catalog for your account.</InlineAlert>;
  }

  const service = state.service;
  const orderUuid = serviceApi.demoOrderUuid;
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="body1">
          Add a {service.name} service to an existing order. Each one is a separate instance with its own ID, even
          when the order already has a {service.name} service.
        </Typography>
        {orderUuid === null ? (
          <InlineAlert severity="info">
            The API has no order lookup yet, so an order cannot be chosen here (question Q-B3 to the backend).
          </InlineAlert>
        ) : (
          <AppButton
            startIcon={<AddIcon />}
            onClick={() => {
              void navigate(ROUTES.serviceNew(orderUuid, service.uuid));
            }}
          >
            {`New ${service.name} on the demo order`}
          </AppButton>
        )}
      </Stack>
    </Paper>
  );
}
