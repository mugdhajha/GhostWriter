# GhostWriter++

GhostWriter++ is a full-stack writing assistant that generates text in *your* writing style (based on your saved writing samples), keeps drafts organized as **threads**, and lets you **evaluate** and **improve** any generation while staying in the same thread.

## Key features

- **Style-mimic generation**: Generates replies based on your saved writing samples.
- **Threaded history**: Continuing a draft keeps new generations in the same thread.
- **Per-generation evaluation**: Each generation can be evaluated (scores + suggestions) and the evaluation shows directly beneath that generation.
- **Improve in place**: You can add improvement instructions anytime; improvements append as new entries in the same thread.

## Tech stack

- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: React + Vite + Tailwind
- **AI provider**: Google Gemini via `@google/generative-ai`

## Project structure

- `backend/` — Express API + MongoDB models
- `frontend/` — React UI

## Prerequisites

- Node.js 18+ recommended
- MongoDB running locally (default: `mongodb://localhost:27017/ghostwriter`)
- A Gemini API key

## Environment variables

Create `backend/.env` (already present in this repo) with at least:

- `PORT=5001`
- `MONGO_URI=mongodb://localhost:27017/ghostwriter`
- `JWT_SECRET=...`
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=...` (example: `models/gemini-2.5-flash`)

Security note: do not commit real secrets to a public repository.

## Install

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Run (dev)

### 1) Start MongoDB

Make sure MongoDB is running locally.

### 2) Start the backend

```bash
cd backend
npm run dev
```

The backend listens on `http://localhost:5001` (from `backend/.env`).

### 3) Start the frontend

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5173`.

The frontend API base URL is configured in `frontend/src/services/api.js` as:

- `http://localhost:5001/api`

## How the threading workflow works

- **New generation** creates a new thread automatically.
- **Continue** from the History page opens the Dashboard on that thread.
- Any new **Generate** (and any **Improve**) appends a new entry to the same thread.
- **Evaluate** runs analysis for a specific generation and is shown right under that generation.

## Useful API routes (high-level)

All routes are under `/api`.

- `POST /auth/login`, `POST /auth/register`
- `POST /samples` (save writing samples)
- `POST /ai/generate` (creates a new thread entry or appends to a thread)
- `POST /analyze` (evaluate text; can optionally persist to a history entry)
- `POST /improve` (improve a specific generation; appends a new history entry in same thread)
- `GET /history` (flat list of all history entries)
- `GET /history/thread/:threadId` (all entries in a thread)
- `DELETE /history/:id`

## Troubleshooting

### `Route /api/history/thread/:threadId not found`

This typically means the backend process wasn’t restarted after pulling changes.

- Stop the backend and restart it (`npm run dev`) in `backend/`.
- Confirm you’re calling the correct base URL (`http://localhost:5001/api`).

### Gemini model errors

If you see errors about a model being unavailable, try setting:

- `GEMINI_MODEL=gemini-pro`

then restart the backend.
