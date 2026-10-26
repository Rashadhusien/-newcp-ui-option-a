/**
 * Conversion page: starts a new Conversion service on an order.
 */

import { PageHeader } from '@/shared/components/layout';
import { NewServiceLauncher } from './NewServiceLauncher';

export default function ConversionPage() {
  return (
    <>
      <PageHeader title="Conversion" evidence />
      <NewServiceLauncher formKey="conversion" />
    </>
  );
}
