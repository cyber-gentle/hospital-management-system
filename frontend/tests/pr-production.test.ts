import { liveAdminApi } from '../src/modules/admin/liveApi';
import { radiologyApi } from '../src/modules/radiology/api';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { hrApi } from '../src/modules/hr/api';
import { auditApi } from '../src/modules/audit/api';
import { mortuaryApi } from '../src/modules/mortuary/api';
import { inventoryApi } from '../src/modules/inventory/api';
import { adminApi } from '../src/modules/admin/api';
import { reportingApi } from '../src/modules/reporting/api';
import { emergencyApi } from '../src/modules/emergency/api';
import { maternityApi } from '../src/modules/maternity/api';
import { theatreApi } from '../src/modules/theatre/api';
import { nhiaApi } from '../src/modules/nhiaclaims/api';
import { INITIAL_STAFF, INITIAL_SHIFTS, INITIAL_LEAVE_REQUESTS } from '../src/modules/hr/mockData';
import { INITIAL_DECEASED_RECORDS, INITIAL_AUTOPSY_LOGS, INITIAL_BODY_RELEASES } from '../src/modules/mortuary/mockData';
import { INITIAL_INVENTORY_ITEMS, INITIAL_PURCHASE_ORDERS, INITIAL_GRNS, INITIAL_ISSUANCES } from '../src/modules/inventory/mockData';

let writes: string[];
beforeEach(() => {
 writes=[];
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
  getItem:(key:string)=>key==='hims_auth_token'?'synthetic-user-token':null,
  setItem:(key:string)=>{writes.push(key);},removeItem:()=>{}
 }});
});
const requests: Array<() => Promise<unknown>> = [
 () => liveAdminApi.directory(),
 () => liveAdminApi.resetPassword("staff","Synthetic replacement password","Synthetic recovery"),
 () => liveAdminApi.reactivate("staff","Synthetic approval"),
 () => liveAdminApi.create({username:'synthetic',email:'synthetic@example.invalid',firstName:'Synthetic',lastName:'Staff',role:'AUDITOR',department:'Test',password:'Synthetic test only'}),
 () => liveAdminApi.grant('staff','reporting:read'), () => liveAdminApi.revoke('staff','reporting:read'),
 () => radiologyApi.catalog(), () => radiologyApi.requests(), () => radiologyApi.create('patient','exam'), () => radiologyApi.saveReport('study','COMPLETED','Synthetic'),
 () => nhiaApi.getProviders(), () => nhiaApi.getClaims(),
 () => hrApi.getStaff(), () => hrApi.getStaffById('synthetic'),
 () => hrApi.createStaff(INITIAL_STAFF[0]!), () => hrApi.updateStaff('synthetic',{designation:'Synthetic'}),
 () => hrApi.getDutyRoster(), () => hrApi.createShift(INITIAL_SHIFTS[0]!),
 () => hrApi.updateShift('synthetic',{notes:'Synthetic'}), () => hrApi.deleteShift('synthetic'),
 () => hrApi.getLeaveRequests(), () => hrApi.submitLeaveRequest(INITIAL_LEAVE_REQUESTS[0]!),
 () => hrApi.adjudicateLeaveRequest('synthetic','APPROVED','Synthetic','Spoofed'), () => hrApi.getHRMetrics(),
 () => auditApi.getAuditLogs(), () => auditApi.getAuditLogById('synthetic'),
 () => auditApi.getAnomalyExceptions(), () => auditApi.updateExceptionStatus('synthetic','UNDER_REVIEW','Synthetic'),
 () => auditApi.verifyAuditTamperSeal('synthetic'), () => auditApi.getAuditMetrics(),
 () => mortuaryApi.getDeceasedRecords(), () => mortuaryApi.createDeceasedAdmission(INITIAL_DECEASED_RECORDS[0]!),
 () => mortuaryApi.getColdStorageUnits(), () => mortuaryApi.assignChamber('synthetic','synthetic','1'),
 () => mortuaryApi.releaseChamber('synthetic'), () => mortuaryApi.getAutopsyLogs(),
 () => mortuaryApi.recordAutopsy(INITIAL_AUTOPSY_LOGS[0]!), () => mortuaryApi.getBodyReleases(),
 () => mortuaryApi.releaseBodyToFamily(INITIAL_BODY_RELEASES[0]!),
 () => inventoryApi.getItems(), () => inventoryApi.createItem(INITIAL_INVENTORY_ITEMS[0]!),
 () => inventoryApi.updateItem('synthetic',{name:'Synthetic'}), () => inventoryApi.adjustStock('synthetic',1,'Synthetic'),
 () => inventoryApi.getVendors(), () => inventoryApi.getPurchaseOrders(),
 () => inventoryApi.createPurchaseOrder(INITIAL_PURCHASE_ORDERS[0]!), () => inventoryApi.updatePOStatus('synthetic','APPROVED'),
 () => inventoryApi.getGoodsReceiptNotes(), () => inventoryApi.createGoodsReceiptNote(INITIAL_GRNS[0]!),
 () => inventoryApi.getSubstoreIssuances(), () => inventoryApi.createSubstoreIssuance(INITIAL_ISSUANCES[0]!),
 () => inventoryApi.getInventoryMetrics(),
];

