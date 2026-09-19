# Test Case Generator

A full-stack application that ingests software requirements (pasted text or an uploaded document) and uses Google Gemini to generate a structured, reviewable set of test cases — covering positive, negative, edge-case, and validation scenarios. Built for the Esperia Studio Full-Stack AI Developer assessment.

**Stack:** React + TypeScript (Vite) · NestJS + TypeScript · PostgreSQL · Google Gemini

---

## 1. Quick start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) — or a local Postgres instance
- A free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 1. Start the database

```bash
docker compose up -d
```

This starts Postgres 16 on `localhost:5432` with a database `test_case_generator`, user `tcg`, password `tcg_password` (matches the `.env.example` files below — change it if you like, just update both `.env` files to match).

If you'd rather use a Postgres install you already have, just create a database and user matching those values (or your own, updated in `backend/.env`).

### 2. Backend

```bash
cd backend
cp .env.example .env
# open .env and paste your Gemini key into GEMINI_API_KEY
npm install
npm run start:dev
```

Runs on `http://localhost:3001`. `GET /health` should return `{ "status": "ok" }`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # defaults already point at http://localhost:3001
npm install
npm run dev
```

Runs on `http://localhost:5173`. Open it in a browser.

### 4. Try it

1. Paste a requirement (or upload a `.txt`, `.md`, `.pdf`, or `.docx` file)
2. Click **Generate Test Cases**
3. Expand a test case to see its steps and expected result
4. Edit, delete, regenerate, or save — refresh the page and everything is still there

### Running backend tests

```bash
cd backend
npm test
```

13 unit tests cover the AI service (JSON parsing, schema validation, retry/backoff, rate-limit handling), file text extraction, and the test-case service.

---

## 2. Architecture

```
┌─────────────┐      HTTP/JSON       ┌──────────────────┐      ┌────────────┐
│   React     │  ───────────────►    │      NestJS       │      │  Google    │
│  (Vite/TS)  │  ◄───────────────    │  (layered: ctrl/  │─────►│  Gemini    │
└─────────────┘                      │  service/repo)    │◄─────└────────────┘
                                      └─────────┬─────────┘
                                                │ TypeORM
                                                ▼
                                          ┌───────────┐
                                          │ PostgreSQL │
                                          └───────────┘
```

**Backend** is a standard NestJS layered architecture, one module per concern:

- `requirements/` — intake (text or file), text extraction, orchestrates generation
- `test-cases/` — CRUD, batch save, batch persistence of AI output
- `ai/` — all Gemini interaction: prompt construction, schema-constrained output, validation, retries
- `common/filters/` — a global exception filter so every error (validation, not-found, AI failure, unexpected) comes back as a consistent JSON shape, never a raw stack trace

Each module has its own controller → service → (TypeORM repository) chain, so responsibilities stay separated and each layer is independently testable (see the `.spec.ts` files).

**Frontend** is a small React app with one page and a linear flow, structured for separation of concerns:

- `api/client.ts` — a typed fetch wrapper, the only place that knows the backend's HTTP shape
- `context/` — a `useReducer`-backed context (`RequirementFlowContext`) holding all flow state (current requirement, test cases, loading/error flags) and the async actions that mutate it via the API
- `components/` — presentational components that read from the context hook and render; each owns its own CSS file
- `utils/exportCsv.ts` — client-side CSV export, no backend round-trip needed

No extra state-management library — `useReducer` + Context was enough for this scope and keeps the dependency footprint small.

### Why this stack

- **NestJS over plain Express**: dependency injection and module boundaries made it straightforward to keep the AI provider, persistence, and HTTP layers decoupled — the `AiService` doesn't know about HTTP, `TestCasesService` doesn't know about Gemini.
- **PostgreSQL**: the data is naturally relational (one requirement → many test cases) and `jsonb` handles the `steps` array cleanly without a separate table.
- **Gemini over OpenAI/Anthropic**: has a generous free tier (no card required) and native structured-output support (`responseSchema`) that maps directly onto the validation schema below — convenient for an assessment a reviewer needs to run themselves.

