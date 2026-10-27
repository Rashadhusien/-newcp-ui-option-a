/**
 * WizardStepper (A21, ported from the earlier POC): step navigation for
 * multi-step forms. Desktop: clickable steps (back freely, forward when
 * allowed). Below 1024: "Step 2 of 5 · Services" with a progress bar.
 */

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export interface WizardStepperProps {
  steps: readonly string[];
  /** 1-based current step. */
  current: number;
  canReach: (step: number) => boolean;
  onSelect: (step: number) => void;
}

export function WizardStepper({ steps, current, canReach, onSelect }: WizardStepperProps) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  if (compact) {
    return (
      <Box aria-live="polite">
        <Typography variant="subtitle2">
          {`Step ${String(current)} of ${String(steps.length)} · ${steps[current - 1] ?? ''}`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(current / steps.length) * 100}
          aria-label="Wizard progress"
          sx={{ mt: 1 }}
        />
      </Box>
    );
  }

  return (
    <Stepper nonLinear activeStep={current - 1} alternativeLabel aria-label="Wizard steps">
      {steps.map((label, index) => {
        const step = index + 1;
        return (
          <Step key={label} completed={step < current}>
            <StepButton
              disabled={step === current || !canReach(step)}
              onClick={() => {
                onSelect(step);
              }}
            >
              {label}
            </StepButton>
          </Step>
        );
      })}
    </Stepper>
  );
}
