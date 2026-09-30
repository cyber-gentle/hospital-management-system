import { fetchPatients } from './api';

export async function fetchPatientOptions() {
  const { patients } = await fetchPatients();
  const today = new Date();
  return patients.map(p => {
    const birth = new Date(`${p.date_of_birth}T00:00:00Z`);
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
    return { id: p.id, mrn: p.hospital_number, firstName: p.first_name, lastName: [p.other_names, p.last_name].filter(Boolean).join(' '),
      gender: (p.gender === 'MALE' ? 'Male' : p.gender === 'FEMALE' ? 'Female' : 'Other') as 'Male' | 'Female' | 'Other',
      age, phone: p.phone_number || '', bloodGroup: p.blood_group || '',
      tariffType: (p.payment_category === 'CASH' ? 'Cash' : p.payment_category === 'NHIA' ? 'NHIA' : 'Retainership') as 'Cash' | 'NHIA' | 'Retainership',
      insuranceNumber: p.nhia_number };
  });
}

export type PatientOption = Awaited<ReturnType<typeof fetchPatientOptions>>[number];
