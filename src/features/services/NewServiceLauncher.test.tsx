import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, type CatalogService } from '@/shared/api';
import { serviceApi } from './data/serviceApi';
import { NewServiceLauncher } from './NewServiceLauncher';

function row(code: string, serviceFamily?: CatalogService['serviceFamily']): CatalogService {
  return { uuid: `uuid-${code}`, code, name: code, itemKind: 'service', ...(serviceFamily ? { serviceFamily } : {}) };
}

describe('NewServiceLauncher (serviceFamily, PR #28)', () => {
  it('finds Conversion by its family, not by the first raw catalog row', async () => {
    vi.spyOn(serviceApi, 'catalog').mockResolvedValue([
      row('legacy_price_convcostoneshot'),
      row('legacy_price_convcostbsbbasicfull', 'conversion'),
      row('legacy_price_convcostcodxbasicquad', 'conversion'),
    ]);
    render(<NewServiceLauncher formKey="conversion" />);
    expect(await screen.findByText(/Add a Conversion service to an existing order/)).toBeInTheDocument();
    expect(screen.queryByText(/convcost/)).not.toBeInTheDocument();
  });

  it('keeps an unclassified catalog unsupported, naming the service', async () => {
    vi.spyOn(serviceApi, 'catalog').mockResolvedValue([row('legacy_price_convcostbsbbasicfull')]);
    render(<NewServiceLauncher formKey="conversion" />);
    expect(await screen.findByText(/Conversion is not available yet/)).toBeInTheDocument();
  });

  it('shows No access on 403 and a retry on other catalog errors', async () => {
    const catalog = vi
      .spyOn(serviceApi, 'catalog')
      .mockRejectedValueOnce(new ApiError(403, { code: 'PERMISSION_DENIED', message: 'Denied.' }));
    const { unmount } = render(<NewServiceLauncher formKey="biomodel" />);
    expect(await screen.findByText('No access')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry|try again/i })).not.toBeInTheDocument();
    unmount();
    catalog.mockRejectedValueOnce(new ApiError(500, { code: 'INTERNAL', message: 'Server error.' }));
    render(<NewServiceLauncher formKey="biomodel" />);
    expect(await screen.findByText('Could not load the catalog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
  });
});
