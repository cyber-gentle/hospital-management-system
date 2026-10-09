import { DEMO_MODE } from './demo';

/** Production requests never turn a failed backend call into a local success. */
export function rethrowBackendRejection(error: unknown): void {
  if (!DEMO_MODE) throw error;
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    if (error.status < 500 && error.status !== 404) {
      throw error;
    }
  }
}

export async function fallbackFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('hims_auth_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(5000) });
  // Demo fallback is for missing endpoints or unavailable services only.
  // Validation, conflicts, throttling and permission errors still reject.
  if (!response.ok) {
     if (!DEMO_MODE || (response.status < 500 && response.status !== 404)) {
         throw Object.assign(new Error(`Backend rejected the request (HTTP ${response.status}).`), { status: response.status });
     }
  }
  return response;
}
