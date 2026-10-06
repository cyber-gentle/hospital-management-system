import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPatient } from '../src/modules/medicalrecords/api';
import { billingApi } from '../src/modules/billing/api';
import { nursingApi } from '../src/modules/nursing/api';
import { accountingApi } from '../src/modules/accounting/api';
import { pharmacyApi } from '../src/modules/pharmacy/api';
import { fallbackFetch } from '../src/lib/fallback';

beforeEach(()=>{
  const data=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)}});
});

test('production failures cannot create a local patient',async()=>{
  for(const status of [400,401,403,404,409,422,500,503]) {
    globalThis.fetch=async()=>new Response('',{status});
    await assert.rejects(createPatient({first_name:'Synthetic',last_name:'Patient',date_of_birth:'2000-01-01',gender:'OTHER',address:'Synthetic',emergency_contact_name:'Synthetic',emergency_contact_phone:'0000000000',emergency_contact_relationship:'Other',payment_category:'CASH',registration_fee_paid:false}));
    assert.equal(localStorage.getItem('hims_patients_local_db'),null);
    await assert.rejects(fallbackFetch('/api/v1/test',{method:'POST'}));
  }
  globalThis.fetch=async()=>{throw new TypeError('Synthetic network failure');};
  await assert.rejects(fallbackFetch('/api/v1/test',{method:'POST'}));
});

test('browser workflows cannot hydrate demo records in production',async()=>{
  for(const operation of [billingApi.getInvoices,nursingApi.getAdmissions,accountingApi.getAccounts,pharmacyApi.getDrugFormulary]) {
    await assert.rejects(operation());
  }
  for (const key of ['hims_billing_invoices_v1','hims_nursing_admissions_v1','hims_accounting_accounts_v1','hims_pharmacy_drugs_v1']) assert.equal(localStorage.getItem(key),null);
});
