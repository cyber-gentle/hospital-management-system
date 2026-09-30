import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPatient, fetchPatients, fetchPatientIDCard } from '../src/modules/medicalrecords/api';
import { nursingApi } from '../src/modules/nursing/api';
import { billingApi } from '../src/modules/billing/api';
import { accountingApi } from '../src/modules/accounting/api';
import { appointmentsApi } from '../src/modules/appointments/api';
import { pharmacyApi } from '../src/modules/pharmacy/api';
import { substoreApi } from '../src/modules/substore/api';
import { fetchPatientOptions } from '../src/modules/medicalrecords/patientOptions';

beforeEach(() => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  }});
  globalThis.fetch = async () => new Response('', { status: 404 });
});

async function register() {
  return createPatient({ first_name: 'Journey', last_name: 'Synthetic', date_of_birth: '1990-01-15', gender: 'MALE', address: 'QA fixture', emergency_contact_name: 'Test Contact', emergency_contact_phone: '08000000000', emergency_contact_relationship: 'Sibling', payment_category: 'CASH', registration_fee_paid: true });
}

async function admit() {
  const patient = await register();
  const ward = (await nursingApi.getWards()).find(w => w.beds.some(b => b.status === 'available'))!;
  const bed = ward.beds.find(b => b.status === 'available')!;
  const admission = await nursingApi.createAdmission({patientId: patient.id, patientName: 'Journey Synthetic', hospitalNumber: patient.hospital_number, age: 36, gender: 'Male', wardId: ward.id, wardName: ward.name, bedNumber: bed.bedNumber, admittingDoctor: 'Synthetic Doctor', primaryDiagnosis: 'QA fixture', triageAcuity: 'stable', depositStatus: 'pending', allergies: [], resuscitationStatus: 'Full Code', bloodGroup: 'O+', tariffType: 'Cash', admissionChecklist: {consentSigned: true, idWristbandApplied: true, allergyBandApplied: false, orientationCompleted: true, belongingsDocumented: true, initialVitalsDone: false, valuablesStorageSigned: false}});
  return {patient, admission, ward, bed};
}

test('registration persists in MPI and ID card', async () => {
  const p = await register();
  assert.equal((await fetchPatients(p.hospital_number)).patients[0]?.id, p.id);
  assert.equal((await fetchPatientIDCard(p.id)).hospital_number, p.hospital_number);
  assert.equal((await fetchPatientOptions()).find(option => option.id === p.id)?.mrn, p.hospital_number);
});

test('optional patient photo survives registration and card generation', async () => {
  const photo = 'data:image/png;base64,c3ludGhldGlj';
  const p = await createPatient({first_name:'Photo',last_name:'Fixture',date_of_birth:'1990-01-01',gender:'OTHER',address:'QA',emergency_contact_name:'Test',emergency_contact_phone:'08000000000',emergency_contact_relationship:'Sibling',payment_category:'CASH',registration_fee_paid:true,photo_data_url:photo});
  assert.equal((await fetchPatientIDCard(p.id)).photo_data_url,photo);
});

test('network failure falls back, but authorization and validation failures do not', async () => {
  globalThis.fetch = async () => { throw new TypeError('Offline'); };
  assert.ok((await register()).id);
  for (const status of [400,401,403,409,422]) {
    globalThis.fetch = async () => new Response('',{status});
    const before = localStorage.getItem('hims_patients_local_db');
    await assert.rejects(register());
    assert.equal(localStorage.getItem('hims_patients_local_db'),before);
    await assert.rejects(appointmentsApi.getAvailability());
  }
});

