import type { VisitSummary } from '@/types/visit';

export async function summarizeVisit(notes: string): Promise<VisitSummary> {
  if (!notes.trim()) {
    throw new Error('Visit notes are required');
  }

  return {
    summary: `Summary: ${notes.slice(0, 140)}${notes.length > 140 ? '...' : ''}`,
    followUpInstructions: 'Follow up with the patient within 24 hours and confirm any prescribed next steps.',
  };
}