test('all incoming live API paths preserve backend rejection without browser writes',async()=>{
 for (const status of [400,401,403,404,409,422,429,500,501,503]) {
  globalThis.fetch=async(_input,init)=>{
   assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer synthetic-user-token');
   return new Response(JSON.stringify({error:'Synthetic backend rejection'}),{status});
  };
  for (const request of requests) await assert.rejects(request(),(error:unknown)=> typeof error==='object' && error!==null && 'status' in error && error.status===status);
  assert.deepEqual(writes,[]);
 }
 globalThis.fetch=async()=>{throw new TypeError('Synthetic offline');};
 for(const request of requests) await assert.rejects(request());
 assert.deepEqual(writes,[]);
});

test('preview workflows never issue production requests or change browser data',async()=>{
 globalThis.fetch=async()=>{assert.fail('Unsupported workflow made a production request');};
 for(const request of [
  ()=>adminApi.getConfig(),()=>adminApi.updateConfig({}),()=>adminApi.getRoleMatrices(),
  ()=>adminApi.updateRolePermissions('ADMIN',[]),()=>adminApi.getUsers(),
  ()=>adminApi.updateUser('synthetic',{status:'ACTIVE'}),()=>adminApi.toggleUserLock('synthetic','LOCKED'),
  ()=>adminApi.resetPassword('synthetic'),()=>adminApi.getSecurityMetrics(),
  ()=>reportingApi.getExecutiveSummary(),()=>emergencyApi.getEmergencyPatients(),
  ()=>emergencyApi.assignPatientBed('synthetic','synthetic','1'),()=>emergencyApi.releasePatientBed('synthetic'),
  ()=>maternityApi.getAncProfiles(),()=>maternityApi.updateAncStatus('synthetic','ANC_ACTIVE'),
  ()=>theatreApi.getBookings(),()=>theatreApi.updateStatus('synthetic','SCHEDULED'),
  ()=>nhiaApi.checkEligibility('synthetic'),
  ()=>nhiaApi.submitClaim({}),()=>inventoryApi.updateItemStock('synthetic',10),
 ]) await assert.rejects(request(),/unavailable until/);
 assert.deepEqual(writes,[]);
});

test('successful mortuary intake sends no invented identity or fee accrual',async()=>{
 globalThis.fetch=async(_input,init)=>{
  const body=JSON.parse(String(init?.body)) as Record<string,unknown>;
  assert.equal(body.id,undefined);
  assert.equal(body.deceasedTagNumber,undefined);
  assert.equal(body.totalAccruedStorageFee,undefined);
  return new Response(JSON.stringify({id:'server-id',financialClearancePaid:false,daysInStorage:null,totalAccruedStorageFee:null,storageBillingStatus:'NOT_CONFIGURED'}),{status:201});
 };
 const {id: _id,deceasedTagNumber:_tag,daysInStorage:_days,totalAccruedStorageFee:_fee,financialClearancePaid:_paid,status:_status,updatedAt:_time,...payload}=INITIAL_DECEASED_RECORDS[0]!;
 const record=await mortuaryApi.createDeceasedAdmission(payload);
 assert.equal(record.id,'server-id');assert.equal(record.totalAccruedStorageFee,null);assert.deepEqual(writes,[]);
});

