# AI Mystery Room — Software Requirements & Technical Specification

**Document:** `SPEC.md`  
**Version:** 1.0.0  
**Status:** Initial Development Specification  
**Development Methodology:** Spec-Driven Development (SDD)  
**Single Source of Truth:** This document  
**Frontend:** React.js  
**Backend:** Node.js + Express.js  
**Database:** MongoDB  
**AI Provider:** Google Gemini API

---

# 1. Project Overview

## 1.1 Project Description

AI Mystery Room is an AI-powered interactive detective investigation platform. Users submit a short scenario, story, or mystery premise, and the application transforms it into a complete fictional investigation.

The backend uses Google Gemini to generate a structured mystery containing suspects, motives, timelines, clues, and fictional evidence. Users explore the evidence, connect the clues, investigate contradictions, and identify the culprit.

Evidence may include:

- WhatsApp-style conversations.
- AI-generated images and photographs.
- CCTV-style recordings, transcripts, and simulated footage.
- Suspect profiles and witness statements.
- Incident timelines and location records.
- Documents, notes, and other fictional evidence.

After investigating the case, the user selects a suspect as the culprit. The application evaluates the answer against the predetermined solution and presents the result with a detailed explanation.

The experience should feel like an immersive digital detective workspace, not a generic AI chatbot.

## 1.2 Problem Statement

Traditional mystery games offer fixed stories with limited replayability. AI Mystery Room enables users to create new investigation challenges from their own ideas, allowing for a wider variety of scenarios and evidence.

The primary technical challenge is ensuring that AI-generated evidence remains consistent with the story and supports one definite, logically defensible solution.

## 1.3 Project Objectives

1. Allow users to create mysteries from short text prompts.
2. Generate fictional investigations with multiple suspects.
3. Provide varied, interactive evidence.
4. Maintain one predetermined culprit and a consistent chain of reasoning.
5. Allow users to investigate before submitting a final answer.
6. Reveal a detailed solution after submission.
7. Support multiple independent investigations.
8. Provide a responsive, polished detective-themed interface.
9. Keep API credentials and sensitive solution data on the server.
10. Maintain a modular architecture that Codex can implement and test systematically.

## 1.4 Target Users

- Casual players who enjoy detective stories.
- Mystery and puzzle enthusiasts.
- Students interested in logical reasoning.
- Content creators looking for interactive mystery concepts.

## 1.5 Scope of the Initial Release

### In scope — MVP

- Scenario submission.
- AI-generated mystery cases.
- Suspect profiles.
- Structured evidence generation.
- Evidence viewing and filtering.
- Case timeline.
- Culprit selection.
- Answer evaluation and solution reveal.
- Case progress persistence.
- Responsive user interface.
- Basic validation, error handling, and rate limiting.

### Out of scope for the MVP

- Real police investigations or real-world criminal identification.
- Multiplayer investigation sessions.
- Public case marketplace.
- User-generated evidence uploads.
- Voice conversations with suspects.
- Live camera feeds or actual surveillance integrations.
- Paid subscriptions and billing.
- Native mobile applications.
- Mandatory user registration.

These features may be added in later versions without compromising the initial architecture.

---

# 2. Core Product Principles

The following principles are mandatory.

### 2.1 One source of truth for the mystery

The backend must establish the canonical mystery solution before creating the evidence presented to the user.

The canonical case contains the actual culprit, motive, method, event timeline, and relevant facts. All suspects, statements, and evidence must be generated from these facts.

### 2.2 Evidence must be consistent

Evidence must not contradict the canonical solution unless the contradiction is an intentional, explainable lie, mistaken statement, or misleading clue.

The backend must validate evidence before the case becomes playable.

### 2.3 One defensible answer

Every published case must have one intended culprit. The evidence must support that answer sufficiently for a reasonable player to deduce it.

If generation or validation fails, the application must retry generation or return a recoverable error. It must not publish a broken mystery.

### 2.4 No premature solution leakage

The culprit, private motive details, and final explanation must not appear in public case responses, browser state, page source, or ordinary evidence API responses before the user submits an answer.

### 2.5 Fictional content

All cases, suspects, conversations, images, and recordings are fictional. The interface must communicate this clearly.

User-provided real names or personal details must not be treated as verified evidence about actual people.

---

# 3. Technology Stack

## 3.1 Frontend

- React.js.
- Vite.
- React Router.
- TypeScript.
- Tailwind CSS.
- A reusable component system for buttons, cards, dialogs, tabs, and evidence viewers.
- TanStack Query for API requests and cache management.
- React Hook Form and Zod for form validation.

Use a consistent dependency set and commit the package lockfile.

## 3.2 Backend

- Node.js.
- Express.js.
- TypeScript.
- Zod for request and AI response validation.
- Official Google GenAI SDK for Gemini integration.
- MongoDB with Mongoose.
- Pino or another structured logger.
- Helmet for security headers.
- A configurable rate-limiting middleware.

## 3.3 Database

MongoDB stores:

- Mystery cases.
- Public case metadata.
- Private canonical solutions.
- Suspects and evidence.
- User progress and submissions.
- Generation status and retry metadata.

For the MVP, anonymous users may receive a server-issued, opaque session identifier. Authentication can be added later.

## 3.4 AI

Use the Google Gemini API through a dedicated backend service.

All model identifiers must be configured using environment variables. Do not hardcode a model identifier throughout the application.

The model must support the selected structured output or JSON generation capabilities. Pin the model configuration and validate all returned data.

