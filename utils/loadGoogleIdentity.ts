/**
 * Lazy-loads Google Identity Services script only when needed (Login page).
 * Uses a singleton promise to avoid double-loading.
 */
let gisPromise: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return gisPromise;
}
