import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, type CatalogService, type ServiceItem } from '@/shared/api';
import { ToastProvider } from '@/shared/components/feedback';
import { MOCK_ORDER_UUID, MOCK_SERVICE_ITEMS } from '@/mocks/serviceFixtures';
import { serviceApi } from '../data/serviceApi';
import { BIOMODEL_SPEC } from './formSpecs';
import { mockFormDefinition } from '@/test/mockFormDefinition';
import { ServiceForm } from './ServiceForm';

const BIOMODEL: CatalogService = {
  uuid: '00000000-0000-0000-0000-000000000003',
  code: 'biomodel_other_services',
  name: 'Biomodel',
  itemKind: 'service',
};

// The app always calls the real API (A38); here an in-memory fake stands in for it.
vi.mock('../data/serviceApi', async () => {
  const { createFakeServiceApi } = await import('@/test/fakeServiceApi');
  return { serviceApi: createFakeServiceApi() };
});

function renderForm(item: ServiceItem | null = null, etag: string | null = null, onReload = vi.fn()) {
  const definition = mockFormDefinition(BIOMODEL, BIOMODEL_SPEC);
  const router = createMemoryRouter(
    [
      {
        path: '/new',
        element: (
          <ServiceForm
            spec={BIOMODEL_SPEC}
            definition={definition}
            item={item}
            etag={etag}
            orderUuid={MOCK_ORDER_UUID}
            onReload={onReload}
          />
        ),
      },
      { path: '/services/:serviceItemUuid/edit', element: <p>Edit page</p> },
    ],
    { initialEntries: ['/new'] },
  );
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  return { router, onReload };
}

function renderCreateForm() {
  return renderForm();
}

describe('ServiceForm (create, Biomodel)', () => {
  it('blocks submit with an error summary, then creates and opens the new instance', async () => {
    const { router } = renderCreateForm();
    const submit = screen.getByRole('button', { name: 'Create Biomodel service' });

    fireEvent.click(submit);
    const summary = (await screen.findByText(/1 problem to fix/)).closest('[role="alert"]');
    // Focus moves in an effect just after the summary renders; wait for it (was flaky under load).
    await waitFor(() => {
      expect(summary).toHaveFocus();
    });
    // The MOCK evidence note is a status, not an alert.
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(/MOCK: fields from the v0\.6/);

    const maxilla = screen.getByRole('radiogroup', { name: 'Customization (maxilla)' });
    fireEvent.click(within(maxilla).getByLabelText('Full Arch'));
    // The maxilla colour appears only once that arch has a customization.
    expect(screen.getByRole('radiogroup', { name: 'Color (maxilla)' })).toBeInTheDocument();

    fireEvent.click(submit);
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/services\/.+\/edit$/);
    });
    expect(await screen.findByText(/Biomodel service created \(line \d+\)\./)).toBeInTheDocument();
  }, 15_000); // several form steps; the default 5 s is too tight under a full parallel run

  it('shows a server 422 on its field and saves nothing', async () => {
    const create = vi
      .spyOn(serviceApi, 'create')
      .mockRejectedValue(new ApiError(422, { code: 'invalid', message: 'Too long.', details: { field: 'rxNote' } }));
    const { router } = renderCreateForm();

    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Customization (mandible)' })).getByLabelText('Q-L'));
    fireEvent.click(screen.getByRole('button', { name: 'Create Biomodel service' }));

    expect(await screen.findByText('Too long.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'RX note' })).toHaveAccessibleDescription('Too long.');
    expect(router.state.location.pathname).toBe('/new');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('shows a 409 above the form and stays on the page', async () => {
    vi.spyOn(serviceApi, 'create').mockRejectedValue(
      new ApiError(409, { code: 'locked', message: 'The order is locked by another user.' }),
    );
    const { router } = renderCreateForm();
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Customization (mandible)' })).getByLabelText('Q-L'));
    fireEvent.click(screen.getByRole('button', { name: 'Create Biomodel service' }));

    expect(await screen.findByText('The order is locked by another user. Nothing was saved.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/new');
  });
});

describe('ServiceForm (edit, Q-B8 concurrency)', () => {
  const ITEM = MOCK_SERVICE_ITEMS.at(0);
  if (!ITEM) throw new Error('fixture missing');

  it('sends the loaded version as If-Match', async () => {
    const edit = vi.spyOn(serviceApi, 'edit').mockResolvedValue({ data: ITEM, etag: '"rev-2"' });
    renderForm(ITEM, '"rev-1"');
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Customization (mandible)' })).getByLabelText('Q-L'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(edit).toHaveBeenCalledWith(ITEM.uuid, expect.objectContaining({ answers: expect.any(Array) as unknown }), '"rev-1"');
    });
  });

  it('on 412 keeps the edits, saves nothing and offers a reload', async () => {
    vi.spyOn(serviceApi, 'edit').mockRejectedValue(new ApiError(412, { code: 'stale', message: 'Changed.' }));
    const { onReload } = renderForm(ITEM, '"rev-1"');
    const mandible = within(screen.getByRole('radiogroup', { name: 'Customization (mandible)' }));
    fireEvent.click(mandible.getByLabelText('Q-L'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(/Someone else changed this service/)).toBeInTheDocument();
    expect(mandible.getByLabelText('Q-L')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
