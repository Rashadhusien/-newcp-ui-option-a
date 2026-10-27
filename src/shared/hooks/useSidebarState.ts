/**
 * Auto-hiding sidebar (A17, ported from the earlier POC's useSidebarState and
 * adapted to the developer's Notion-style request):
 * - closed: hidden, takes no width; every page uses the full width.
 * - peek: hovering the header menu button (or the left edge) shows the
 *   sidebar over the content; it closes when the pointer leaves, on Escape
 *   or on a click outside.
 * - pinned: a click on the menu button docks the sidebar; the content
 *   shrinks to make room. Another click hides it again. The pinned choice is
 *   remembered in this browser (a convenience; storage failures are ignored).
 *
 * `floating` = a hover-capable pointer and a tablet or wider screen. Without
 * it (phones, touch) the menu button opens a modal drawer instead, which
 * handles Escape, backdrop clicks and focus itself.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FocusEvent, PointerEvent } from 'react';

export type SidebarState = 'closed' | 'peek' | 'pinned';

const PINNED_KEY = 'newcp-sidebar-pinned';
/** Hover delays (ms): long enough that passing over the button does not flash the sidebar. */
const PEEK_OPEN_DELAY = 120;
const PEEK_CLOSE_DELAY = 250;

function readPinned(): boolean {
  try {
    return localStorage.getItem(PINNED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writePinned(value: boolean): void {
  try {
    localStorage.setItem(PINNED_KEY, String(value));
  } catch {
    // The choice is simply not remembered.
  }
}

const isMouse = (event: PointerEvent) => event.pointerType === 'mouse' || event.pointerType === 'pen';

export function useSidebarState(floating: boolean) {
  const [state, setState] = useState<SidebarState>(() => (floating && readPinned() ? 'pinned' : 'closed'));
  // Switching between floating and modal (resize, pointer change) restarts from the remembered choice.
  const [prevFloating, setPrevFloating] = useState(floating);
  if (prevFloating !== floating) {
    setPrevFloating(floating);
    setState(floating && readPinned() ? 'pinned' : 'closed');
  }

  const paperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const pointerInside = useRef(false);

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const closePeek = useCallback(() => {
    setState((current) => (current === 'peek' ? 'closed' : current));
  }, []);

  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      // A keyboard user working inside a peeked sidebar keeps it until focus leaves.
      if (paperRef.current?.contains(document.activeElement)) return;
      closePeek();
    }, PEEK_CLOSE_DELAY);
  }, [closePeek]);

  const close = useCallback(() => {
    clearTimers();
    setState((current) => {
      if (current === 'pinned') writePinned(false);
      return 'closed';
    });
  }, [clearTimers]);

  /** Menu button click: closed or peek -> pinned (floating) or open (modal); open -> closed. */
  const toggle = () => {
    clearTimers();
    const next: SidebarState = state === 'pinned' || (!floating && state !== 'closed') ? 'closed' : 'pinned';
    if (floating) writePinned(next === 'pinned');
    setState(next);
  };

  /** Spread on the menu button and the left-edge strip: hovering peeks. */
  const hoverProps = {
    onPointerEnter: (event: PointerEvent) => {
      if (!floating || !isMouse(event)) return;
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(openTimer.current);
      openTimer.current = window.setTimeout(() => {
        setState((current) => (current === 'closed' ? 'peek' : current));
      }, PEEK_OPEN_DELAY);
    },
    onPointerLeave: () => {
      if (!floating) return;
      window.clearTimeout(openTimer.current);
      scheduleClose();
    },
  };

  /** Spread on the peeking sidebar's paper: it stays while the pointer or focus is inside. */
  const paperProps = {
    onPointerEnter: () => {
      pointerInside.current = true;
      window.clearTimeout(closeTimer.current);
    },
    onPointerLeave: (event: PointerEvent) => {
      pointerInside.current = false;
      if (isMouse(event)) scheduleClose();
    },
    onBlur: (event: FocusEvent) => {
      const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (!pointerInside.current && !(next && paperRef.current?.contains(next))) closePeek();
    },
  };

  // Peek only: Escape and a press outside the sidebar and the menu button close it. Pinned stays.
  useEffect(() => {
    if (!floating || state !== 'peek') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      // Escape inside another popup (menu, dialog, listbox) belongs to that popup.
      if (target?.closest('[role="dialog"], [role="menu"], [role="listbox"]')) return;
      const inside = Boolean(target && paperRef.current?.contains(target));
      closePeek();
      if (inside) buttonRef.current?.focus();
    };
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (!target || paperRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      closePeek();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [floating, state, closePeek]);

  return { state, toggle, close, closePeek, paperRef, buttonRef, hoverProps, paperProps };
}
