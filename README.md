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

## Deploy on Render

This setup deploys the React client and Express API together as one Render web service, with MongoDB Atlas for data. The client uses the same-origin `/api/v1` path in production, so browser session cookies remain first-party.

1. **Create the MongoDB database.** Create an Atlas project and cluster, add a database user, and copy the Node.js connection string. Add a strong database password and select the intended database name. Atlas blocks connections until the app's network is allowed; after Render creates the service, add the service's outbound IP ranges from its **Connect → Outbound** panel to Atlas **Network Access**. Avoid `0.0.0.0/0` for production because it permits connections from any IP.

2. **Create a Gemini API key.** Generate a key in Google AI Studio. Keep it private; it belongs only in Render's server environment.

3. **Push the project to a Git provider.** Commit the source and `render.yaml`. Confirm `.env` is not tracked (`.gitignore` excludes it). Do not commit your API key, database URI, or session secret.

4. **Create the Render service from the Blueprint.** In Render, choose **New → Blueprint**, connect the repository, and let Render read `render.yaml`. Enter `MONGODB_URI` and `GEMINI_API_KEY` when prompted. Render generates `SESSION_SECRET`. The Blueprint builds the client and server, starts the web service, and checks `/health/ready`.

5. **Wait for the first deploy.** The first build can start before Atlas allows Render's network ranges. If readiness fails, add the Render outbound ranges to Atlas Network Access, then use **Manual Deploy → Deploy latest commit** in Render.

6. **Open the deployed service URL.** Render provides an HTTPS URL such as `https://your-service.onrender.com`. The home page and API are served from that same origin. `CLIENT_URL` does not need a production override for this single-origin setup.

7. **Confirm the deployment.** Open `https://your-service.onrender.com/health/ready`; it should return `{"status":"ready","database":"connected"}`. Then load the home page, create a short fictional mystery, wait for generation, inspect evidence, and submit an accusation.

### Render configuration

The root [render.yaml](render.yaml) contains the service build/start commands, health check, safe non-secret defaults, and secret prompts. You can also create a Node web service manually with:

- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/health/ready`

Set `NODE_ENV=production`, `MONGODB_URI`, and `GEMINI_API_KEY`. Render supplies `PORT`; the server binds to `0.0.0.0`. Keep secrets in Render's environment settings. For production, review Atlas backups/retention and Gemini quota limits, and choose a Render plan that fits your traffic and availability needs.

## Local build

```sh
npm run build
npm start
```

For local development, copy `.env.example` to `.env`, configure MongoDB and Gemini, then run `npm run dev` from the repository root. The Vite development client calls the API at `http://localhost:5000/api/v1`; production uses same-origin `/api/v1`.

## Current scope and limitations

This project implements the MVP web flow and server generation pipeline. The application uses textual image descriptions and camera reconstructions; actual media generation and object storage are intentionally not configured. Semantic checks such as fairness and uniqueness are conservative structural checks with Gemini retries, and still need a separate human-reviewed AI quality evaluation suite before production deployment.
