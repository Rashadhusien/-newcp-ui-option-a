/**
 * Conversion page: starts a new Conversion service on an order.
 */

import { PageHeader } from '@/shared/components/layout';
import { NewOrderButton } from './create/NewOrderButton';
import { NewServiceLauncher } from './NewServiceLauncher';

export default function ConversionPage() {
  return (
    <>
      <PageHeader title="Conversion" evidence action={<NewOrderButton />} />
      <NewServiceLauncher formKey="conversion" />
    </>
  );
}
