# AI Mystery Room

AI Mystery Room is a fictional detective investigation game. Players submit a short premise, inspect AI-generated suspects and evidence, then make one final accusation to reveal the validated solution.

## Stack

- React, Vite, TypeScript, React Router, TanStack Query, Tailwind CSS
- Express, TypeScript, Zod, Mongoose, Pino, Helmet
- MongoDB and the Google GenAI SDK (Gemini)

The backend establishes a canonical solution before producing public evidence. Solutions are stored separately from public case data and are only returned after an owner submits a final accusation.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer, local or managed
- A Google Gemini API key

## Setup

1. Install dependencies from the repository root:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and a random `SESSION_SECRET` of at least 32 characters.

3. Start the API and client:

   ```sh
   npm run dev
   ```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:5000`. The API sets an HTTP-only signed anonymous session cookie. For another client origin, set `CLIENT_URL` and, if needed, `VITE_API_URL` in the client environment. Server-only credentials must never be added to a `VITE_` variable.

## Configuration

See `.env.example` for supported variables. The server validates configuration on startup and exits with an actionable error if required values are missing. The default asset mode is `placeholder`: image and camera evidence is labeled as a fictional description or simulation, not represented as real media.

## API

Base path: `/api/v1`

- `POST /cases` creates a generation job.
- `GET /cases/:caseId/status` polls generation.
- `GET /cases/:caseId`, `/suspects`, `/evidence`, `/timeline`, and `/progress` return owner-scoped public data.
- `GET /cases/:caseId/evidence/:evidenceId` returns one evidence item.
- `PATCH /cases/:caseId/progress` stores viewed evidence, bookmarks, and notes.
- `POST /cases/:caseId/accusations` records the one final accusation and reveals the solution.
- `GET /cases/:caseId/result` returns a solution only after that owner has completed the case.
- `GET /health/live` and `/health/ready` expose liveness and readiness.

Errors use `{ "error": { "code", "message", "requestId" } }`. Generation is asynchronous and bounded by `MAX_GENERATION_ATTEMPTS`. A case remains unavailable unless its structured output passes schema, reference, timeline, and clue-count validation.

## Build and production

```sh
npm run build
npm run start
```

Deploy the static Vite output and Node server separately or behind a reverse proxy. Use HTTPS, set production CORS to the exact client origin, configure MongoDB network rules and backups, and store secrets in the host's secret manager. Set `NODE_ENV=production` and a strong `SESSION_SECRET`. Configure request timeouts, monitoring, and rate limits against the Gemini quota before public launch.

## Current scope and limitations

This project implements the MVP web flow and server generation pipeline. The application uses textual image descriptions and camera reconstructions; actual media generation and object storage are intentionally not configured. Semantic checks such as fairness and uniqueness are conservative structural checks with Gemini retries, and still need a separate human-reviewed AI quality evaluation suite before production deployment.
