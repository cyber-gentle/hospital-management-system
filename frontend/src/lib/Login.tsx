import { FormEvent, useState } from 'react';
import { apiRequest } from './api';
import { useAuth, UserRole } from './auth';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await apiRequest<{ token: string; user: { id: string; username: string; role: UserRole; department: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      login(response.token, { id: response.user.id, name: response.user.username, email: '', role: response.user.role, department: response.user.department });
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : typeof cause === 'object' && cause !== null && 'message' in cause ? String(cause.message) : 'Unable to sign in.');
    } finally { setBusy(false); }
  }
  return <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <form onSubmit={submit} className="w-full max-w-sm rounded-xl border bg-white p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign in to HIMS</h1>
      <label className="block">Username<input className="mt-1 block w-full rounded border p-2" autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} /></label>
      <label className="block">Password<input className="mt-1 block w-full rounded border p-2" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded bg-blue-700 p-2 text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </main>;
}