## 3.5 Architecture

Use a modular monolith for the MVP. Do not introduce microservices unnecessarily.

Logical architecture:

1. React client.
2. Express REST API.
3. Case orchestration service.
4. Gemini generation service.
5. Validation and consistency service.
6. MongoDB persistence layer.
7. Optional external image-generation provider or asset-generation adapter.

Gemini is the AI reasoning and content-generation provider. Do not assume that a text-generation endpoint automatically produces actual images or videos.

---

# 4. User Journey

## 4.1 Create a Mystery

1. The user opens the home page.
2. The user enters a short scenario.
3. The user selects the difficulty.
4. The user optionally chooses a genre.
5. The user selects **Create Mystery**.
6. The frontend validates the form.
7. The backend creates a generation job and returns a case identifier.
8. The frontend displays a loading state.
9. The backend generates, validates, and stores the mystery.
10. The user is redirected to the investigation room.

## 4.2 Investigate

1. The user sees the case title and incident summary.
2. The user opens the suspects panel.
3. The user reads suspect profiles and statements.
4. The user inspects evidence categories.
5. The user reads chat logs, image descriptions, and camera evidence.
6. The user reviews the event timeline.
7. The user identifies inconsistencies and compares alibis.
8. The user can bookmark evidence or add private investigation notes.
9. The user proceeds to the accusation screen.

## 4.3 Submit an Accusation

1. The user chooses one suspect.
2. The interface asks for confirmation.
3. The frontend submits the selected suspect ID.
4. The backend checks that the suspect belongs to the case.
5. The backend evaluates the selection against the private canonical culprit ID.
6. The backend stores the attempt.
7. The server returns the result and, after a final submission, the authorized solution explanation.
8. The user sees the verdict, reasoning, and supporting clues.

## 4.4 Replay

The user can return to a completed case to review its evidence and solution.

Creating a new mystery produces a separate case with independent canonical facts and evidence.

---

# 5. Functional Requirements

## FR-01: Scenario Input

The application shall allow users to enter a scenario.

Requirements:

- Minimum: 20 characters.
- Maximum: 1,000 characters.
- Trim whitespace.
- Reject empty or whitespace-only input.
- Display character count.
- Reject unsupported or abusive content according to the configured content policy.
- Do not interpret user input as trusted system instructions.

## FR-02: Mystery Configuration

Allow the user to choose:

**Difficulty**
- Easy.
- Medium.
- Hard.

**Genre**
- Murder mystery.
- Theft.
- Disappearance.
- Suspense.
- General detective mystery.

The application must not require users to choose a genre; provide a default.

For sensitive themes, follow applicable content safety requirements. Avoid graphic details and real-world instructions for wrongdoing.

## FR-03: Case Generation

The backend shall generate:

- Case title.
- Case description.
- Incident details.
- Four suspects by default.
- Suspect profiles and motives.
- One canonical culprit.
- Incident timeline.
- At least six evidence items.
- Multiple independent clues that support the solution.
- At least one misleading clue with an explainable interpretation.
- A final solution and reasoning chain.
- An evidence-to-suspect relationship map.

Recommended configurable generation limits:

| Property | Default |
|---|---:|
| Suspects | 4 |
| Evidence items | 8 |
| Minimum decisive clues | 3 |
| Maximum generation attempts | 3 |
| Scenario characters | 1,000 |

These values should be configurable without changing the domain model.

## FR-04: Suspect Profiles

Each suspect shall include:

- Unique ID.
- Name.
- Age, if appropriate.
- Occupation or role.
- Relationship to the incident.
- Publicly visible motive or background.
- Initial statement.
- Public alibi.
- Public portrait or avatar reference, when available.

Suspects must have distinguishable characteristics. The intended culprit must not be identified through an obvious label or metadata.

## FR-05: Evidence Generation

Support the following evidence types:

1. `chat` — fictional WhatsApp-style messages.
2. `image` — image asset or image description.
3. `camera` — simulated CCTV transcript, frame sequence, or generated video asset.
4. `statement` — suspect or witness statement.
5. `document` — report, note, receipt, or record.
6. `timeline` — incident events.
7. `physical` — fictional descriptions of physical clues.

Each evidence item must contain:

- Unique evidence ID.
- Title.
- Type.
- Description.
- Content or asset reference.
- Timestamp, where relevant.
- Public visibility status.
- Related suspect IDs.
- Display order.
- Optional location.
- Optional metadata needed for the viewer.

Do not send internal solution annotations or hidden clue mappings to the client.

## FR-06: Chat Evidence

Chat evidence should display:

- Fictional participant names.
- Message text.
- Timestamp.
- Sender.
- Optional delivery/read indicators.
- Conversation grouping.

Chat records must use structured messages rather than one large unstructured string.

The interface must clearly identify generated chat logs as fictional recreations.

## FR-07: Image Evidence

The system should support two modes:

- **MVP fallback:** AI-generated image descriptions with a visual evidence card.
- **Enhanced mode:** actual generated images stored as assets and referenced by URL or object key.

The application must not pretend a text description is a real image.

An image-generation adapter may be integrated separately. Do not assume Gemini text generation alone creates an image.

Store image metadata and an asset reference rather than embedding large base64 images in MongoDB documents.

## FR-08: Camera Evidence

The system should support:

- Simulated camera metadata.
- Camera location and timestamp.
- Transcript or scene description.
- Timestamped frames or observations.
- Optional generated video asset.

For the MVP, textual CCTV reconstructions and timestamped observations are sufficient.

