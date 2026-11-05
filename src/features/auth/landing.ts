/**
 * Where a signed-in user lands after the sign-in page (A37).
 *
 * - preference "home": always Home (a saved page is discarded by the caller);
 * - a saved page from the session that just ended: used only for the same
 *   user, only while the route exists and the user's capabilities show the
 *   page's navigation entry (display only; the server still decides and its
 *   403 is shown on the page, never a sign-out);
 * - no saved page (first visit through a link): the requested page, if safe;
 * - anything else: Home.
 */

import { matchRoutes } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { router } from '@/app/router';
import { can, type SessionContext } from '@/shared/api';
import { NAV_SECTIONS, type NavLink } from '@/shared/components/layout/navigation';
import {
  isSafeReturnPath,
  readAfterSignIn,
  readReturnTo,
} from '@/shared/lib/returnTo';

function routeExists(path: string): boolean {
  const pathname = path.split(/[?#]/)[0] ?? path;
  const matches = matchRoutes(router.routes, pathname);
  const last = matches?.[matches.length - 1];
  return last !== undefined && last.route.path !== ROUTES.notFound;
}

function allowedByNavigation(path: string, context: SessionContext): boolean {
  const [pathname = path, search = ''] = path.split('?');
  const links = NAV_SECTIONS.flatMap((section) =>
    section.items.flatMap((item): NavLink[] => (item.kind === 'link' ? [item] : item.links)),
  );
  const hit = links.find((link) => link.isActive({ pathname, search: search === '' ? '' : `?${search}` }));
  return hit?.capability === undefined || can(context, hit.capability);
}

function usable(path: string, context: SessionContext): boolean {
  return isSafeReturnPath(path) && routeExists(path) && allowedByNavigation(path, context);
}

export function resolveLanding(context: SessionContext, requested: string | undefined): string {
  if (readAfterSignIn() === 'home') return ROUTES.home;
  const saved = readReturnTo();
  if (saved !== null) return saved.userUuid === context.user.id && usable(saved.path, context) ? saved.path : ROUTES.home;
  return requested !== undefined && usable(requested, context) ? requested : ROUTES.home;
}
