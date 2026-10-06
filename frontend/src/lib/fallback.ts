import { DEMO_MODE } from './demo';

/** Production requests never turn a failed backend call into a local success. */
export function rethrowBackendRejection(error: unknown): void {
	if (!DEMO_MODE) throw error;
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    if (!DEMO_MODE || error.status === 401 || error.status === 403) {
      throw error;
    }
  }
}

export async function fallbackFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('hims_auth_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(5000) });
  // Strict explicit demo mode separation:
  // If NOT in demo mode, ANY error is a hard failure.
  // If IN demo mode, we still hard fail for 401/403 auth errors, but allow fallback for 404/500/connection errors (since backend isn't there)
  if (!response.ok) {
     if (!DEMO_MODE || response.status === 401 || response.status === 403) {
         throw Object.assign(new Error(`Backend rejected the request (HTTP ${response.status}).`), { status: response.status });
     }
  }
  return response;
}