Do not display fake generated material as authentic surveillance footage. Label it as AI-generated simulation.

## FR-09: Evidence Browser

Users shall be able to:

- Browse all available evidence.
- Filter by type.
- Open an evidence detail panel.
- Navigate between evidence items.
- View associated timestamps and suspect references.
- Bookmark items.
- Add private notes.
- Return to the suspect list without losing progress.

## FR-10: Investigation Timeline

Display relevant events in chronological order.

Each event shall include:

- Time or time range.
- Event description.
- Optional location.
- Related evidence reference.

The timeline must agree with the canonical case facts.

## FR-11: Culprit Selection

The user must select a suspect before submitting the final accusation.

The application shall:

- Show selectable suspect cards.
- Highlight the selected suspect.
- Require confirmation.
- Prevent invalid suspect IDs.
- Avoid revealing correctness before final submission.
- Enforce the configured attempt policy.

MVP policy: one final accusation per case. Users can review evidence before confirming.

## FR-12: Verdict and Solution

After submission, the backend shall return:

- Correct or incorrect result.
- The intended culprit.
- The motive.
- The sequence of events.
- The decisive clues.
- An explanation of misleading clues.
- The relationship between the evidence and the conclusion.

The frontend shall present this information in a readable case-closure screen.

## FR-13: Progress Persistence

Save:

- Current case.
- Investigation status.
- Viewed evidence IDs.
- Bookmarked evidence IDs.
- Private notes.
- Selected suspect, if not submitted.
- Submission timestamp.
- Final result.

Do not store API secrets or unnecessary personal information in the progress record.

## FR-14: Error and Recovery

The application must handle:

- Invalid input.
- AI service timeout.
- AI rate limit.
- Malformed AI response.
- Inconsistent mystery generation.
- Database failure.
- Missing asset.
- Expired or invalid session.
- Duplicate submissions.
- Network interruption.

Show clear, user-friendly messages. Never expose stack traces, internal prompts, API keys, or canonical solution objects.

---

# 6. Non-Functional Requirements

## NFR-01: Security

- Keep all provider credentials server-side.
- Validate and sanitize requests.
- Enforce authorization on every case-specific endpoint.
- Use Helmet and restrictive CORS.
- Apply request-size limits.
- Use rate limits for generation and accusation endpoints.
- Prevent NoSQL injection and prototype-pollution risks.
- Avoid exposing raw database documents.
- Avoid logging secrets, session tokens, or private solution data.

## NFR-02: Performance

Targets under normal deployment conditions:

- Initial page render: aim for under 3 seconds on a typical broadband connection.
- Ordinary API requests: aim for a p95 response time below 500 ms, excluding AI generation.
- Case generation: show progress immediately and avoid blocking the browser request for the entire generation process.
- Evidence navigation: should not require a new AI generation request.

These are targets, not guarantees, and should be measured in deployment.

## NFR-03: Reliability

- Validate all generated data.
- Use bounded retries with backoff.
- Store generation status.
- Prevent incomplete cases from becoming playable.
- Make generation job processing idempotent.
- Handle duplicate requests without creating accidental duplicate cases.

## NFR-04: Accessibility

- Use semantic HTML.
- Support keyboard navigation.
- Provide visible focus states.
- Ensure adequate color contrast.
- Include alt text for generated image assets.
- Do not rely on color alone to communicate correctness.
- Respect reduced-motion preferences.

## NFR-05: Responsive Design

Support mobile, tablet, laptop, and desktop widths.

On small screens, use a collapsible investigation navigation and full-screen evidence detail views when appropriate.

## NFR-06: Maintainability

- Use TypeScript across frontend and backend.
- Keep controllers thin.
- Separate domain logic from persistence and AI provider code.
- Validate all external data at service boundaries.
- Maintain a shared API contract.
- Provide automated tests and setup documentation.

---

# 7. Application Pages and UI Specification

## 7.1 Home Page — `/`

Purpose: Introduce the experience and start a new mystery.

Components:

- Brand/logo: AI Mystery Room.
- Headline: “Every clue tells a story. Can you solve it?”
- Short explanation of the game.
- Scenario text area.
- Genre selector.
- Difficulty selector.
- Create Mystery button.
- Example scenario suggestions.
- Fictional-content disclaimer.

Design direction:

Use a cinematic detective aesthetic, dark navy or charcoal surfaces, subtle blue accents, readable typography, and restrained investigative visual details.

Avoid excessive glow, clutter, or unnecessary animations.

## 7.2 Generation Page — `/cases/:caseId/generating`

Display:

- Generation status.
- Progress stage.
- Rotating status text.
- Retry or return option when appropriate.

Suggested stages:

1. Interpreting your scenario.
2. Establishing suspects and motives.
3. Constructing the timeline.
4. Generating evidence.
5. Checking consistency.
6. Preparing the investigation room.

Do not fabricate precise progress percentages unless actual progress is available.

## 7.3 Investigation Room — `/cases/:caseId`

Layout:

- Left navigation: case summary, suspects, evidence, timeline, notes.
- Main workspace: selected content.
- Optional right panel: investigation notebook or contextual information.

Header:

- Case title.
- Difficulty.
- Investigation status.
- Evidence count.
- Accuse Culprit button.

The canonical culprit must not be visible anywhere in this view.

## 7.4 Suspects Page or Panel

Display suspect portraits or placeholders, names, roles, public statements, and available background information.

Do not display private solution fields or unvalidated motive assumptions.

