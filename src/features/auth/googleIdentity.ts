/**
 * Google Identity Services (A25): loads Google's script at runtime (no npm
 * package) and renders Google's own "Sign in with Google" button, which is
 * the only way GIS hands out an ID token. Google is authentication only: the
 * token is passed straight to the New CP login endpoint (D-67).
 */

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
}

function accountsId(): GoogleAccountsId | null {
  const google: unknown = (window as unknown as { google?: unknown }).google;
  if (typeof google !== 'object' || google === null) return null;
  const accounts = (google as { accounts?: { id?: GoogleAccountsId } }).accounts;
  return accounts?.id ?? null;
}

let loading: Promise<GoogleAccountsId> | null = null;

/** Loads the GIS script once; rejects if it cannot load (offline, blocked). */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  const ready = accountsId();
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const id = accountsId();
      if (id) resolve(id);
      else reject(new Error('Google Identity Services did not start.'));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error('Google Identity Services could not be loaded.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export interface GoogleButtonOptions {
  clientId: string;
  dark: boolean;
  width: number;
  onIdToken: (idToken: string) => void;
  onFailure: () => void;
}

/** Renders Google's button into `parent`; the ID token arrives through `onIdToken`. */
export async function renderGoogleButton(parent: HTMLElement, options: GoogleButtonOptions): Promise<void> {
  const id = await loadGoogleIdentity();
  id.initialize({
    client_id: options.clientId,
    ux_mode: 'popup',
    auto_select: false,
    cancel_on_tap_outside: true,
    callback: (response) => {
      if (response.credential) options.onIdToken(response.credential);
      else options.onFailure();
    },
  });
  id.renderButton(parent, {
    type: 'standard',
    theme: options.dark ? 'filled_black' : 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: options.width,
  });
}
