# Kenmark Chatbot

A local demo chatbot and admin tools with knowledge-grounded responses.

## Overview

- Frontend: Next.js (Client Components). The chat widget is implemented as a client component in `next-app/components/ChatWidget.client.jsx`.
- Backend: Node (Next.js route handlers for chat + admin) and/or Python FastAPI (legacy `backend/` folder). The app includes an admin upload and analytics endpoints.
- Knowledge: Excel `.xlsx` files (ingested by the server) and a conservative retrieval that avoids hallucinations; when no knowledge matches, the bot returns: `I don't have that information yet.`
- Persistence: Chats are stored in a file-backed JSON DB by default at `next-app/data/chats.db.json`. If `better-sqlite3` is available on the system, it will be used automatically instead.

## Quickstart (development)

### Next.js app (recommended)

```bash
cd next-app
npm install
npm run dev
# open http://localhost:3000 (or the port the dev server reports)
```

### Python backend (legacy FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment variables

- `ADMIN_KEY` — optional shared secret to protect admin endpoints
- `NEXT_PUBLIC_ADMIN_KEY` — optional convenience mirror for development only
- `GROQ_API_KEY` — if set, Groq is used as the primary LLM
- `OLLAMA_URL` — URL for a local Ollama instance (fallback LLM)

## Data & files

- Chat DB (persistent by default): `next-app/data/chats.db.json` (file-backed JSON). The app will import legacy `data/chats.jsonl` if present.
- Knowledge files: store uploaded `.xlsx` files in `next-app/data/` via the Admin upload endpoint.

## Admin endpoints (server)

- `POST /api/admin/upload` — multipart file upload for Excel `.xlsx` knowledge files (header `x-admin-key` or `Authorization: Bearer <key>`)
- `GET /api/admin/sessions` — lists recent sessions (`?page=1&per_page=20`)
- `POST /api/admin/session` — body `{ session_id, page, per_page }` to fetch paginated messages
- `GET /api/admin/session/export?session_id=<id>` — export a full session JSON
- `GET /api/analytics/top-questions` — top user questions by frequency

## Notes & troubleshooting

- The app no longer requires native build tools for a working dev experience — it uses a file-backed JSON DB if native SQLite is not available. For persistence across restarts, ensure `next-app/data/chats.db.json` exists and is writable.
- If you see errors about native modules (e.g., `better-sqlite3`), either install the Visual Studio C++ build tools on Windows or rely on the JSON DB fallback.
- To reduce repo size, some large directories (e.g., `node_modules`) and build artifacts have been removed; run `npm install` where needed after cloning.