## 7.5 Evidence Viewer

Provide type-specific renderers for chats, images, camera reconstructions, documents, statements, and timeline entries.

Include previous/next navigation and related evidence links.

## 7.6 Accusation Screen — `/cases/:caseId/accuse`

Display all suspects as selectable cards.

Require a suspect selection and confirmation before final submission.

Warn the user that submitting will reveal the solution and finish the investigation.

## 7.7 Case Closure Screen — `/cases/:caseId/result`

Display:

- Verdict.
- Intended culprit.
- Explanation.
- Decisive evidence.
- Timeline reconstruction.
- Explanation of red herrings.
- Play Again / Create Another Mystery action.

Only return solution data after an authorized final submission or an authorized request to view an already-completed case.

## 7.8 Error and Empty States

Provide dedicated UI states for:

- No evidence available.
- Generation failed.
- Case not found.
- Access denied.
- Network unavailable.
- Invalid scenario.
- Expired session.

---

# 8. Frontend Architecture

Recommended structure:

```text
client/
  src/
    app/
      App.tsx
      router.tsx
      providers.tsx
    components/
      ui/
      layout/
      forms/
      suspects/
      evidence/
      timeline/
      investigation/
    pages/
      HomePage.tsx
      GeneratingPage.tsx
      InvestigationPage.tsx
      AccusationPage.tsx
      ResultPage.tsx
      NotFoundPage.tsx
    features/
      cases/
      suspects/
      evidence/
      investigation/
    hooks/
    lib/
      api.ts
      validation.ts
    types/
    styles/
    main.tsx
```

## Frontend Rules

1. Keep API calls inside a dedicated API layer.
2. Use typed response objects.
3. Do not embed Gemini calls in the frontend.
4. Do not hardcode mystery content into production components.
5. Use reusable evidence renderers.
6. Handle loading, empty, and error states explicitly.
7. Use server-returned public data only.
8. Do not infer the correct culprit from UI ordering or identifiers.
9. Persist progress through the backend rather than relying exclusively on local storage.

---

# 9. Backend Architecture

Recommended structure:

```text
server/
  src/
    app.ts
    server.ts
    config/
      env.ts
      database.ts
    routes/
      case.routes.ts
      evidence.routes.ts
      accusation.routes.ts
      progress.routes.ts
    controllers/
      case.controller.ts
      evidence.controller.ts
      accusation.controller.ts
      progress.controller.ts
    services/
      case.service.ts
      generation.service.ts
      gemini.service.ts
      validation.service.ts
      accusation.service.ts
      progress.service.ts
      asset.service.ts
    models/
      Case.ts
      Suspect.ts
      Evidence.ts
      Progress.ts
      GenerationJob.ts
    middleware/
      authSession.ts
      errorHandler.ts
      rateLimiter.ts
      validateRequest.ts
    schemas/
      case.schema.ts
      suspect.schema.ts
      evidence.schema.ts
      solution.schema.ts
    utils/
      ids.ts
      logger.ts
    types/
```

## Backend Responsibilities

### Case service

Creates, retrieves, and manages case lifecycle.

### Generation service

Coordinates generation stages and persistence.

### Gemini service

Sends prompts to the Gemini API and returns validated structured candidates.

### Validation service

Checks structural validity, referential integrity, timeline consistency, clue support, and solution uniqueness.

### Accusation service

Evaluates submitted suspect IDs against the canonical solution and manages submission rules.

### Asset service

Handles generated image or video asset metadata, storage, and safe retrieval.

---

# 10. Mystery Generation Pipeline

This is the most important backend workflow.

## Step 1: Validate the Scenario

Validate length, configuration, and content policy. Treat the user's scenario as untrusted data.

## Step 2: Create a Generation Job

Persist a job with:

- `jobId`
- `caseId`
- `status`
- `stage`
- `attempt`
- `createdAt`
- `updatedAt`
- `errorCode`, if failed

Initial status: `queued`.

## Step 3: Generate the Canonical Case Blueprint

Ask Gemini to generate the internal truth of the mystery before producing the public evidence.

The blueprint includes:

- Incident facts.
- Canonical culprit ID.
- Motive.
- Method at a non-instructional narrative level.
- Event timeline.
- Suspect relationships.
- Suspect alibis.
- Known truths, lies, and misunderstandings.
- The actual sequence of events.
- A list of facts that evidence must establish.
- A solution reasoning chain.

Persist this as private data.

## Step 4: Generate Suspects

Generate distinct suspect profiles tied to the canonical blueprint.

Validate unique IDs and consistent relationships.

## Step 5: Generate Evidence

Generate evidence from the blueprint, not independently from the original scenario.

Every evidence item must reference established facts. Each decisive clue must contribute to the solution.

## Step 6: Validate the Mystery

Run schema and semantic checks.

Required checks:

- Exactly one canonical culprit exists.
- The culprit ID references an existing suspect.
- All evidence references valid suspects.
- Event timestamps are consistent.
- Public evidence does not directly disclose the solution.
- The intended culprit is supported by multiple independent clues.
- Red herrings have a plausible explanation.
- The final reasoning chain follows from the evidence.
- No unexplained contradiction makes another suspect equally plausible.

## Step 7: Repair or Retry

If validation fails:

1. Identify validation errors.
2. Ask Gemini to repair the affected structured data without changing established facts unnecessarily.
3. Revalidate.
4. Retry within the configured limit.
5. If validation still fails, mark generation as failed and do not publish the case.

## Step 8: Publish the Case