test('vitals, signed notes, dual handover and bed occupancy persist', async () => {
  const {admission} = await admit();
  const vital = await nursingApi.recordVitals({admissionId:admission.id,patientName:admission.patientName,hospitalNumber:admission.hospitalNumber,recordedBy:'QA Nurse',bloodPressureSystolic:160,bloodPressureDiastolic:100,pulseRate:75,respiratoryRate:18,temperature:36.8,oxygenSaturation:98,painScore:0,consciousnessLevel:'Alert',source:'manual'});
  assert.equal(vital.isAbnormal,true);
  assert.equal((await nursingApi.getVitalsForAdmission(admission.id))[0]?.id,vital.id);
  const note = await nursingApi.addNote({admissionId:admission.id,patientName:admission.patientName,noteType:'progress',content:'Synthetic QA note',authorName:'QA Nurse',authorRole:'NURSE',tags:[]});
  await nursingApi.signAndLockNote(note.id,'QA Nurse');
  assert.equal((await nursingApi.getNotes(admission.id))[0]?.isSigned,true);
  const shift = await nursingApi.createShiftHandover(admission.wardId,'morning','QA Outgoing Nurse','Synthetic ward summary');
  assert.ok(shift.patientEndorsements.some(p=>p.admissionId===admission.id));
  await assert.rejects(nursingApi.signShiftHandover(shift.id,'QA Outgoing Nurse'));
  await nursingApi.signShiftHandover(shift.id,'QA Incoming Nurse');
  assert.equal((await nursingApi.getShiftHandovers()).find(s=>s.id===shift.id)?.isDualSigned,true);
  await assert.rejects(nursingApi.createAdmission(admission));
});

test('demo statements balance and negative balances are shown on the opposite side', async () => {
  assert.equal((await accountingApi.getTrialBalance()).isBalanced,true);
  assert.equal((await accountingApi.getBalanceSheet()).isBalanced,true);
  const accounts = await accountingApi.getAccounts();
  accounts[0]!.balance = -10;
  localStorage.setItem('hims_accounting_accounts_v1',JSON.stringify(accounts));
  const report = await accountingApi.getTrialBalance();
  assert.equal(report.items.find(i=>i.accountCode===accounts[0]!.code)?.credit,10);
  assert.equal(report.isBalanced,false);
});

test('discharge creates one real invoice and releases the bed', async () => {
  const {admission, ward, bed} = await admit();
  const dossier = await nursingApi.getDischargeDossier(admission.id);
  await assert.rejects(nursingApi.triggerDischargeBilling(admission.id));
  for (const item of dossier.items) await nursingApi.toggleDischargeItem(admission.id, item.id, 'Synthetic Nurse');
  const result = await nursingApi.triggerDischargeBilling(admission.id);
  const invoices = await billingApi.getInvoices();
  const invoice = invoices.find(i => i.admissionId === admission.id);
  assert.ok(invoice, 'discharge must create an invoice visible in Billing');
  assert.equal(invoice.invoiceNumber, result.invoiceId);
  assert.equal(invoice.patientId, admission.patientId);
  assert.equal((await nursingApi.triggerDischargeBilling(admission.id)).invoiceId, result.invoiceId);
  assert.equal((await billingApi.getInvoices()).filter(i => i.admissionId === admission.id).length, 1);
  assert.notEqual((await nursingApi.getWards()).find(w=>w.id===ward.id)!.beds.find(b=>b.id===bed.id)!.status, 'occupied');
});

test('billing receipts appear in reconciliation and post once to account balances', async () => {
  const p = await register();
  const invoice = await billingApi.createInvoice({patientId:p.id, patientName:'Journey Synthetic', hospitalNumber:p.hospital_number, payerScheme:'Cash', items:[{description:'Synthetic service', category:'Consultation', unitPrice:100, quantity:1}]});
  const {receipt} = await billingApi.recordPayment(invoice.id, {invoiceId:invoice.id, amountPaid:100, paymentMethod:'Cash', cashierName:'QA Cashier', cashierShift:'Morning'});
  const report = await accountingApi.getBillingReconciliation();
  const item = report.items.find(i => i.billingReceiptId === receipt.id);
  assert.ok(item, 'new receipt must be discoverable by reconciliation');
  assert.equal(item.status, 'UNPOSTED_IN_GL');
  const before = await accountingApi.getAccounts();
  await accountingApi.postReceiptToGl(item.id);
  const after = await accountingApi.getAccounts();
  assert.equal(after.find(a=>a.code==='1010')!.balance - before.find(a=>a.code==='1010')!.balance, 100);
  assert.equal(after.find(a=>a.code==='4010')!.balance - before.find(a=>a.code==='4010')!.balance, 100);
  await accountingApi.postReceiptToGl(item.id);
  assert.deepEqual(await accountingApi.getAccounts(), after);
  assert.equal((await accountingApi.getBillingReconciliation()).items.find(i=>i.id===item.id)!.varianceAmount,0);
});

