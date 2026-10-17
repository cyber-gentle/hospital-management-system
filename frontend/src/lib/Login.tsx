import { FormEvent, useState } from 'react';
import { apiRequest } from './api';
import { useAuth, UserRole } from './auth';

type AuthenticatedResponse = { token: string; user: { id: string; username: string; role: UserRole; department: string }; backup_codes?: string[] };
type MFAResponse = { mfa_required: true; enrollment_required: boolean; secret?: string };

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [mfa, setMfa] = useState<MFAResponse | null>(null);
  const [completed, setCompleted] = useState<AuthenticatedResponse | null>(null);
  function finish(response: AuthenticatedResponse) {
    login(response.token, { id: response.user.id, name: response.user.username, email: '', role: response.user.role, department: response.user.department });
    setPassword(''); setCode(''); setMfa(null); setCompleted(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await apiRequest<AuthenticatedResponse | MFAResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, code: code.trim() }) });
      if ('mfa_required' in response) { setMfa(response); setCode(''); }
      else if (response.backup_codes?.length) { setCompleted(response); setPassword(''); setCode(''); setMfa(null); }
      else { finish(response); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : typeof cause === 'object' && cause !== null && 'message' in cause ? String(cause.message) : 'Unable to sign in.');
    } finally { setBusy(false); }
  }
  if (completed) return <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <section className="w-full max-w-lg rounded-xl border bg-white p-6 space-y-4">
      <h1 className="text-xl font-semibold">Save your backup codes</h1>
      <p>Store these codes somewhere private and secure. Each code works once with your password if you lose your authenticator. They will not be shown again.</p>
      <ul className="font-mono text-sm space-y-2">{completed.backup_codes?.map(backup => <li key={backup}>{backup}</li>)}</ul>
      <button className="rounded bg-blue-700 p-2 text-white" onClick={() => finish(completed)}>I have saved my codes — continue</button>
    </section>
  </main>;
  return <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <form onSubmit={submit} className="w-full max-w-sm rounded-xl border bg-white p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign in to HIMS</h1>
      <label className="block">Username<input className="mt-1 block w-full rounded border p-2" autoComplete="username" required value={username} onChange={event => { setUsername(event.target.value); setMfa(null); setCode(''); }} /></label>
      <label className="block">Password<input className="mt-1 block w-full rounded border p-2" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      {mfa?.enrollment_required && <div className="space-y-2"><p>Add a time-based account named HIMS in your authenticator app using this setup key, then enter its six-digit code.</p><code className="block break-all rounded bg-slate-100 p-2">{mfa.secret}</code></div>}
      {mfa && <label className="block">{mfa.enrollment_required ? 'Authenticator code' : 'Authenticator or backup code'}<input className="mt-1 block w-full rounded border p-2" autoComplete="one-time-code" required maxLength={32} value={code} onChange={event => setCode(event.target.value)} /></label>}
      <p className="text-sm text-slate-600">Five failed attempts lock your account for 15 minutes. Sessions expire after 30 minutes of inactivity.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded bg-blue-700 p-2 text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </main>;
}