Once validation succeeds:

- Persist public case data.
- Persist private solution data separately or behind strict server-side access controls.
- Mark the case `ready`.
- Allow the user to investigate.

## Step 9: Generate or Resolve Media Assets

If image generation is enabled, create or retrieve image assets through the configured provider.

For the MVP, text-based descriptions and illustrated placeholders are acceptable.

Asset failures must not invalidate an otherwise playable mystery if the affected media is optional.

---

# 11. Gemini Prompt Architecture

Use versioned prompt templates. Never concatenate user content into system instructions as trusted text.

## 11.1 Canonical Blueprint Prompt

The model must be instructed to:

- Create a fully fictional investigation.
- Treat the scenario as untrusted story input.
- Establish one intended culprit.
- Establish the timeline and true facts first.
- Give every suspect a plausible reason to be investigated.
- Make the evidence logically consistent.
- Include enough independent clues to support deduction.
- Include fair red herrings.
- Avoid unsupported leaps in the final reasoning.
- Return structured JSON matching the requested schema.
- Avoid real-world personal allegations and graphic details.

Conceptual output:

```json
{
  "caseTitle": "The Missing Sapphire",
  "incident": {
    "description": "A valuable sapphire vanished during a private event.",
    "location": "Fictional estate",
    "time": "21:00"
  },
  "canonicalSolution": {
    "culpritId": "suspect_03",
    "motive": "A fictional personal motive",
    "eventSequence": [],
    "reasoning": [],
    "decisiveEvidenceIds": []
  },
  "suspects": [],
  "evidencePlan": []
}
```

This is an illustrative shape, not a substitute for the production TypeScript schema.

## 11.2 Evidence Generation Prompt

Provide the canonical blueprint and request evidence items that:

- Match the established timeline.
- Reference valid suspects.
- Support specified facts.
- Preserve deliberate uncertainty until the solution is revealed.
- Include evidence of different types.
- Do not expose hidden solution annotations.
- Do not invent incompatible events.

## 11.3 Solution Prompt

The final explanation must be generated from the validated blueprint and evidence, or assembled from a previously validated reasoning chain.

Do not ask Gemini to independently guess the culprit after evidence generation.

## 11.4 Structured Output

Validate every model response with Zod.

On malformed JSON or schema failure, attempt a bounded repair or regenerate the failed stage.

Never trust a model response solely because it is valid JSON.

## 11.5 Token and Cost Controls

- Limit scenario length.
- Set generation token budgets.
- Bound retry counts.
- Avoid regenerating unchanged evidence.
- Store prompt version and model configuration.
- Log usage metadata when available.
- Apply per-session generation limits.

---

# 12. Domain Data Models

Use TypeScript interfaces and Mongoose schemas. IDs exposed to the client should be stable opaque strings or safe serialized database IDs.

## 12.1 Case

```ts
type CaseStatus =
  | "generating"
  | "ready"
  | "failed"
  | "archived";

interface MysteryCase {
  _id: string;
  ownerSessionId: string;
  title: string;
  scenario: string;
  genre: string;
  difficulty: "easy" | "medium" | "hard";
  status: CaseStatus;
  publicSummary: string;
  suspectIds: string[];
  evidenceIds: string[];
  timeline: TimelineEvent[];
  promptVersion: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 12.2 Suspect

```ts
interface Suspect {
  _id: string;
  caseId: string;
  name: string;
  role: string;
  background: string;
  publicMotive: string;
  statement: string;
  publicAlibi: string;
  portraitAssetId?: string;
  displayOrder: number;
}
```

Only public suspect information belongs in this model or public projection.

## 12.3 Evidence

```ts
type EvidenceType =
  | "chat"
  | "image"
  | "camera"
  | "statement"
  | "document"
  | "timeline"
  | "physical";

