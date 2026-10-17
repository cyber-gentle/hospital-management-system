import { useEffect, useState } from 'react';
import { liveAdminApi, type Directory, type NewAccount, type SecurityPolicy } from './liveApi';
const empty:NewAccount = {username:'',email:'',firstName:'',lastName:'',role:'',department:'',password:''};
const message = (e:unknown) => typeof e==='object' && e!==null && 'message' in e ? String(e.message) : 'Administration request failed';
export function LiveAdminView() {
 const [data,setData] = useState<Directory|null>(null);
 const [error,setError] = useState('');
 const [notice,setNotice] = useState('');
 const [busy,setBusy] = useState(false);
 const [revision,setRevision] = useState(0);
 const [input,setInput] = useState<NewAccount>(empty);
 const [selected,setSelected] = useState('');
 const [permission,setPermission] = useState('');
 const [newPassword,setNewPassword] = useState('');
 const [reason,setReason] = useState('');
 const [identityVerified,setIdentityVerified] = useState(false);
 const [policy,setPolicy] = useState<SecurityPolicy|null>(null);
 const [policyError,setPolicyError] = useState('');
 useEffect(()=>{setNewPassword('');setReason('');setIdentityVerified(false);},[selected]);
 useEffect(() => {
  const controller = new AbortController();setData(null);setError('');
  liveAdminApi.directory(controller.signal).then(setData).catch((e:unknown) => {if(!controller.signal.aborted)setError(message(e));});
  setPolicyError('');
  liveAdminApi.security(controller.signal).then(setPolicy).catch((e:unknown)=>{if(!controller.signal.aborted)setPolicyError(message(e));});
  return () => controller.abort();
 },[revision]);
 const mutate = async (action:()=>Promise<unknown>,success:string) => {
  setBusy(true);setError('');setNotice('');
  try {await action();setNotice(success);setRevision(v=>v+1);} catch(e:unknown){setError(message(e));} finally{setBusy(false);}
 };
 const roles = data ? [...new Set([...data.users.map(u=>u.role),...data.roleGrants.map(g=>g.role)])].sort() : [];
 const user = data?.users.find(u=>u.id===selected);
 return <section className="space-y-6 p-6">
  <h1 className="text-2xl font-bold">Account administration</h1>
  <p>ADMIN manages accounts and grants. AUDITOR reviews only. All changes are audited.</p>
  {error && <p role="alert" className="text-red-700">{error}</p>}
  {notice && <p role="status">{notice}</p>}
  {!data && !error && <p>Loading…</p>}
  <button disabled={busy} onClick={()=>setRevision(v=>v+1)}>Refresh directory</button>
  {data && <>
   <h2 className="font-bold">Named staff accounts</h2>
   <table className="w-full text-left"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Department</th><th>Active</th></tr></thead>
   <tbody>{data.users.map(u=><tr key={u.id}><td><button onClick={()=>setSelected(u.id)}>{u.first_name} {u.last_name}</button></td><td>{u.username}</td><td>{u.role}</td><td>{u.department}</td><td>{u.is_active?'Yes':'No'}</td></tr>)}</tbody></table>
   <label>Review account <select className="border p-2" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select staff account</option>{data.users.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}</select></label>
   {user && <div className="space-y-3 rounded border p-4">
    <h2 className="font-bold">{user.username}: effective access sources</h2>
    {user.role==='ADMIN' && <p>ADMIN has universal module access under the existing authorization policy.</p>}
    <p>Role grants: {data.roleGrants.filter(g=>g.role===user.role).map(g=>g.permission_id).join(', ') || 'None'}</p>
    <ul>{data.userGrants.filter(g=>g.user_id===user.id).map(g=><li key={g.permission_id}>{g.permission_id} {data.canManage && <button disabled={busy} onClick={()=>void mutate(()=>liveAdminApi.revoke(user.id,g.permission_id),'Individual grant revoked. Role grants still apply.')}>Revoke individual grant</button>}</li>)}</ul>
    {data.canManage && <div className="space-y-3">
     <p>Password reset and reactivation invalidate all earlier logins. An inactive account remains inactive after password reset.</p>
     <label>Reason (do not include passwords) <input required maxLength={500} className="w-full border p-2" value={reason} onChange={e=>setReason(e.target.value)} /></label>
     <form onSubmit={e=>{e.preventDefault();const password=newPassword;setNewPassword('');void mutate(()=>liveAdminApi.resetPassword(user.id,password,reason),'Password reset. Earlier sessions revoked; sign in again if this is your account.');}}>
      <label>New password <input required type="password" autoComplete="new-password" minLength={12} maxLength={72} className="border p-2" value={newPassword} onChange={e=>setNewPassword(e.target.value)} /></label>
      <button disabled={busy || !reason.trim()}>Reset password and revoke sessions</button>
     </form>
     {!user.is_active && <button disabled={busy || !reason.trim()} onClick={()=>void mutate(()=>liveAdminApi.reactivate(user.id,reason),'Account reactivated. A fresh login is required.')}>Reactivate account and revoke sessions</button>}
     <button disabled={busy || !reason.trim()} onClick={()=>void mutate(()=>liveAdminApi.unlock(user.id,reason),'Account lockout cleared. MFA is still required.')}>Unlock account</button>
     <label className="block"><input type="checkbox" checked={identityVerified} onChange={e=>setIdentityVerified(e.target.checked)} /> I have verified this staff member’s identity for MFA recovery.</label>
     <button disabled={busy || !reason.trim() || !identityVerified} onClick={()=>void mutate(()=>liveAdminApi.resetMFA(user.id,reason),'MFA reset. Previous sessions and backup codes revoked; authenticator enrollment is required at next login.')}>Reset MFA for another staff member</button>
    </div>}
    {data.canManage && <form onSubmit={e=>{e.preventDefault();void mutate(()=>liveAdminApi.grant(user.id,permission),'Individual permission granted.');}}>
     <label>Permission <select className="border p-2" required value={permission} onChange={e=>setPermission(e.target.value)}><option value="">Select permission</option>{data.permissions.map(p=><option key={p.id} value={p.id}>{p.id}</option>)}</select></label>
     <button disabled={busy}>Grant permission</button>
    </form>}
   </div>}
   {data.canManage && <form className="grid gap-3 rounded border p-4" onSubmit={e=>{
    e.preventDefault();const submitted={...input};setInput({...input,password:''});
    void mutate(()=>liveAdminApi.create(submitted),'Staff account created.');
   }}>
    <h2 className="font-bold">Create named staff account</h2>
    {(['username','email','firstName','lastName','department','password'] as const).map(field=><label key={field}>{({username:'Username',email:'Email',firstName:'First name',lastName:'Last name',department:'Department',password:'Initial password'})[field]}
     <input className="w-full border p-2" required type={field==='password'?'password':field==='email'?'email':'text'} autoComplete={field==='password'?'new-password':'off'} minLength={field==='password'?12:1} maxLength={field==='password'?72:field==='email'?255:100} value={input[field]} onChange={e=>setInput({...input,[field]:e.target.value})}/></label>)}
    <label>Existing role <select className="border p-2" required value={input.role} onChange={e=>setInput({...input,role:e.target.value})}><option value="">Select role</option>{roles.map(role=><option key={role}>{role}</option>)}</select></label>
    <button disabled={busy}>Create account</button>
   </form>}
  </>}
  <h2 className="font-bold">Enforced security policy</h2>
  {policyError && <p role="alert">Security policy could not be loaded: {policyError}</p>}
  {policy && <p>MFA is required for all staff. {policy.max_failed_attempts} consecutive failed sign-ins cause a {policy.lockout_minutes}-minute lockout. Sessions expire after {policy.idle_timeout_minutes} minutes without a server request. These approved settings are read-only.</p>}
  <p>Reactivation restores inactive accounts. Unlocking clears a timed sign-in lockout. Neither action removes MFA.</p>
 </section>;
}
