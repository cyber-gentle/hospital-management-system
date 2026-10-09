import { DEMO_MODE } from './demo';

/** Only explicit demos may use missing-endpoint/service fallback. */
export async function strictModuleFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('hims_auth_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(5000) });
  if (!response.ok) {
    let message = `Backend rejected the request (HTTP ${response.status}).`;
    try {
      const body = await response.clone().json() as { error?: string; message?: string; detail?: unknown };
      message = body.error ?? body.message ?? (typeof body.detail === 'string' ? body.detail : message);
    } catch { /* Retain HTTP status if the response is not JSON. */ }
    if (!DEMO_MODE || (response.status < 500 && response.status !== 404)) {
      throw Object.assign(new Error(message), { status: response.status });
    }
  }
  return response;
}
