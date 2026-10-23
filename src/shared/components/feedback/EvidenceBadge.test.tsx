import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvidenceBadge } from './EvidenceBadge';

describe('EvidenceBadge', () => {
  it('says MOCK in text, not only in colour', () => {
    render(<EvidenceBadge evidence="MOCK" />);
    expect(screen.getByText('MOCK')).toBeInTheDocument();
    expect(screen.getByLabelText(/Data source: MOCK/)).toBeInTheDocument();
  });

  it('says INTEGRATED for the real API', () => {
    render(<EvidenceBadge evidence="INTEGRATED" />);
    expect(screen.getByLabelText(/Data source: INTEGRATED/)).toBeInTheDocument();
  });
});
