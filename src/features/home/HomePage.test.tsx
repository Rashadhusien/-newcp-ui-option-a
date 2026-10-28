import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SessionContextValue, type SessionValue } from '@/shared/hooks/useSession';
import { mockSessionContext, type MockIdentity } from '@/mocks/sessionFixtures';
import HomePage from './HomePage';

function renderHome(identity: MockIdentity) {
  const context = mockSessionContext(identity);
  const session: SessionValue = {
    state: { status: 'ready', context },
    context,
    refresh: () => undefined,
    signIn: () => undefined,
    signInWithSession: () => undefined,
    signOut: () => undefined,
  };
  render(
    <MemoryRouter initialEntries={['/home']}>
      <SessionContextValue.Provider value={session}>
        <HomePage />
      </SessionContextValue.Provider>
    </MemoryRouter>,
  );
  const list = screen.getByRole('list', { name: 'Quick access' });
  return within(list)
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent);
}

describe('HomePage (A27)', () => {
  it('shows CS every card its capabilities allow, greeting and role from the context', () => {
    expect(renderHome('CS')).toEqual([
      'Report',
      'All orders',
      'New Biomodel',
      'New Conversion',
      'Settings',
      'Help and support',
    ]);
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Demo CS (mock)' })).toBeInTheDocument();
    expect(screen.getByLabelText('Role: CS')).toBeInTheDocument();
  });

  it.each<MockIdentity>(['FINANCE', 'QC'])('shows %s only the report, settings and help', (identity) => {
    expect(renderHome(identity)).toEqual(['Report', 'Settings', 'Help and support']);
  });
});
