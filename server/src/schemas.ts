import { z } from 'zod';

export const scenarioSchema = z.object({
  scenario: z.string().trim().min(20).max(1000),
  genre: z.enum(['murder-mystery', 'theft', 'disappearance', 'suspense', 'general']).default('general'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium')
});
const timelineSchema = z.object({ eventId: z.string(), timestamp: z.string(), description: z.string(), location: z.string().optional(), relatedSuspectIds: z.array(z.string()), relatedEvidenceIds: z.array(z.string()) });
export const generatedSchema = z.object({
  title: z.string().min(3).max(100), summary: z.string().min(20),
  culpritId: z.string(), motive: z.string(), methodSummary: z.string(),
  suspects: z.array(z.object({ id: z.string(), name: z.string(), role: z.string(), background: z.string(), publicMotive: z.string(), statement: z.string(), publicAlibi: z.string() })).length(4),
  evidence: z.array(z.object({ id: z.string(), type: z.enum(['chat','image','camera','statement','document','timeline','physical']), title: z.string(), description: z.string(), content: z.record(z.unknown()), relatedSuspectIds: z.array(z.string()), occurredAt: z.string().optional(), decisive: z.boolean().default(false), redHerringExplanation: z.string().optional() })).min(6),
  timeline: z.array(timelineSchema).min(3), reasoning: z.array(z.object({ step: z.number(), text: z.string(), evidenceIds: z.array(z.string()) })).min(2), eventSequence: z.array(timelineSchema).min(2)
});
export type GeneratedCase = z.infer<typeof generatedSchema>;