---

## 3. Data model

**`requirements`**

| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| title | varchar | user-provided or derived from the first line of content |
| content | text | the extracted/pasted requirement text sent to the AI |
| sourceType | enum(`text`,`file`) | |
| originalFileName | varchar, nullable | set when uploaded |
| createdAt / updatedAt | timestamp | |

**`test_cases`**

| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| requirementId | uuid, FK → requirements, `ON DELETE CASCADE` | |
| title | varchar | |
| category | enum(`positive`,`negative`,`edge_case`,`validation`) | |
| priority | enum(`low`,`medium`,`high`) | |
| preconditions | text, nullable | |
| steps | jsonb (string array) | ordered list |
| expectedResult | text | |
| status | enum(`draft`,`saved`) | AI output starts as `draft`; explicit Save (or a manual add) marks it `saved` |
| isEdited | boolean | true once a human has touched it |
| generationRound | int | increments on regenerate, so history isn't ambiguous |
| createdAt / updatedAt | timestamp | |

A requirement has many test cases; deleting a requirement cascades. `synchronize: true` is used for schema management here (fine for an assessment/dev setup) — a production deployment would switch to migrations.

---

## 4. AI integration strategy

**Prompt engineering**: a fixed system instruction tells Gemini it's a senior QA engineer and explicitly requires a mix of all four categories (positive / negative / edge case / validation), 6–12 test cases, concrete executable steps, and a specific verifiable expected result. On **regenerate**, the previous batch's titles are included in the prompt with an instruction to cover different ground rather than repeat itself — so hitting Regenerate is useful, not just a re-roll of the same list.

**Structured output**: the request uses Gemini's `responseSchema` (JSON mode) to constrain the output shape at the API level. That output is then re-validated independently with a [Zod](https://zod.dev) schema (`ai/ai.schema.ts`) before anything touches the database — belt-and-suspenders, since a schema-constrained response can still occasionally be malformed or a model can drift.

**Failure handling**:
- Malformed JSON or output that fails Zod validation → fails fast (no point retrying with an identical prompt) and returns a clear `502` with an actionable message.
- Transient errors (429, 5xx, timeouts) → retried up to 3 times with exponential backoff (1s, 2s).
- Exhausted rate-limit retries → a distinct `429` response (`AiRateLimitException`) so the frontend can show a specific "try again shortly" message rather than a generic failure.
- No API key configured → fails immediately with a message telling you exactly which env var to set, instead of an opaque provider error.

All of this is unit-tested in `backend/src/ai/ai.service.spec.ts` with the Gemini SDK mocked, so the retry/validation logic is verified without needing network access or a real key.

---

## 5. API reference

| Method | Path | Description |
|---|---|---|
| POST | `/requirements` | Create a requirement (JSON `{title?, content}` or multipart with `file`) |
| GET | `/requirements/:id` | Fetch a requirement |
| DELETE | `/requirements/:id` | Delete a requirement (cascades its test cases) |
| POST | `/requirements/:id/generate` | Generate (or regenerate) test cases via Gemini |
| GET | `/requirements/:id/test-cases` | List test cases for a requirement |
| POST | `/requirements/:id/test-cases` | Manually add a test case |
| POST | `/requirements/:id/test-cases/save` | Mark all of a requirement's test cases as saved |
| GET | `/test-cases/:id` | Fetch a single test case |
| PATCH | `/test-cases/:id` | Edit a test case |
| DELETE | `/test-cases/:id` | Delete a test case |

---

## 6. Known limitations / next steps

- Auth is out of scope — anyone with API access can read/write any requirement (fine for a local assessment run).
- `synchronize: true` instead of migrations — would need to switch before any real deployment.
- Regeneration replaces the current *draft* batch; anything already explicitly saved is preserved rather than overwritten.
