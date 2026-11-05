/**
 * 404 page for unknown routes inside the app shell.
 */

import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { ROUTES } from './routes';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Page not found" />
      <EmptyState
        title="This page does not exist"
        description="The link may be out of date, or the address was mistyped."
        actionLabel="Back to Home"
        onAction={() => {
          void navigate(ROUTES.home);
        }}
      />
    </>
  );
}
