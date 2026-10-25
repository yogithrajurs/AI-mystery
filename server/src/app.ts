import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { CaseModel, SuspectModel, EvidenceModel, SolutionModel, ProgressModel, AccusationModel, JobModel } from './models.js';
import { scenarioSchema } from './schemas.js';
import { runGeneration } from './services/generation.service.js';

const log = pino({ level: env.NODE_ENV === 'development' ? 'debug' : 'info' });
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '32kb' }));
const cookieName = env.NODE_ENV === 'production' ? '__Host-mystery_session' : 'mystery_session';
const signature = (value: string) => createHmac('sha256', env.SESSION_SECRET).update(value).digest('hex');
function session(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers.cookie?.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (raw) {
    try {
      const [id, expires, sig] = decodeURIComponent(raw).split('.');
      const payload = `${id}.${expires}`;
      const expected = signature(payload);
      if (id && expires && sig && Number(expires) > Date.now() && Buffer.byteLength(sig) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
        res.locals.sessionId = id; next(); return;
      }
    } catch { /* Invalid cookies are replaced with a fresh anonymous session. */ }
  }
  const id = randomBytes(32).toString('hex');
  const expires = String(Date.now() + env.SESSION_TTL_HOURS * 3600_000);
  const payload = `${id}.${expires}`;
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `${cookieName}=${encodeURIComponent(`${payload}.${signature(payload)}`)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(env.SESSION_TTL_HOURS * 3600)}${secure}`);
  res.locals.sessionId = id;
  next();
}
app.use(session);
app.use((req, res, next) => { res.locals.requestId = randomUUID(); res.setHeader('X-Request-Id', res.locals.requestId); next(); });
app.use((req, res, next) => {
  const requestOrigin = `${req.protocol}://${req.get('host')}`;
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && req.headers.origin && req.headers.origin !== env.CLIENT_URL && req.headers.origin !== requestOrigin) return res.status(403).json({ error: { code: 'ACCESS_DENIED', message: 'Request origin is not allowed.', requestId: res.locals.requestId } });
  next();
});
const createLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: env.MAX_CASES_PER_HOUR, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Mystery creation limit reached. Try again later.' } } });
const accuseLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const fail = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message, requestId: res.locals.requestId } });
const owner = (req: Request, res: Response, next: NextFunction) => {
  CaseModel.findOne({ _id: req.params.caseId, ownerSessionId: res.locals.sessionId }).then((record) => {
    if (!record) return fail(res, 404, 'CASE_NOT_FOUND', 'This case could not be found.');
    res.locals.caseRecord = record; next();
  }).catch(next);
};
const publicCase = (record: any) => ({ id: record._id, title: record.title, summary: record.publicSummary, genre: record.genre, difficulty: record.difficulty, status: record.status, suspectCount: record.suspectIds?.length ?? 0, evidenceCount: record.evidenceIds?.length ?? 0 });
const publicSuspect = (s: any) => ({ id: s._id, name: s.name, role: s.role, background: s.background, publicMotive: s.publicMotive, statement: s.statement, publicAlibi: s.publicAlibi, displayOrder: s.displayOrder });
const publicEvidence = (e: any) => ({ id: e._id, type: e.type, title: e.title, description: e.description, content: e.content, relatedSuspectIds: e.relatedSuspectIds, occurredAt: e.occurredAt, assetIds: e.assetIds, displayOrder: e.displayOrder });

