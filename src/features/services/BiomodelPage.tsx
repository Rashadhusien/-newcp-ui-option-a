/**
 * Models (Biomodel) page: starts a new Biomodel service on an order.
 */

import { PageHeader } from '@/shared/components/layout';
import { NewOrderButton } from './create/NewOrderButton';
import { NewServiceLauncher } from './NewServiceLauncher';

export default function BiomodelPage() {
  return (
    <>
      <PageHeader title="Models (Biomodel)" evidence action={<NewOrderButton />} />
      <NewServiceLauncher formKey="biomodel" />
    </>
  );
}
