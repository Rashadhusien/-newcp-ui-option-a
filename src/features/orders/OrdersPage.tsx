/**
 * Orders placeholder page. The real screen is built in A6 to A9.
 */

import { EmptyState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="Orders" />
      <EmptyState title="Not built yet" description="This screen arrives in a later task." />
    </>
  );
}