interface Evidence {
  _id: string;
  caseId: string;
  type: EvidenceType;
  title: string;
  description: string;
  content: Record<string, unknown>;
  relatedSuspectIds: string[];
  occurredAt?: Date;
  assetIds: string[];
  displayOrder: number;
}
```

The actual production schema must use a discriminated union for `content` based on `type`. Do not allow arbitrary unvalidated data to flow directly to the UI.

## 12.4 Private Canonical Solution

```ts
interface CanonicalSolution {
  caseId: string;
  culpritId: string;
  motive: string;
  methodSummary: string;
  eventSequence: TimelineEvent[];
  reasoning: ReasoningStep[];
  decisiveEvidenceIds: string[];
  redHerringExplanations: RedHerringExplanation[];
  validatedAt: Date;
  schemaVersion: string;
}
```

This collection must be private to the backend. Do not create an endpoint that returns this object before an authorized reveal.

## 12.5 Timeline Event

```ts
interface TimelineEvent {
  eventId: string;
  timestamp: string;
  description: string;
  location?: string;
  relatedSuspectIds: string[];
  relatedEvidenceIds: string[];
}
```

Use a documented timezone convention. Prefer ISO 8601 timestamps for actual instants and explicit fictional local times when the case does not specify a real timezone.

## 12.6 Progress

```ts
interface InvestigationProgress {
  _id: string;
  caseId: string;
  ownerSessionId: string;
  viewedEvidenceIds: string[];
  bookmarkedEvidenceIds: string[];
  notes: string;
  selectedSuspectId?: string;
  status: "in_progress" | "completed";
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 12.7 Accusation

```ts
interface Accusation {
  _id: string;
  caseId: string;
  ownerSessionId: string;
  selectedSuspectId: string;
  isCorrect: boolean;
  submittedAt: Date;
}
```

Enforce the one-final-submission policy at the backend and database level where practical.

---

# 13. MongoDB Design

Recommended collections:

- `cases`
- `suspects`
- `evidence`
- `canonical_solutions`
- `investigation_progress`
- `accusations`
- `generation_jobs`

Recommended indexes:

- `cases`: `{ ownerSessionId: 1, createdAt: -1 }`
- `suspects`: `{ caseId: 1, _id: 1 }`
- `evidence`: `{ caseId: 1, displayOrder: 1 }`
- `canonical_solutions`: `{ caseId: 1 }`, unique
- `investigation_progress`: `{ ownerSessionId: 1, caseId: 1 }`, unique
- `generation_jobs`: `{ caseId: 1, status: 1 }`

Use appropriate TTL indexes for expired sessions or temporary jobs only when deletion is safe and compatible with retention requirements.

For the MVP, the canonical solution may be stored in a separate collection. Every repository method must explicitly enforce access restrictions.

Never serialize Mongoose documents directly into public API responses.

---

# 14. REST API Specification

Base path: `/api/v1`

All endpoints return JSON and use a consistent error envelope.

## 14.1 Create a Case

`POST /api/v1/cases`

Request:

```json
{
  "scenario": "A necklace disappears during a dinner party.",
  "genre": "theft",
  "difficulty": "medium"
}
```

Response: `202 Accepted`

```json
{
  "caseId": "case_123",
  "jobId": "job_123",
  "status": "generating",
  "statusUrl": "/api/v1/cases/case_123/status"
}
```

The server must associate the case with the authenticated or anonymous owner session.

## 14.2 Get Generation Status

`GET /api/v1/cases/:caseId/status`

Response:

```json
{
  "caseId": "case_123",
  "status": "generating",
  "stage": "validating_evidence",
  "error": null
}
```

Allowed status values: `queued`, `generating`, `validating`, `ready`, `failed`.

## 14.3 Get a Case

`GET /api/v1/cases/:caseId`

Returns public case metadata only.

Response:

```json
{
  "id": "case_123",
  "title": "The Missing Necklace",
  "summary": "A necklace disappears during a dinner party.",
  "genre": "theft",
  "difficulty": "medium",
  "status": "ready",
  "suspectCount": 4,
  "evidenceCount": 8
}
```

Do not include the canonical culprit ID, private motives, hidden evidence annotations, or final reasoning.

## 14.4 Get Suspects

`GET /api/v1/cases/:caseId/suspects`

Returns the public suspect list.

## 14.5 Get Evidence List

`GET /api/v1/cases/:caseId/evidence`

Supports optional query parameters:

- `type`
- `limit`
- `cursor`

Return public evidence metadata and content only.

## 14.6 Get Evidence Detail

`GET /api/v1/cases/:caseId/evidence/:evidenceId`

Return the validated public representation of one evidence item.

Verify that the evidence belongs to the specified case.

## 14.7 Get Timeline

`GET /api/v1/cases/:caseId/timeline`

Return the public investigation timeline without hidden annotations.

## 14.8 Update Progress

`PATCH /api/v1/cases/:caseId/progress`

Request:

```json
{
  "viewedEvidenceIds": ["evidence_01"],
  "bookmarkedEvidenceIds": ["evidence_03"],
  "notes": "The second statement conflicts with the timeline."
}
```

Only allow updates to fields the user is authorized to change.

## 14.9 Submit an Accusation

`POST /api/v1/cases/:caseId/accusations`

Request:

```json
{
  "suspectId": "suspect_03"
}
```

Response for an incorrect accusation:

```json
{
  "result": "incorrect",
  "completed": true,
  "solution": {
    "culpritId": "suspect_01",
    "culpritName": "Alex Morgan",
    "motive": "A fictional explanation",
    "reasoning": [],
    "decisiveEvidenceIds": []
  }
}
```

The returned solution is an illustrative example. Actual solution content must come from the validated canonical solution.

For a correct accusation, return the same response structure with `result: "correct"`.

The API must reject invalid suspects, incomplete cases, unauthorized requests, and duplicate final submissions.

## 14.10 Get a Completed Result

`GET /api/v1/cases/:caseId/result`

Allow access only when the owner has completed the investigation, or when another explicitly authorized access policy applies.

## 14.11 API Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please enter a valid scenario.",
    "requestId": "req_123"
  }
}
```

Do not return internal stack traces, provider errors, prompts, or private solution details in errors.

---

# 15. Session and Authorization Strategy

For the MVP, use anonymous sessions instead of requiring account registration.

- Generate a cryptographically random opaque session token.
- Store it in a secure, HTTP-only cookie.
- Use `Secure` in production and an appropriate `SameSite` policy.
- Do not expose the session token to browser JavaScript.
- Validate ownership on every case, evidence, progress, and result request.
- Protect state-changing requests against CSRF where applicable.
- Never trust a client-supplied owner ID.
- Use a signed or server-backed session strategy.
- Set expiration and cleanup policies.

A case ID is not proof of authorization.

Future authentication can add registered users without changing the core case-generation domain model.

---

# 16. Security and Privacy

## Required controls

1. Store the Gemini API key in backend environment configuration.
2. Exclude secrets from source control.
3. Use request validation on every endpoint.
4. Apply rate limits per session and IP where appropriate.
5. Configure strict CORS for production.
6. Restrict payload sizes.
7. Prevent access to other users' cases.
8. Validate media URLs and asset references.
9. Avoid executing generated code or model-produced HTML.
10. Render generated text as escaped text, not trusted HTML.
11. Protect against prompt injection in user scenarios.
12. Limit sensitive information retained in logs.
13. Avoid logging the canonical solution in ordinary request logs.
14. Use safe error messages.
15. Document data deletion and retention behavior.

## Fictional Evidence Safety

All generated conversations, images, and recordings must be clearly presented as fictional. Do not imitate real people's identities or fabricate purported real-world criminal allegations.

For external image or video providers, review their privacy, retention, and content policies before integration.

---

# 17. Environment Variables

Example `.env.example`:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai-mystery-room

GEMINI_API_KEY=
GEMINI_MODEL=

SESSION_SECRET=
SESSION_TTL_HOURS=72

MAX_SCENARIO_LENGTH=1000
MAX_GENERATION_ATTEMPTS=3
MAX_CASES_PER_HOUR=5

ASSET_PROVIDER=placeholder
ASSET_STORAGE_BUCKET=
ASSET_STORAGE_ENDPOINT=
ASSET_STORAGE_ACCESS_KEY=
ASSET_STORAGE_SECRET_KEY=
```

