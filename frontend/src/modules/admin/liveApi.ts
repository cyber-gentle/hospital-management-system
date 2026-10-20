import { apiRequest } from '../../lib/api';
export type StaffAccount = {id:string;username:string;email:string;first_name:string;last_name:string;role:string;department:string;is_active:boolean};
export type Directory = { users:StaffAccount[];permissions:{id:string;module:string;action:string;description:string|null}[];roleGrants:{role:string;permission_id:string}[];userGrants:{user_id:string;permission_id:string}[];canManage:boolean };
export type NewAccount = {username:string;email:string;firstName:string;lastName:string;role:string;department:string;password:string};
export type SecurityPolicy = {max_failed_attempts:number;lockout_minutes:number;idle_timeout_minutes:number;mfa_required_for:string};
export const liveAdminApi = {
 security: (signal?:AbortSignal) => apiRequest<SecurityPolicy>('/admin/security',{signal}),
 unlock: (userId:string,reason:string) => apiRequest('/admin/security/users/'+encodeURIComponent(userId)+'/unlock',{method:'POST',body:JSON.stringify({reason})}),
 resetMFA: (userId:string,reason:string) => apiRequest('/admin/security/users/'+encodeURIComponent(userId)+'/reset-mfa',{method:'POST',body:JSON.stringify({reason,identity_verified:true})}),
 resetPassword: (userId:string,password:string,reason:string) => apiRequest("/admin/users/"+encodeURIComponent(userId)+"/reset-password",{method:"POST",body:JSON.stringify({password,reason})}),
 reactivate: (userId:string,reason:string) => apiRequest("/admin/users/"+encodeURIComponent(userId)+"/reactivate",{method:"POST",body:JSON.stringify({reason})}),
 directory: (signal?:AbortSignal) => apiRequest<Directory>('/admin/directory',{signal}),
 create: (input:NewAccount) => apiRequest('/admin/users',{method:'POST',body:JSON.stringify(input)}),
 grant: (userId:string,permissionId:string) => apiRequest('/admin/users/'+encodeURIComponent(userId)+'/permissions',{method:'POST',body:JSON.stringify({permissionId})}),
 revoke: (userId:string,permissionId:string) => apiRequest('/admin/users/'+encodeURIComponent(userId)+'/permissions/'+encodeURIComponent(permissionId),{method:'DELETE'}),
};
