/**
 * Create-order wizard state (A21, pattern from the earlier POC's
 * useOrderWizard). Five steps: patient and client, services, teeth, service
 * details, review. Each service the clerk adds is its own INSTANCE (two
 * Biomodels are two instances with their own answers and teeth).
 *
 * Forward needs: a client and a patient code (step 1), at least one service
 * (step 2); the details step is validated by its forms. Back is always
 * allowed. Mock only (Q-B24, Q-B25): see CreateOrderPage.
 */

import type { ServiceFamily } from '@/shared/api';
import { useState } from 'react';
import type { FormValues } from '../forms/formSpecs';

export interface WizardInstance {
  /** Local id, e.g. "biomodel-1"; the server gives the real UUID on create. */
  id: string;
  /** The service family the instance belongs to (one choice per family, PR #28). */
  family: ServiceFamily;
}

export interface WizardState {
  clientName: string;
  patientCode: string;
  /** ISO date (yyyy-mm-dd). */
  dueOn: string;
  instances: WizardInstance[];
  /** Teeth chosen for "all services" (FDI). */
  sharedTeeth: number[];
  /** Teeth per instance; an instance without its own uses the shared selection. */
  instanceTeeth: Partial<Record<string, number[]>>;
  /** Form values per instance (details step). */
  values: Partial<Record<string, FormValues>>;
}

export const STEP_LABELS = ['Patient and client', 'Services', 'Teeth', 'Service details', 'Review'] as const;
export const LAST_STEP = STEP_LABELS.length;
/** Most instances of one service type the wizard offers (demo choice, not a business rule). */
export const MAX_PER_SERVICE = 3;

function inTwoWeeks(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

export function teethFor(state: WizardState, instanceId: string): number[] {
  return state.instanceTeeth[instanceId] ?? state.sharedTeeth;
}

export function useCreateOrderWizard() {
  const [state, setState] = useState<WizardState>({
    clientName: '',
    patientCode: '',
    dueOn: inTwoWeeks(),
    instances: [],
    sharedTeeth: [],
    instanceTeeth: {},
    values: {},
  });
  const [step, setStep] = useState(1);
  const [showBlocked, setShowBlocked] = useState(false);

  const stepValid = (target: number): boolean => {
    if (target === 1) return state.clientName !== '' && state.patientCode.trim() !== '';
    if (target === 2) return state.instances.length > 0;
    return true;
  };
  /** A step is reachable when every step before it is complete. */
  const canReach = (target: number): boolean => {
    for (let index = 1; index < target; index += 1) if (!stepValid(index)) return false;
    return true;
  };

  const goTo = (target: number) => {
    if (target <= step || canReach(target)) {
      setShowBlocked(false);
      setStep(target);
    } else {
      setShowBlocked(true);
    }
  };

  const update = (patch: Partial<WizardState>) => {
    setState((current) => ({ ...current, ...patch }));
  };

  const addInstance = (family: ServiceFamily) => {
    const prefix = family;
    setState((current) => {
      const count = current.instances.filter((instance) => instance.family === family).length;
      if (count >= MAX_PER_SERVICE) return current;
      let n = count + 1;
      while (current.instances.some((instance) => instance.id === `${prefix}-${String(n)}`)) n += 1;
      return { ...current, instances: [...current.instances, { id: `${prefix}-${String(n)}`, family }] };
    });
  };

  const removeInstance = (id: string) => {
    setState((current) => ({
      ...current,
      instances: current.instances.filter((entry) => entry.id !== id),
      instanceTeeth: Object.fromEntries(Object.entries(current.instanceTeeth).filter(([key]) => key !== id)),
      values: Object.fromEntries(Object.entries(current.values).filter(([key]) => key !== id)),
    }));
  };

  const setTeeth = (instanceId: string | null, teeth: number[]) => {
    setState((current) =>
      instanceId === null
        ? { ...current, sharedTeeth: teeth }
        : { ...current, instanceTeeth: { ...current.instanceTeeth, [instanceId]: teeth } },
    );
  };

  const setValues = (instanceId: string, values: FormValues) => {
    setState((current) => ({ ...current, values: { ...current.values, [instanceId]: values } }));
  };

  return {
    state,
    step,
    showBlocked,
    stepValid,
    canReach,
    goTo,
    update,
    addInstance,
    removeInstance,
    setTeeth,
    setValues,
  };
}

export type CreateOrderWizard = ReturnType<typeof useCreateOrderWizard>;