app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', async (_req, res) => {
  const ready = (await import('mongoose')).default.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', database: ready ? 'connected' : 'disconnected' });
});
app.post('/api/v1/cases', createLimit, async (req, res, next) => {
  const parsed = scenarioSchema.safeParse(req.body);
  if (!parsed.success || parsed.data.scenario.length > env.MAX_SCENARIO_LENGTH) return fail(res, 400, 'VALIDATION_ERROR', `Enter a scenario between 20 and ${env.MAX_SCENARIO_LENGTH} characters.`);
  try {
    const caseId = `case_${randomUUID()}`; const jobId = `job_${randomUUID()}`;
    await CaseModel.create({ _id: caseId, ownerSessionId: res.locals.sessionId, scenario: parsed.data.scenario, genre: parsed.data.genre, difficulty: parsed.data.difficulty, status: 'generating', title: 'Preparing your case', publicSummary: 'Your fictional investigation is being prepared.', suspectIds: [], evidenceIds: [], timeline: [] });
    await JobModel.create({ _id: jobId, jobId, caseId, status: 'queued', stage: 'queued', attempt: 0 });
    setImmediate(() => void runGeneration(caseId, parsed.data.scenario, parsed.data.genre, parsed.data.difficulty));
    res.status(202).json({ caseId, jobId, status: 'generating', statusUrl: `/api/v1/cases/${caseId}/status` });
  } catch (error) { next(error); }
});
app.get('/api/v1/cases/:caseId/status', owner, async (req, res, next) => {
  try { const job = await JobModel.findOne({ caseId: req.params.caseId }).lean(); res.json({ caseId: req.params.caseId, status: job?.status ?? 'failed', stage: job?.stage ?? 'failed', error: job?.errorCode ?? null }); } catch (e) { next(e); }
});
app.get('/api/v1/cases/:caseId', owner, (_req, res) => res.json(publicCase(res.locals.caseRecord)));
app.get('/api/v1/cases/:caseId/suspects', owner, async (req, res, next) => { try { if (res.locals.caseRecord.status !== 'ready') return fail(res, 409, 'CASE_NOT_READY', 'The investigation is not ready yet.'); const rows = await SuspectModel.find({ caseId: req.params.caseId }).sort({ displayOrder: 1 }).lean(); res.json(rows.map(publicSuspect)); } catch (e) { next(e); } });
app.get('/api/v1/cases/:caseId/evidence', owner, async (req, res, next) => { try { if (res.locals.caseRecord.status !== 'ready') return fail(res, 409, 'CASE_NOT_READY', 'Evidence is still being prepared.'); const filter: Record<string, unknown> = { caseId: req.params.caseId }; if (typeof req.query.type === 'string') filter.type = req.query.type; const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50)); const rows = await EvidenceModel.find(filter).sort({ displayOrder: 1 }).limit(limit).lean(); res.json(rows.map(publicEvidence)); } catch (e) { next(e); } });
app.get('/api/v1/cases/:caseId/evidence/:evidenceId', owner, async (req, res, next) => { try { const row = await EvidenceModel.findOne({ _id: req.params.evidenceId, caseId: req.params.caseId }).lean(); if (!row) return fail(res, 404, 'CASE_NOT_FOUND', 'This evidence could not be found.'); res.json(publicEvidence(row)); } catch (e) { next(e); } });
app.get('/api/v1/cases/:caseId/timeline', owner, (_req, res) => res.json(res.locals.caseRecord.timeline ?? []));
app.get('/api/v1/cases/:caseId/progress', owner, async (req, res, next) => { try { const p = await ProgressModel.findOne({ caseId: req.params.caseId, ownerSessionId: res.locals.sessionId }).lean(); res.json(p ? { viewedEvidenceIds: p.viewedEvidenceIds, bookmarkedEvidenceIds: p.bookmarkedEvidenceIds, notes: p.notes, selectedSuspectId: p.selectedSuspectId, status: p.status } : { viewedEvidenceIds: [], bookmarkedEvidenceIds: [], notes: '', status: 'in_progress' }); } catch (e) { next(e); } });
app.patch('/api/v1/cases/:caseId/progress', owner, async (req, res, next) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.notes !== 'string' || body.notes.length > 5000 || !Array.isArray(body.viewedEvidenceIds) || !Array.isArray(body.bookmarkedEvidenceIds) || [...body.viewedEvidenceIds, ...body.bookmarkedEvidenceIds].some((id) => typeof id !== 'string')) return fail(res, 400, 'VALIDATION_ERROR', 'Progress data is invalid.');
  try {
    const caseId = req.params.caseId as string;
    const allIds = new Set<string>(res.locals.caseRecord.evidenceIds);
    const viewed = [...new Set(body.viewedEvidenceIds as string[])].filter((id) => allIds.has(id)); const saved = [...new Set(body.bookmarkedEvidenceIds as string[])].filter((id) => allIds.has(id));
    const update = { viewedEvidenceIds: viewed, bookmarkedEvidenceIds: saved, notes: body.notes };
    const doc = await ProgressModel.findOneAndUpdate({ caseId, ownerSessionId: res.locals.sessionId }, { $set: update, $setOnInsert: { _id: randomUUID(), caseId, ownerSessionId: res.locals.sessionId } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    res.json({ viewedEvidenceIds: doc?.viewedEvidenceIds ?? [], bookmarkedEvidenceIds: doc?.bookmarkedEvidenceIds ?? [], notes: doc?.notes ?? '' });
  } catch (e) { next(e); }
});
app.post('/api/v1/cases/:caseId/accusations', accuseLimit, owner, async (req, res, next) => {
  try {
    const record = res.locals.caseRecord;
    if (record.status !== 'ready') return fail(res, 409, 'CASE_NOT_READY', 'This case is not ready for an accusation.');
    const suspectId = req.body?.suspectId;
    if (typeof suspectId !== 'string' || !record.suspectIds.includes(suspectId)) return fail(res, 400, 'INVALID_SUSPECT', 'Choose a suspect from this case.');
    const sessionId = res.locals.sessionId as string; const caseId = req.params.caseId as string;
    if (await AccusationModel.exists({ caseId, ownerSessionId: sessionId })) return fail(res, 409, 'ALREADY_SUBMITTED', 'A final accusation has already been submitted.');
    const solution = await SolutionModel.findOne({ caseId }).lean();
    if (!solution) return fail(res, 409, 'CASE_NOT_READY', 'The solution is not available yet.');
    const correct = suspectId === solution.culpritId;
    await AccusationModel.create({ _id: randomUUID(), caseId, ownerSessionId: sessionId, selectedSuspectId: suspectId, isCorrect: correct, submittedAt: new Date() });
    await ProgressModel.findOneAndUpdate({ caseId, ownerSessionId: sessionId }, { $set: { status: 'completed', submittedAt: new Date(), selectedSuspectId: suspectId }, $setOnInsert: { _id: randomUUID() } }, { upsert: true });
    const culprit = await SuspectModel.findOne({ _id: solution.culpritId, caseId }).lean();
    res.json({ result: correct ? 'correct' : 'incorrect', completed: true, solution: { culpritId: solution.culpritId, culpritName: culprit?.name, motive: solution.motive, methodSummary: solution.methodSummary, reasoning: solution.reasoning, decisiveEvidenceIds: solution.decisiveEvidenceIds, eventSequence: solution.eventSequence, redHerringExplanations: solution.redHerringExplanations } });
  } catch (e) { next(e); }
});
app.get('/api/v1/cases/:caseId/result', owner, async (req, res, next) => {
  try { const done = await AccusationModel.exists({ caseId: req.params.caseId, ownerSessionId: res.locals.sessionId }); if (!done) return fail(res, 403, 'ACCESS_DENIED', 'Submit your final accusation to see the solution.'); const solution = await SolutionModel.findOne({ caseId: req.params.caseId }).lean(); const culprit = solution && await SuspectModel.findById(solution.culpritId).lean(); if (!solution) return fail(res, 404, 'CASE_NOT_FOUND', 'The solution could not be found.'); res.json({ culpritId: solution.culpritId, culpritName: culprit?.name, motive: solution.motive, methodSummary: solution.methodSummary, reasoning: solution.reasoning, decisiveEvidenceIds: solution.decisiveEvidenceIds, eventSequence: solution.eventSequence, redHerringExplanations: solution.redHerringExplanations }); } catch (e) { next(e); }
});
const clientBuildPath = fileURLToPath(new URL('../../client/dist/', import.meta.url));
app.use(express.static(clientBuildPath, { index: false, maxAge: env.NODE_ENV === 'production' ? '1h' : 0 }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/health/')) return fail(res, 404, 'CASE_NOT_FOUND', 'The requested endpoint could not be found.');
  res.sendFile(join(clientBuildPath, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }, (error) => { if (error) next(error); });
});
app.use((_req, res) => fail(res, 404, 'CASE_NOT_FOUND', 'The requested endpoint could not be found.'));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { const err = error as Error & { code?: number }; if (err.code === 11000) return fail(res, 409, 'ALREADY_SUBMITTED', 'A final accusation has already been submitted.'); log.error({ requestId: res.locals.requestId, message: err.message }, 'Request failed'); fail(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.'); });

export default app;

