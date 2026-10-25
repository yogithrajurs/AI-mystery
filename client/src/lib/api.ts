export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
export type CaseInfo = { id: string; title: string; summary: string; genre: string; difficulty: string; status: string; suspectCount: number; evidenceCount: number };
export type Suspect = { id: string; name: string; role: string; background: string; publicMotive: string; statement: string; publicAlibi: string; displayOrder: number };
export type Evidence = { id: string; type: string; title: string; description: string; content: Record<string, unknown>; relatedSuspectIds: string[]; occurredAt?: string; displayOrder: number };
export type Progress = { viewedEvidenceIds: string[]; bookmarkedEvidenceIds: string[]; notes: string; status?: string; selectedSuspectId?: string };
export type Solution = { culpritId: string; culpritName: string; motive: string; methodSummary: string; reasoning: { step: number; text: string; evidenceIds: string[] }[]; decisiveEvidenceIds: string[]; eventSequence: { timestamp: string; description: string; location?: string }[]; redHerringExplanations: { evidenceId: string; explanation: string }[] };
export class ApiError extends Error { constructor(public code: string, message: string) { super(message); } }
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error?.code ?? 'NETWORK_ERROR', body.error?.message ?? 'Could not connect to the investigation server.');
  return body as T;
}