test('audit filters are forwarded and unavailable verification is never valid',async()=>{
 globalThis.fetch=async(input)=>{
  const url=String(input);
  assert.ok(url.includes('startDate=2026-10-01'));assert.ok(url.includes('endDate=2026-10-09'));
  assert.ok(url.includes('onlyAnomalies=true'));assert.ok(url.includes('actionCategory=FINANCIAL'));
  return new Response('[]',{status:200});
 };
 assert.deepEqual(await auditApi.getAuditLogs({startDate:'2026-10-01',endDate:'2026-10-09',onlyAnomalies:true,actionCategory:'FINANCIAL'}),[]);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:'Seal not configured',valid:false}),{status:501});
 await assert.rejects(auditApi.verifyAuditTamperSeal('synthetic'));
 assert.deepEqual(writes,[]);
});

test('live NHIA reads preserve exact claim amounts and do not invent invoice totals',async()=>{
 globalThis.fetch=async(input,init)=>{
  assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer synthetic-user-token');
  const url=String(input);
  if(url.endsWith('/providers')) return new Response(JSON.stringify([{id:'provider',name:'Synthetic HMO',code:'SYNTHETIC',is_active:false}]),{status:200});
  assert.ok(url.endsWith('/claims?limit=100&offset=100'));
  return new Response(JSON.stringify([{id:'claim',patient_id:'patient',invoice_id:'invoice',hmo_provider_id:'provider',claim_amount:'1234567890.12',claim_reference:null,status:'PENDING',created_at:'2026-10-15T00:00:00Z',updated_at:'2026-10-15T00:00:00Z'}]),{status:200});
 };
 assert.equal((await nhiaApi.getProviders())[0]!.active,false);
 const claim=(await nhiaApi.getClaims(100))[0]!;
 assert.equal(claim.claimAmount,'1234567890.12');assert.equal(claim.invoiceId,'invoice');
 assert.equal(claim.totalAmount,null);assert.equal(claim.coPayAmount,null);
 assert.equal(claim.nhiaNumber,'');assert.equal(claim.diagnosis,'');assert.deepEqual(writes,[]);
 await assert.rejects(nhiaApi.getClaims(-1),/Invalid claims page/);
});

test('radiology report saves use the authenticated route without a client author identity',async()=>{
 globalThis.fetch=async(input,init)=>{
  assert.equal(String(input),'/api/v1/radiology/requests/study');
  assert.equal(init?.method,'PUT');
  assert.deepEqual(JSON.parse(String(init?.body)),{status:'COMPLETED',report_text:'Synthetic report'});
  return new Response(JSON.stringify({id:'study',report_text:'Synthetic report',radiologist_id:'server-author'}),{status:200});
 };
 assert.equal((await radiologyApi.saveReport('study','COMPLETED','Synthetic report')).radiologist_id,'server-author');
 assert.deepEqual(writes,[]);
});

test('administration respects server-managed authority and never persists passwords in the browser',async()=>{
 const input={username:'synthetic',email:'synthetic@example.invalid',firstName:'Synthetic',lastName:'Staff',role:'AUDITOR',department:'Test',password:'Synthetic test only'};
 globalThis.fetch=async(url,init)=>{
  assert.equal(String(url),'/api/v1/admin/users');assert.equal(init?.method,'POST');
  assert.deepEqual(JSON.parse(String(init?.body)),input);
  return new Response(JSON.stringify({id:'server-staff',username:'synthetic',role:'AUDITOR'}),{status:201});
 };
 await liveAdminApi.create(input);assert.deepEqual(writes,[]);
 globalThis.fetch=async()=>new Response(JSON.stringify({users:[],permissions:[],roleGrants:[],userGrants:[],canManage:false}),{status:200});
 assert.equal((await liveAdminApi.directory()).canManage,false);
});

test('account recovery sends explicit values without saving passwords in browser storage',async()=>{
 const calls: Array<{url:string;body:unknown}> = [];
 globalThis.fetch=async(url,init)=>{
  calls.push({url:String(url),body:JSON.parse(String(init?.body))});
  assert.equal(init?.method,'POST');
  return new Response(JSON.stringify({id:'staff',sessionsRevoked:true}),{status:200});
 };
 await liveAdminApi.resetPassword('staff','Synthetic password only','Synthetic recovery');
 await liveAdminApi.reactivate('staff','Synthetic reactivation');
 assert.deepEqual(calls,[
  {url:'/api/v1/admin/users/staff/reset-password',body:{password:'Synthetic password only',reason:'Synthetic recovery'}},
  {url:'/api/v1/admin/users/staff/reactivate',body:{reason:'Synthetic reactivation'}},
 ]);
 assert.deepEqual(writes,[]);
});
