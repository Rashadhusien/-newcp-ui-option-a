/**
 * Create order (A21, pattern from the earlier POC's create-order wizard):
 * patient and client -> services -> teeth (react-odontogram, FDI) ->
 * service details (the Connect form fields of every Biomodel and Conversion
 * instance) -> review. Back is always allowed; forward needs a client and
 * patient code, at least one service, and valid service details. Creating
 * makes the order and one service instance per added service, then opens
 * the new order.
 *
 * MOCK ONLY: the reference contract only creates services on an existing
 * order. Create order and its new database fields are Q-B24, patient fields
 * Q-B25; with the real API "Create order" is BLOCKED and nothing is sent.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import { ROUTES } from '@/app/routes';
import { isApiError, type ApiError, type CatalogService, type FormDefinition } from '@/shared/api';
import { AppButton } from '@/shared/components/basic';
import { WizardStepper } from '@/shared/components/composite';
import { ErrorState, InlineAlert, LoadingState, useToast } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { MOCK_ORDERS } from '@/mocks/orderFixtures';
import { serviceApi } from '../data/serviceApi';
import { initialValues, resolveFields, toAnswers } from '../forms/formLogic';
import { specForService, type FormSpec } from '../forms/formSpecs';
import { InstanceDetailsForm } from './InstanceDetailsForm';
import { PatientStep } from './PatientStep';
import { ReviewStep } from './ReviewStep';
import { ServicesStep } from './ServicesStep';
import { TeethStep } from './TeethStep';
import { LAST_STEP, STEP_LABELS, teethFor, useCreateOrderWizard } from './useCreateOrderWizard';

interface Offered {
  service: CatalogService;
  spec: FormSpec;
  definition: FormDefinition;
  prefix: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | null }
  | { status: 'ready'; offered: Offered[] };

const DETAILS_STEP = 4;
/** Clients for the mock picker: the synthetic order fixtures' clients. */
const MOCK_CLIENTS = [...new Set(MOCK_ORDERS.map((order) => order.clientName))].sort();

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const wizard = useCreateOrderWizard();
  const { state, step, goTo } = wizard;
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  // The instance set whose details last passed validation; adding or removing a service invalidates it.
  const [checkedKey, setCheckedKey] = useState<string | null>(null);
  const [detailsInvalid, setDetailsInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const validators = useRef(new Map<string, () => Promise<boolean>>());

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const run = async (): Promise<Offered[]> => {
      const catalog = await serviceApi.catalog(undefined, options);
      const withSpec = catalog.flatMap((service) => {
        const spec = specForService(service.code);
        return spec ? [{ service, spec }] : [];
      });
      return Promise.all(
        withSpec.map(async ({ service, spec }) => ({
          service,
          spec,
          definition: await serviceApi.formSchema(service.uuid, options),
          prefix: spec.key,
        })),
      );
    };
    run().then(
      (offered) => {
        if (!controller.signal.aborted) setLoad({ status: 'ready', offered });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setLoad({ status: 'error', error: isApiError(error) ? error : null });
      },
    );
    return () => {
      controller.abort();
    };
  }, []);

  const instancesKey = state.instances.map((instance) => instance.id).join('|');
  const detailsChecked = checkedKey === instancesKey;

  const offered = useMemo(() => (load.status === 'ready' ? load.offered : []), [load]);
  const offeredFor = useCallback(
    (serviceUuid: string) => offered.find((entry) => entry.service.uuid === serviceUuid),
    [offered],
  );
  const instanceLabel = (instanceId: string): string => {
    const instance = state.instances.find((entry) => entry.id === instanceId);
    if (!instance) return instanceId;
    const name = offeredFor(instance.serviceUuid)?.service.name ?? 'Service';
    const sameType = state.instances.filter((entry) => entry.serviceUuid === instance.serviceUuid);
    return `${name} ${String(sameType.indexOf(instance) + 1)}`;
  };

  const register = useCallback(
    (instanceId: string) => (validate: () => Promise<boolean>) => {
      validators.current.set(instanceId, validate);
      return () => {
        validators.current.delete(instanceId);
      };
    },
    [],
  );

  const canReach = (target: number) => wizard.canReach(target) && (target <= DETAILS_STEP || detailsChecked);

  const continueFromDetails = async () => {
    const results = await Promise.all([...validators.current.values()].map((validate) => validate()));
    const ok = results.every(Boolean);
    setCheckedKey(ok ? instancesKey : null);
    setDetailsInvalid(!ok);
    if (ok) goTo(DETAILS_STEP + 1);
  };

  const answersFor = (instanceId: string, serviceUuid: string) => {
    const entry = offeredFor(serviceUuid);
    if (!entry) return [];
    const fields = resolveFields(entry.spec, entry.definition);
    return toAnswers(fields, state.values[instanceId] ?? initialValues(fields));
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await serviceApi.createOrder({
        clientName: state.clientName,
        patientCode: state.patientCode.trim(),
        dueOn: state.dueOn,
        services: state.instances.map((instance) => ({
          sellableItemUuid: instance.serviceUuid,
          answers: answersFor(instance.id, instance.serviceUuid),
          teeth: teethFor(state, instance.id),
        })),
      });
      showToast(`Order ${created.orderNumber} created (mock).`, { severity: 'success' });
      void navigate(ROUTES.orderServices(created.orderUuid));
    } catch (error) {
      setSubmitError(
        isApiError(error)
          ? `${error.message}${error.kind === 'blocked' ? '' : ' Nothing was created.'}`
          : 'Something went wrong. Nothing was created.',
      );
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step === DETAILS_STEP) void continueFromDetails();
    else if (step < LAST_STEP) goTo(step + 1);
    else void submit();
  };

  if (load.status === 'loading') {
    return (
      <>
        <PageHeader title="Create order" evidence />
        <LoadingState label="Loading the services…" rows={4} />
      </>
    );
  }
  if (load.status === 'error') {
    const kind = load.error?.kind;
    return (
      <>
        <PageHeader title="Create order" evidence />
        <ErrorState
          title={kind === 'forbidden' ? 'No access' : 'Could not load the services'}
          message={load.error?.message ?? 'Something went wrong. Try again.'}
        />
      </>
    );
  }

  const content = (() => {
    switch (step) {
      case 1:
        return <PatientStep wizard={wizard} clients={MOCK_CLIENTS} />;
      case 2:
        return <ServicesStep wizard={wizard} services={offered} />;
      case 3:
        return <TeethStep wizard={wizard} instanceLabel={instanceLabel} />;
      case DETAILS_STEP:
        return (
          <Stack spacing={2}>
            {detailsInvalid && (
              <InlineAlert severity="warning">
                Some service details are missing. Check the fields marked below.
              </InlineAlert>
            )}
            {state.instances.map((instance) => {
              const entry = offeredFor(instance.serviceUuid);
              if (!entry) return null;
              return (
                <InstanceDetailsForm
                  key={instance.id}
                  title={instanceLabel(instance.id)}
                  spec={entry.spec}
                  definition={entry.definition}
                  saved={state.values[instance.id]}
                  onValues={(values) => {
                    wizard.setValues(instance.id, values);
                  }}
                  register={register(instance.id)}
                />
              );
            })}
          </Stack>
        );
      default:
        return (
          <ReviewStep
            wizard={wizard}
            instanceLabel={instanceLabel}
            answeredCount={(instanceId) => {
              const instance = state.instances.find((entry) => entry.id === instanceId);
              return instance ? answersFor(instanceId, instance.serviceUuid).length : 0;
            }}
          />
        );
    }
  })();

  return (
    <>
      <PageHeader
        title="Create order"
        description="Five steps: patient and client, services, teeth, service details, review."
        evidence
      />
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <WizardStepper steps={STEP_LABELS} current={step} canReach={canReach} onSelect={goTo} />
      </Paper>
      <Box
        component="form"
        noValidate
        onSubmit={(event: React.SyntheticEvent) => {
          event.preventDefault();
          next();
        }}
      >
        <Stack spacing={2}>
          {wizard.showBlocked && step === 1 && (
            <InlineAlert severity="warning">Choose a client and enter a patient code to continue.</InlineAlert>
          )}
          {content}
          {submitError !== null && <InlineAlert severity="error">{submitError}</InlineAlert>}
          <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, pt: 1 }}>
            <AppButton
              variant="text"
              startIcon={<ArrowBackIcon />}
              disabled={submitting}
              onClick={() => {
                if (step === 1) void navigate(ROUTES.orders);
                else goTo(step - 1);
              }}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </AppButton>
            {step < LAST_STEP ? (
              <AppButton
                type="submit"
                startIcon={<ArrowForwardIcon />}
                ariaLabel={`Continue to ${STEP_LABELS[step] ?? ''}`}
              >
                Continue
              </AppButton>
            ) : (
              <AppButton type="submit" startIcon={<CheckIcon />} loading={submitting}>
                Create order
              </AppButton>
            )}
          </Stack>
        </Stack>
      </Box>
    </>
  );
}
