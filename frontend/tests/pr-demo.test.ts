import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { inventoryApi } from '../src/modules/inventory/api';
import { auditApi } from '../src/modules/audit/api';
import { INITIAL_PURCHASE_ORDERS } from '../src/modules/inventory/mockData';

beforeEach(()=>{
 const data=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)}});
 globalThis.fetch=async()=>new Response('',{status:404});
});

test('negative, excessive and repeated-item issuances cannot change synthetic stock',async()=>{
 const item=(await inventoryApi.getItems()).find(item=>item.currentStock>0)!;
 const payload={requisitionId:'SYNTHETIC',targetDepartment:'Synthetic',issuedDate:'2026-10-09',issuedBy:'Synthetic',items:[{itemId:item.id,itemName:item.name,quantityRequested:1,quantityIssued:1,batchNumber:'Synthetic'}],status:'DISPATCHED' as const};
 await inventoryApi.getSubstoreIssuances();
 const itemsBefore=localStorage.getItem('hims_inv_items_v1');const issuesBefore=localStorage.getItem('hims_inv_issuances_v1');
 for(const qty of [-1,0,1.5,item.currentStock+1]) {
  await assert.rejects(inventoryApi.createSubstoreIssuance({...payload,items:[{...payload.items[0]!,quantityIssued:qty}]}));
  assert.equal(localStorage.getItem('hims_inv_items_v1'),itemsBefore);assert.equal(localStorage.getItem('hims_inv_issuances_v1'),issuesBefore);
 }
 await assert.rejects(inventoryApi.createSubstoreIssuance({...payload,items:[payload.items[0]!,payload.items[0]!]}));
 await inventoryApi.createSubstoreIssuance(payload);
 assert.equal((await inventoryApi.getItems()).find(i=>i.id===item.id)!.currentStock,item.currentStock-1);
});

test('partial and rejected receipts preserve order state and cannot post twice',async()=>{
 const item=(await inventoryApi.getItems()).find(i=>i.currentStock>0)!;
 const order={...INITIAL_PURCHASE_ORDERS[0]!,id:'SYNTHETIC-ORDER',poNumber:'SYNTHETIC-ORDER',items:[{itemId:item.id,itemCode:item.itemCode,itemName:item.name,quantityOrdered:5,unitPrice:1,totalPrice:5}],status:'APPROVED' as const};
 localStorage.setItem('hims_inv_pos_v1',JSON.stringify([order]));localStorage.setItem('hims_inv_grns_v1','[]');
 const receipt={grnNumber:'SYNTHETIC-GRN-1',poId:order.id,poNumber:order.poNumber,vendorName:'Synthetic',deliveryNoteNumber:'Synthetic',receivedDate:'2026-10-09',receivedBy:'Synthetic',receivedItems:[{itemId:item.id,itemName:item.name,quantityOrdered:5,quantityReceived:2,batchNumber:'Synthetic',expiryDate:'2028-01-01',inspectionPass:true}],inspectionOfficer:'Synthetic',status:'INSPECTED_ACCEPTED' as const,totalValue:'2.00'};
 await inventoryApi.createGoodsReceiptNote(receipt);
 assert.equal((await inventoryApi.getPurchaseOrders())[0]!.status,'PARTIALLY_RECEIVED');
 assert.equal((await inventoryApi.getItems()).find(i=>i.id===item.id)!.currentStock,item.currentStock+2);
 await assert.rejects(inventoryApi.createGoodsReceiptNote(receipt));
 await inventoryApi.createGoodsReceiptNote({...receipt,grnNumber:'SYNTHETIC-REJECTED',status:'REJECTED_DAMAGED'});
 assert.equal((await inventoryApi.getPurchaseOrders())[0]!.status,'PARTIALLY_RECEIVED');
 assert.equal((await inventoryApi.getItems()).find(i=>i.id===item.id)!.currentStock,item.currentStock+2);
 await inventoryApi.createGoodsReceiptNote({...receipt,grnNumber:'SYNTHETIC-FINAL',receivedItems:[{...receipt.receivedItems[0]!,quantityReceived:3}]});
 assert.equal((await inventoryApi.getPurchaseOrders())[0]!.status,'FULFILLED');
 assert.equal((await inventoryApi.getItems()).find(i=>i.id===item.id)!.currentStock,item.currentStock+5);
});

test('synthetic logs never claim a cryptographic seal was verified',async()=>{
 await assert.rejects(auditApi.verifyAuditTamperSeal('nonexistent'));
 const log=(await auditApi.getAuditLogs())[0]!;
 assert.equal((await auditApi.verifyAuditTamperSeal(log.id)).valid,false);
 assert.equal((await auditApi.getAuditMetrics()).integrityStatus,'UNAVAILABLE');
});

test('audit CSV quotes embedded text and treats spreadsheet formulas as data',async()=>{
 const logs=await auditApi.getAuditLogs();
 const log={...logs[0]!,userName:'=HYPERLINK("synthetic")'};
 localStorage.setItem('hims_audit_logs_v1',JSON.stringify([log]));
 const csv=await auditApi.exportAuditLogs(undefined,'csv');
 assert.ok(csv.includes(`"'=HYPERLINK(""synthetic"")"`));
});
