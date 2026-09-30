/** A backend rejection must never become a successful local mutation. */
export function rethrowBackendRejection(error: unknown): void {
  if (typeof error === 'object' && error !== null && 'status' in error &&
      typeof error.status === 'number' && error.status >= 400 && error.status < 500 && error.status !== 404) {
    throw error;
  }
}

export async function fallbackFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('hims_auth_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(5000) });
  if (!response.ok && response.status < 500 && response.status !== 404) {
    throw Object.assign(new Error(`Backend rejected the request (HTTP ${response.status}).`), { status: response.status });
  }
  return response;
}
