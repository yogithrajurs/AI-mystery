import { randomUUID } from 'node:crypto';
import { CaseModel, EvidenceModel, JobModel, SolutionModel, SuspectModel } from '../models.js';
import { generatedSchema } from '../schemas.js';
import { env } from '../config/env.js';
import { generateMystery } from './gemini.service.js';

export async function runGeneration(caseId: string, scenario: string, genre: string, difficulty: string) {
  const job = await JobModel.findOne({ caseId });
  if (!job || job.status === 'ready') return;
  try {
    let data;
    let errors: string[] = [];
    for (let attempt = 1; attempt <= env.MAX_GENERATION_ATTEMPTS; attempt++) {
      await JobModel.updateOne({ caseId }, { status: 'generating', stage: attempt === 1 ? 'establishing_case' : 'repairing_case', attempt });
      try {
        data = await generateMystery(scenario, genre, difficulty);
        errors = validateMystery(data);
        if (!errors.length) break;
      } catch (error) { errors = [error instanceof Error ? error.message : 'AI_OUTPUT_INVALID']; }
    }
    if (!data || errors.length) throw new Error('GENERATION_FAILED');
    const suspectIds = data.suspects.map((s) => s.id);
    const evidenceIds = data.evidence.map((e) => e.id);
    const caseRecord = await CaseModel.findById(caseId);
    if (!caseRecord) return;
    await JobModel.updateOne({ caseId }, { status: 'validating', stage: 'publishing' });
    await SuspectModel.insertMany(data.suspects.map((s, index) => ({ ...s, _id: s.id, caseId, displayOrder: index + 1 })));
    await EvidenceModel.insertMany(data.evidence.map((e, index) => ({ _id: e.id, caseId, type: e.type, title: e.title, description: e.description, content: e.content, relatedSuspectIds: e.relatedSuspectIds, occurredAt: e.occurredAt, assetIds: [], displayOrder: index + 1 })));
    await SolutionModel.create({ _id: caseId, caseId, culpritId: data.culpritId, motive: data.motive, methodSummary: data.methodSummary, eventSequence: data.eventSequence, reasoning: data.reasoning, decisiveEvidenceIds: data.evidence.filter((e) => e.decisive).map((e) => e.id), redHerringExplanations: data.evidence.filter((e) => e.redHerringExplanation).map((e) => ({ evidenceId: e.id, explanation: e.redHerringExplanation })), validatedAt: new Date(), schemaVersion: '1.0.0' });
    await CaseModel.updateOne({ _id: caseId }, { title: data.title, publicSummary: data.summary, suspectIds, evidenceIds, timeline: data.timeline, status: 'ready', promptVersion: '1.0.0', modelId: env.GEMINI_MODEL });
    await JobModel.updateOne({ caseId }, { status: 'ready', stage: 'ready' });
  } catch {
    await CaseModel.updateOne({ _id: caseId }, { status: 'failed' });
    await JobModel.updateOne({ caseId }, { status: 'failed', stage: 'failed', errorCode: 'GENERATION_FAILED' });
  }
}

function validateMystery(data: ReturnType<typeof generatedSchema.parse>): string[] {
  const errors: string[] = [];
  const suspectIds = new Set(data.suspects.map((s) => s.id));
  const evidenceIds = new Set(data.evidence.map((e) => e.id));
  if (suspectIds.size !== 4 || !suspectIds.has(data.culpritId)) errors.push('INVALID_SUSPECT');
  if (evidenceIds.size !== data.evidence.length || data.evidence.length < 6) errors.push('AI_OUTPUT_INVALID');
  if (data.evidence.some((e) => e.relatedSuspectIds.some((id) => !suspectIds.has(id)))) errors.push('AI_OUTPUT_INVALID');
  const forbiddenContentKeys = new Set(['culpritid', 'canonicalsolution', 'solution', 'reasoning', 'decisive', 'redherringexplanation', 'hidden', 'internalannotation']);
  const hasPrivateKey = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(hasPrivateKey);
    return Object.entries(value).some(([key, child]) => forbiddenContentKeys.has(key.toLowerCase()) || hasPrivateKey(child));
  };
  if (data.evidence.some((item) => hasPrivateKey(item.content))) errors.push('AI_OUTPUT_INVALID');
  const culpritName = data.suspects.find((suspect) => suspect.id === data.culpritId)?.name;
  const publicText = [data.summary, ...data.evidence.flatMap((item) => [item.title, item.description, JSON.stringify(item.content)])].join(' ').toLocaleLowerCase();
  if (publicText.includes(data.culpritId.toLocaleLowerCase()) || (culpritName && data.summary.toLocaleLowerCase().includes(culpritName.toLocaleLowerCase()))) errors.push('AI_OUTPUT_INVALID');
  if (data.timeline.some((e) => e.relatedEvidenceIds.some((id) => !evidenceIds.has(id)))) errors.push('AI_OUTPUT_INVALID');
  if (data.reasoning.some((r) => r.evidenceIds.some((id) => !evidenceIds.has(id)))) errors.push('AI_OUTPUT_INVALID');
  if (data.evidence.filter((e) => e.decisive).length < 3) errors.push('AI_OUTPUT_INVALID');
  if (!data.evidence.some((e) => e.redHerringExplanation)) errors.push('AI_OUTPUT_INVALID');
  if (new Set(data.timeline.map((e) => e.timestamp)).size < data.timeline.length) errors.push('AI_OUTPUT_INVALID');
  return errors;
}