Only include provider-specific storage variables when the corresponding provider is enabled.

Requirements:

- `.env` must be excluded from Git.
- Validate required environment variables at server startup.
- Fail fast with a safe, actionable configuration message.
- Never expose server variables through the Vite client environment.
- Do not use a predictable default for `SESSION_SECRET` in production.
- Configure production rate limits based on real usage and provider quotas.

---

# 18. AI Asset Management

The application must separate content generation from media generation.

## MVP

- Use fictional textual evidence.
- Use locally available or generated placeholder illustrations.
- Display image descriptions when no real generated image exists.
- Use transcript-style camera evidence and timestamped scene observations.

## Future enhancement

Add a dedicated asset-generation adapter.

Each asset should contain:

- Asset ID.
- Provider.
- Asset type.
- Storage key or URL.
- MIME type.
- Creation timestamp.
- Generation status.
- Associated case ID.

Use object storage for actual images and videos. Do not store large media binaries in ordinary case documents.

Do not invent asset URLs. A media card must reflect the actual availability of the asset.

---

# 19. Error Handling and Observability

Define stable internal error codes, including:

- `VALIDATION_ERROR`
- `CASE_NOT_FOUND`
- `ACCESS_DENIED`
- `GENERATION_FAILED`
- `AI_PROVIDER_UNAVAILABLE`
- `AI_OUTPUT_INVALID`
- `CASE_NOT_READY`
- `INVALID_SUSPECT`
- `ALREADY_SUBMITTED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

Log:

- Request ID.
- Route and status.
- Generation stage.
- Duration.
- Retry count.
- Model usage metadata, when available.
- Sanitized failure information.

Do not log API credentials, session tokens, or full private solutions.

Provide health endpoints:

- `GET /health/live`
- `GET /health/ready`

Readiness checks may verify database connectivity and application configuration without exposing secrets.

---

# 20. Testing Strategy

## 20.1 Unit Tests

Test:

- Scenario validation.
- Suspect schema validation.
- Evidence schema validation.
- Timeline consistency.
- Culprit evaluation.
- Progress updates.
- Authorization rules.
- Retry logic.
- Solution reveal policy.

## 20.2 Integration Tests

Test:

- MongoDB persistence.
- Case creation.
- Generation job status transitions.
- Gemini service mocked responses.
- Invalid AI output recovery.
- Evidence retrieval.
- Progress persistence.
- Accusation submission.
- Unauthorized solution access.

## 20.3 End-to-End Tests

Use Playwright or an equivalent browser testing tool.

Scenarios:

1. Create a mystery.
2. Wait for generation to complete.
3. Open the suspect list.
4. Inspect chat evidence.
5. Inspect camera evidence.
6. Bookmark evidence.
7. Add investigation notes.
8. Submit an accusation.
9. Verify the result and reasoning.
10. Reload the page and confirm completed progress persists.

## 20.4 AI Quality Evaluation

Maintain a test suite of representative scenarios and validate generated cases against:

- Structural completeness.
- Exactly one intended culprit.
- Timeline consistency.
- Evidence references.
- Multiple decisive clues.
- Logical explanation.
- Absence of premature answer leakage.
- Absence of unexplained contradictions.

AI output can vary between runs. Use deterministic fixtures for ordinary unit and integration tests, and a separate evaluation suite for live model quality.

---

# 21. Acceptance Criteria

The MVP is complete only when the following criteria pass.

### AC-01: Scenario Submission

Given valid scenario text, when the user submits it, the backend creates a case and generation job.

### AC-02: Input Validation

Given empty or oversized input, the server rejects the request with a stable validation error.

### AC-03: Case Generation

Given a valid scenario, the backend generates and validates a case before marking it playable.

### AC-04: Canonical Culprit

Every playable case contains exactly one intended culprit linked to a valid suspect.

### AC-05: Evidence Integrity

Every playable case has the configured minimum evidence count and passes structural and semantic validation.

### AC-06: Evidence Exploration

Users can view suspects, evidence, and the timeline without exposing private solution data.

### AC-07: Solution Protection

Before final submission, public API responses do not contain the culprit ID or private reasoning chain.

### AC-08: Correct Accusation

When the user selects the canonical culprit, the backend returns a correct result.

### AC-09: Incorrect Accusation

When the user selects a different valid suspect, the backend returns an incorrect result and the authorized solution reveal.

### AC-10: Submission Integrity

Duplicate submissions cannot change the recorded final result.

### AC-11: Authorization

A user cannot access or modify another user's case by changing a URL or ID.

### AC-12: Failure Recovery

If AI generation fails after the retry limit, the case is marked failed and the UI offers a recovery path.

### AC-13: Responsive UI

The core investigation workflow works on mobile, tablet, and desktop.

### AC-14: Fictional Content Labels

AI-generated evidence is clearly labeled as fictional or simulated.

### AC-15: Setup

A developer can install dependencies, configure environment variables, start the frontend and backend, and run the test suite using the repository documentation.

---

# 22. Development Milestones

## Milestone 1 — Foundation

- Initialize React/Vite client.
- Initialize Express/TypeScript server.
- Configure MongoDB.
- Add environment validation.
- Add shared API error handling.
- Establish project structure and formatting rules.

**Exit condition:** Both applications start successfully and basic health checks pass.

## Milestone 2 — Core UI

- Build the home page.
- Add scenario and configuration forms.
- Build the investigation shell.
- Implement responsive layout.
- Create suspect and evidence components.

**Exit condition:** The full workflow can be navigated using test fixtures.

## Milestone 3 — AI Integration

- Configure Gemini SDK.
- Implement structured blueprint generation.
- Implement evidence generation.
- Implement schema validation.
- Implement bounded retries and generation status.

**Exit condition:** A valid test scenario can produce a playable case.

## Milestone 4 — Investigation Engine

- Implement case and evidence APIs.
- Implement timeline rendering.
- Implement bookmarks and notes.
- Implement progress persistence.
- Implement ownership checks.

**Exit condition:** A user can explore and resume a case.

## Milestone 5 — Accusation and Reveal

- Implement culprit selection.
- Implement server-side evaluation.
- Implement duplicate-submission protection.
- Implement result and reasoning screens.
- Verify solution confidentiality.

**Exit condition:** Correct and incorrect accusations behave as specified.

## Milestone 6 — Quality and Security

- Add automated tests.
- Test failure and retry scenarios.
- Verify rate limiting.
- Verify authorization.
- Test responsive layouts.
- Review generated content safety.

**Exit condition:** All mandatory acceptance criteria pass.

## Milestone 7 — Deployment

- Configure production environment variables.
- Deploy client and server.
- Configure managed MongoDB.
- Configure logging and health checks.
- Add production CORS and security settings.
- Verify the production generation workflow.

**Exit condition:** The deployed application can generate, investigate, and close a mystery.

---

# 23. Deployment Requirements

Recommended deployment topology:

- Frontend: static hosting platform.
- Backend: Node.js-compatible application host.
- Database: managed MongoDB.
- Media: optional object storage.
- Secrets: deployment platform's secret manager.

Requirements:

- Use HTTPS.
- Configure production CORS.
- Configure database network access.
- Set production session cookies correctly.
- Keep Gemini credentials server-side.
- Set request and generation timeouts.
- Configure health checks.
- Configure logging and error monitoring.
- Document database backups and retention.
- Test migrations and schema compatibility before deployment.

Long-running AI generation should use a background job pattern or equivalent asynchronous workflow. A simple database-backed job runner is acceptable for an MVP; a dedicated queue may be added when scale requires it.

---

# 24. Implementation Rules for Codex

This section governs how Codex must implement the project.

1. Treat `SPEC.md` as the authoritative product and technical specification.
2. Read this document before modifying code.
3. Use TypeScript for all application code unless a dependency requires otherwise.
4. Do not invent undocumented product behavior when a decision can be resolved from this specification.
5. Keep public case data separate from private canonical solution data.
6. Never expose the Gemini API key to the browser.
7. Never reveal the culprit before an authorized final submission.
8. Never publish a case that has failed validation.
9. Validate all model output with runtime schemas.
10. Use shared TypeScript types or a shared contract package for API models.
11. Implement actual API calls rather than leaving production UI backed by hardcoded mock data.
12. Mock external AI services only in tests and development fixtures.
13. Keep all secret configuration in environment variables.
14. Add tests alongside each major feature.
15. Avoid unnecessary abstractions and dependencies.
16. Do not silently remove a requirement.
17. If a requirement cannot be implemented as written, document the limitation and the proposed resolution.
18. Keep `README.md` synchronized with installation, configuration, development, testing, and deployment instructions.
19. Update this specification through an explicit change rather than allowing undocumented behavior to drift.
20. Complete milestones in order unless dependencies justify a documented change.

## Definition of Done

A feature is complete only when:

- Its requirements are implemented.
- Its API contracts are validated.
- Loading, error, and empty states are handled.
- Authorization and confidentiality requirements are satisfied.
- Automated tests cover its important behavior.
- Documentation is updated where necessary.

---

# 25. Final Product Definition

AI Mystery Room is a MERN-based, AI-powered detective investigation website in which users submit a fictional scenario, receive a coherent mystery with suspects and evidence, investigate the case, and select the culprit.

Google Gemini generates the mystery content through a controlled backend pipeline. The server validates the evidence against one canonical solution, preserves investigation progress, evaluates the final accusation, and reveals the explanation only when authorized.

The initial release prioritizes logical consistency, secure solution handling, usable evidence exploration, responsive design, and maintainable code.

**This specification is the Single Source of Truth for the MVP.** All frontend, backend, AI integration, database, testing, and deployment work must comply with the requirements defined here.