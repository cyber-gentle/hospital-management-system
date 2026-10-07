export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
export const AUTOMATIC_DISCHARGE_BILLING_ENABLED = false;

export function requireDemoMode(): void {
  if (!DEMO_MODE) throw new Error('This workflow is unavailable until its hospital backend integration is complete.');
}