test('appointments reject a second booking of an occupied slot', async () => {
  const p = await register();
  const slot = (await appointmentsApi.getAvailability()).find(s=>s.status==='AVAILABLE' && s.maxCapacity===1)!;
  const doctor = (await appointmentsApi.getDoctors()).find(d=>d.id===slot.doctorId)!;
  const request = {patientId:p.id, patientMrn:p.hospital_number, patientName:'Journey Synthetic', patientPhone:'08000000000', patientGender:'Male' as const, patientAge:36, doctorId:doctor.id, doctorName:doctor.name, specialty:doctor.specialty, department:doctor.department, slotId:slot.id,date:slot.date,startTime:slot.startTime,endTime:slot.endTime,type:'CONSULTATION' as const,priority:'ROUTINE' as const,reasonForVisit:'QA',reminderPreference:'NONE' as const};
  const appointment = await appointmentsApi.bookAppointment(request);
  await assert.rejects(appointmentsApi.bookAppointment(request));
  await appointmentsApi.cancelAppointment({appointmentId:appointment.id,reason:'QA cancellation'});
  assert.equal((await appointmentsApi.getAvailability()).find(s=>s.id===slot.id)!.currentBookings,0);
});

test('pharmacy rejects negative dispensing without changing stock', async () => {
  const rx = (await pharmacyApi.getPrescriptions()).find(r=>r.status==='pending')!;
  const before = await pharmacyApi.getDrugFormulary();
  await assert.rejects(pharmacyApi.dispensePrescription(rx.id,[{itemId:rx.items[0]!.id,quantityToDispense:-1}],'QA Pharmacist'));
  assert.deepEqual(await pharmacyApi.getDrugFormulary(),before);
});

test('partial dispensing deducts stock, enforces allergy rationale, and excludes unrelated admission charges', async () => {
  const {admission} = await admit();
  const source = (await pharmacyApi.getPrescriptions()).find(r=>r.status==='pending')!;
  const item = source.items[0]!;
  const rx = {...source, id:'rx-qa-linked', patientId:admission.patientId, hospitalNumber:admission.hospitalNumber, patientName:admission.patientName, admissionId:admission.id, knownAllergies:[], items:[{...item,quantityPrescribed:3,quantityDispensed:0,isDispensed:false}]};
  localStorage.setItem('hims_pharmacy_prescriptions_v1',JSON.stringify([rx, {...rx,id:'rx-other-stay',admissionId:'other-stay',items:[{...rx.items[0],quantityDispensed:9}]}]));
  const stockBefore = (await pharmacyApi.getDrugFormulary()).find(d=>d.id===item.drugId)!.stockOnHand;
  const updated = await pharmacyApi.dispensePrescription(rx.id,[{itemId:item.id,quantityToDispense:1}],'QA Pharmacist');
  assert.equal(updated.status,'partially_dispensed');
  assert.equal((await pharmacyApi.getDrugFormulary()).find(d=>d.id===item.drugId)!.stockOnHand,stockBefore-1);
  await assert.rejects(pharmacyApi.dispensePrescription(rx.id,[{itemId:item.id,quantityToDispense:3}],'QA Pharmacist'));
  const charges = await billingApi.pullConsolidatedNursingCharges(admission.id);
  assert.equal(charges.filter(c=>c.source==='pharmacy_dispense').length,1);
  assert.equal(charges.find(c=>c.source==='pharmacy_dispense')!.quantity,1);
  await assert.rejects(billingApi.pullConsolidatedNursingCharges('missing-admission'));
  const drugs = await pharmacyApi.getDrugFormulary();
  const allergenic = drugs.find(d=>d.activeIngredients.some(a=>a.toLowerCase().includes('amoxicillin')))!;
  assert.ok(allergenic);
  const unsafeRx = {...rx,id:'rx-allergy',knownAllergies:['Penicillin'],items:[{...rx.items[0]!,drugId:allergenic.id,quantityDispensed:0}]};
  localStorage.setItem('hims_pharmacy_prescriptions_v1',JSON.stringify([unsafeRx]));
  await assert.rejects(pharmacyApi.dispensePrescription(unsafeRx.id,[{itemId:item.id,quantityToDispense:1}],'QA Pharmacist'));
});

