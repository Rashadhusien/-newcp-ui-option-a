import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { theme } from '@/theme/theme';
import { ThemeModeSwitch } from '@/shared/components/basic/ThemeModeSwitch';
import { PageHeader } from './PageHeader';

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PageHeader (A16b)', () => {
  it('leads the actions with the data source badge on data pages', () => {
    renderWithTheme(<PageHeader title="Report" evidence action={<button type="button">Act</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Report' })).toBeInTheDocument();
    const badge = screen.getByLabelText(/^Data source: MOCK/);
    const action = screen.getByRole('button', { name: 'Act' });
    expect(badge.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows no badge on pages without service data', () => {
    renderWithTheme(<PageHeader title="Settings" />);
    expect(screen.queryByLabelText(/^Data source/)).not.toBeInTheDocument();
  });
});

describe('ThemeModeSwitch (A16b)', () => {
  it('is one labelled group of three choices with a pressed state, never colour alone', () => {
    renderWithTheme(<ThemeModeSwitch />);
    expect(screen.getByRole('group', { name: 'Colour theme' })).toBeInTheDocument();
    const dark = screen.getByRole('button', { name: 'Dark theme' });
    expect(dark).toHaveTextContent('Dark');
    fireEvent.click(dark);
    expect(dark).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps the words in the accessible names when compact', () => {
    renderWithTheme(<ThemeModeSwitch compact />);
    expect(screen.getByRole('button', { name: 'System theme' })).not.toHaveTextContent('System');
  });
});
