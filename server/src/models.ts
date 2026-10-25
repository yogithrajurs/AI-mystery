import mongoose, { Schema } from 'mongoose';

const TimelineEventSchema = new Schema({ eventId: String, timestamp: String, description: String, location: String, relatedSuspectIds: [String], relatedEvidenceIds: [String] }, { _id: false });
const CaseSchema = new Schema({ _id: String, ownerSessionId: { type: String, index: true }, title: String, scenario: String, genre: String, difficulty: String, status: { type: String, index: true }, publicSummary: String, suspectIds: [String], evidenceIds: [String], timeline: [TimelineEventSchema], promptVersion: String, modelId: String }, { timestamps: true });
const SuspectSchema = new Schema({ _id: String, caseId: { type: String, index: true }, name: String, role: String, background: String, publicMotive: String, statement: String, publicAlibi: String, displayOrder: Number });
const EvidenceSchema = new Schema({ _id: String, caseId: { type: String, index: true }, type: String, title: String, description: String, content: Schema.Types.Mixed, relatedSuspectIds: [String], occurredAt: String, assetIds: [String], displayOrder: Number });
const SolutionSchema = new Schema({ _id: String, caseId: { type: String, unique: true }, culpritId: String, motive: String, methodSummary: String, eventSequence: [TimelineEventSchema], reasoning: [{ step: Number, text: String, evidenceIds: [String] }], decisiveEvidenceIds: [String], redHerringExplanations: [{ evidenceId: String, explanation: String }], validatedAt: Date, schemaVersion: String });
const ProgressSchema = new Schema({ _id: String, caseId: String, ownerSessionId: String, viewedEvidenceIds: [String], bookmarkedEvidenceIds: [String], notes: { type: String, maxlength: 5000 }, selectedSuspectId: String, status: { type: String, default: 'in_progress' }, submittedAt: Date }, { timestamps: true });
ProgressSchema.index({ ownerSessionId: 1, caseId: 1 }, { unique: true });
const AccusationSchema = new Schema({ _id: String, caseId: String, ownerSessionId: String, selectedSuspectId: String, isCorrect: Boolean, submittedAt: Date });
AccusationSchema.index({ caseId: 1, ownerSessionId: 1 }, { unique: true });
const JobSchema = new Schema({ _id: String, jobId: String, caseId: String, status: String, stage: String, attempt: Number, errorCode: String }, { timestamps: true });
JobSchema.index({ caseId: 1, status: 1 });

export const CaseModel = mongoose.model('MysteryCase', CaseSchema);
export const SuspectModel = mongoose.model('Suspect', SuspectSchema);
export const EvidenceModel = mongoose.model('Evidence', EvidenceSchema);
export const SolutionModel = mongoose.model('CanonicalSolution', SolutionSchema);
export const ProgressModel = mongoose.model('InvestigationProgress', ProgressSchema);
export const AccusationModel = mongoose.model('Accusation', AccusationSchema);
export const JobModel = mongoose.model('GenerationJob', JobSchema);

