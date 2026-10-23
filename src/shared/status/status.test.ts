import { describe, expect, it } from 'vitest';
import { humanizeStatus, presentStatus } from './status';

describe('presentStatus', () => {
  it('maps a known API value to label and tone', () => {
    expect(presentStatus('in_design')).toMatchObject({ label: 'In design', semantic: 'primary', known: true });
    expect(presentStatus('on_hold')).toMatchObject({ label: 'On hold', semantic: 'warning', known: true });
  });

  it('renders an unknown value with the neutral fallback', () => {
    expect(presentStatus('awaiting_package')).toMatchObject({
      label: 'Awaiting package',
      semantic: 'neutral',
      known: false,
    });
  });

  it('does not treat object prototype keys as statuses', () => {
    expect(presentStatus('toString').known).toBe(false);
  });
});

describe('humanizeStatus', () => {
  it('turns codes into sentence case and keeps labels', () => {
    expect(humanizeStatus('pending_information')).toBe('Pending information');
    expect(humanizeStatus('In Progress')).toBe('In Progress');
    expect(humanizeStatus('')).toBe('Unknown');
  });
});
