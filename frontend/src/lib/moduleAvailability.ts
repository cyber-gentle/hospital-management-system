/** These UIs have an incomplete production API contract; their demo remains available. */
export const PREVIEW_MODULES: Record<string, string | undefined> = {
  nhia: 'Invoice-linked claim submission, tariffs and provider eligibility verification are not connected to this screen yet.',
  radiology: 'This screen uses synthetic studies. Imaging requests, reports and PACS integration still need to be connected.',
  theatre: 'Surgery booking, checklist and recovery contracts still need to be aligned with the backend.',
  emergency: 'Triage, bed allocation and stabilization contracts still need to be aligned with the backend.',
  maternity: 'Antenatal, delivery and postnatal contracts still need to be aligned with the backend.',
  reporting: 'The dashboard is a synthetic preview; authoritative period-based report aggregation is not connected.',
  admin: 'User provisioning, password reset and permission editing are not connected to the backend.',
};