test('payment validation and NHIA arithmetic remain consistent', async () => {
  const p = await register();
  const invoice = await billingApi.createInvoice({patientId:p.id,patientName:'QA Patient',hospitalNumber:p.hospital_number,payerScheme:'NHIA',items:[{description:'Synthetic service',category:'Consultation',quantity:2,unitPrice:1000}],depositApplied:50});
  assert.equal(invoice.totalNhiaCovered,1800);
  assert.equal(invoice.netAmountDue,150);
  const payment = {invoiceId:invoice.id,amountPaid:150,paymentMethod:'Cash' as const,cashierName:'QA Cashier',cashierShift:'Morning' as const};
  for (const amountPaid of [-1,0,151,Number.NaN]) await assert.rejects(billingApi.recordPayment(invoice.id,{...payment,amountPaid}));
  await billingApi.recordPayment(invoice.id,payment);
  assert.equal((await billingApi.getInvoiceById(invoice.id))?.status,'paid');
  await assert.rejects(billingApi.recordPayment(invoice.id,payment));
});

test('rescheduling reserves the destination and preserves cancellation reasons', async () => {
  const p = await register();
  const slots = (await appointmentsApi.getAvailability()).filter(s=>s.status==='AVAILABLE' && s.maxCapacity===1);
  const first = slots[0]!;
  const next = slots.find(s=>s.doctorId===first.doctorId && s.id!==first.id)!;
  const doctor = (await appointmentsApi.getDoctors()).find(d=>d.id===first.doctorId)!;
  const appointment = await appointmentsApi.bookAppointment({patientId:p.id,patientMrn:p.hospital_number,patientName:'QA Patient',patientPhone:'',patientGender:'Male',patientAge:36,doctorId:doctor.id,doctorName:doctor.name,specialty:doctor.specialty,department:doctor.department,slotId:first.id,date:first.date,startTime:first.startTime,endTime:first.endTime,type:'CONSULTATION',priority:'ROUTINE',reasonForVisit:'QA',reminderPreference:'NONE'});
  const req = {appointmentId:appointment.id,newDate:next.date,newSlotId:next.id,newStartTime:next.startTime,newEndTime:next.endTime,reason:'Synthetic scheduling change'};
  await assert.rejects(appointmentsApi.rescheduleAppointment({...req,reason:''}));
  await assert.rejects(appointmentsApi.rescheduleAppointment({...req,newDate:'1999-01-01'}));
  await appointmentsApi.rescheduleAppointment(req);
  assert.equal((await appointmentsApi.getAvailability()).find(s=>s.id===first.id)?.currentBookings,0);
  assert.equal((await appointmentsApi.getAvailability()).find(s=>s.id===next.id)?.currentBookings,1);
  await appointmentsApi.cancelAppointment({appointmentId:appointment.id,reason:'Synthetic cancellation'});
  await appointmentsApi.cancelAppointment({appointmentId:appointment.id,reason:'Repeated click'});
  assert.equal((await appointmentsApi.getAppointmentById(appointment.id))?.cancellationReason,'Synthetic cancellation');
});

test('substore fulfillment cannot replenish twice and adjustment requires audit reason', async () => {
  const item = (await substoreApi.getSubstoreItems())[0]!;
  const req = await substoreApi.createRequisition({substoreId:item.substoreId, urgency:'ROUTINE', requestedBy:'QA Nurse',requestedByRole:'NURSE',items:[{itemId:item.id,itemCode:item.itemCode,itemName:item.itemName,requestedQty:2,unitOfMeasure:item.unitOfMeasure,unitCost:item.unitCost}]});
  await substoreApi.fulfillRequisition(req.id,'QA Store Officer');
  await substoreApi.fulfillRequisition(req.id,'QA Store Officer');
  assert.equal((await substoreApi.getSubstoreItems()).find(i=>i.id===item.id)!.currentStock,item.currentStock+2);
  await assert.rejects(substoreApi.adjustStock({substoreId:item.substoreId,itemId:item.id,newQuantity:1,reason:'PHYSICAL_COUNT_CORRECTION',auditExplanation:'',adjustedBy:'QA Nurse'}));
  await substoreApi.adjustStock({substoreId:item.substoreId,itemId:item.id,newQuantity:1,reason:'PHYSICAL_COUNT_CORRECTION',auditExplanation:'Synthetic count verification',adjustedBy:'QA Nurse'});
  assert.equal((await substoreApi.getAuditHistory(item.substoreId))[0]!.newQty,1);
});
