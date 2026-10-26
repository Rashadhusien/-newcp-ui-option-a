import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '@/app/SessionProvider';
import { ApiError } from '@/shared/api';
import { ToastProvider } from '@/shared/components/feedback';
import { chooseMockIdentity, clearMockIdentity } from '@/shared/lib/session';
import { MOCK_SERVICE_ITEMS } from '@/mocks/serviceFixtures';
import type { MockIdentity } from '@/mocks/sessionFixtures';
import { serviceApi } from './data/serviceApi';
import { staffPatch, staffValuesOf } from './detail/staffFields';
import ServiceDetailPage from './ServiceDetailPage';

// The app's mock adapter waits 300 ms per call; this page chains several calls, which made the
// On Hold test load-sensitive (D-63). Here the mock answers without delay, so every wait below
// depends only on rendered state, never on wall-clock time.
vi.mock('./data/mockServiceApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./data/mockServiceApi')>();
  return {
    ...actual,
    createMockServiceApi: (options: Parameters<typeof actual.createMockServiceApi>[0] = {}) =>
      actual.createMockServiceApi({ ...options, latencyMs: 0 }),
  };
});

const [LINE_1, LINE_2] = MOCK_SERVICE_ITEMS.map((item) => item.uuid);
const SLOW = { timeout: 4000 };

function renderDetail(uuid: string | undefined, identity: MockIdentity = 'CS') {
  chooseMockIdentity(identity);
  const router = createMemoryRouter([{ path: '/services/:serviceItemUuid', element: <ServiceDetailPage /> }], {
    initialEntries: [`/services/${uuid ?? ''}`],
  });
  render(
    <ToastProvider>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  clearMockIdentity();
});

describe('staffPatch', () => {
  it('sends only the changed fields, and a cleared reason as null', () => {
    const initial = { ...staffValuesOf(MOCK_SERVICE_ITEMS[0]), zeroChargeReasonCode: 'mock-redo' };
    expect(staffPatch(initial, initial)).toEqual({});
    expect(staffPatch(initial, { ...initial, unitPrice: '18.00', zeroChargeReasonCode: '' })).toEqual({
      unitPrice: '18.00',
      zeroChargeReasonCode: null,
    });
    expect(staffPatch(initial, { ...initial, quantity: '1.5', isBillable: false })).toEqual({
      quantity: 1.5,
      isBillable: false,
    });
  });
});

describe('ServiceDetailPage (A7R, mock)', () => {
  it('puts one instance on hold with type and reason in the same request, leaving its twin unchanged', async () => {
    renderDetail(LINE_1);
    const hold = await screen.findByRole('button', { name: 'Put on hold' }, SLOW);
    fireEvent.click(hold);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Demo only/, { selector: 'div' })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Put on hold' }));
    expect(within(dialog).getByText('Choose a hold type.')).toBeInTheDocument();

    const transition = vi.spyOn(serviceApi, 'transition');
    fireEvent.click(within(dialog).getByRole('radio', { name: /Internal hold/ }));
    fireEvent.mouseDown(await within(dialog).findByRole('combobox', {}, SLOW));
    fireEvent.click(await screen.findByRole('option', { name: 'Demo only — Internal review' }, SLOW));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Put on hold' }));

    await waitFor(() => {
      expect(transition).toHaveBeenCalledWith(
        LINE_1,
        expect.objectContaining({ holdType: 'internal', holdReasonCode: 'SYNTHETIC_INTERNAL_REVIEW' }),
        expect.stringMatching(/^"rev-/),
      );
    }, SLOW);
    expect(await screen.findByRole('list', { name: 'Status history, line 1' }, SLOW)).toHaveTextContent(/On hold/);
    expect((await serviceApi.item(LINE_2)).data.status).toBe('in_design');
  });

  it('shows the zero-charge 422 on its field and saves nothing', async () => {
    renderDetail(LINE_1);
    const price = await screen.findByRole('textbox', { name: /Unit price/ }, SLOW);
    await waitFor(() => {
      expect(price).toBeEnabled();
    });
    fireEvent.change(price, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save staff fields' }));
    expect(
      await screen.findAllByText('The line total is zero, so a zero-charge reason is required.', {}, SLOW),
    ).not.toHaveLength(0);
    expect((await serviceApi.item(LINE_1)).data.unitPrice).toBe('20.00');
  });

  it('keeps the user value and offers a reload on 412', async () => {
    vi.spyOn(serviceApi, 'edit').mockRejectedValue(new ApiError(412, { code: 'PRECONDITION_FAILED', message: 'x' }));
    renderDetail(LINE_1);
    const quantity = await screen.findByRole('textbox', { name: /Quantity/ }, SLOW);
    await waitFor(() => {
      expect(quantity).toBeEnabled();
    });
    fireEvent.change(quantity, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save staff fields' }));
    expect(await screen.findByText(/nothing was saved/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload latest' })).toBeInTheDocument();
    expect(quantity).toHaveValue('2');
  });

  it('makes the price read-only where the item does not allow an override', async () => {
    renderDetail(LINE_2);
    const quantity = await screen.findByRole('textbox', { name: /Quantity/ }, SLOW);
    await waitFor(() => {
      expect(quantity).toBeEnabled();
    });
    expect(screen.getByRole('textbox', { name: /Unit price/ })).toBeDisabled();
  });

  it('shows No access without retry for a role that only sees reports', async () => {
    renderDetail(LINE_1, 'FINANCE');
    expect(await screen.findByText('No access', {}, SLOW)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry/ })).not.toBeInTheDocument();
  });
});
