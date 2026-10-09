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
  ()=>nhiaApi.getProviders(),()=>nhiaApi.getClaims(),()=>nhiaApi.checkEligibility('synthetic'),
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
