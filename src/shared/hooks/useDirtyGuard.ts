/**
 * useDirtyGuard: warns before unsaved edits are lost. The browser's own
 * prompt covers reload and close; the returned blocker covers in-app
 * navigation (render <LeavePageDialog blocker={blocker} /> next to the
 * form). Query-string changes on the same page are allowed.
 * Adapted from poc-mui hooks/useDirtyGuard.ts.
 */

import { useEffect } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';

export function useDirtyGuard(dirty: boolean): Blocker {
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [dirty]);

  return useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  );
}
