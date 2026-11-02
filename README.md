# Collaborative AI Workspace

Generate a document with AI, then highlight any sentence or paragraph and tell the AI how to rewrite it. The rewrite is swapped in place, without a page reload.

- **Backend:** FastAPI, SQLite (stdlib `sqlite3`), Anthropic Python SDK (`claude-opus-5-5`)
- **Frontend:** React 19 + Vite, Tailwind CSS v4, Framer Motion

## Run it

```bash
# 1. Backend  (http://127.0.0.1:8000, interactive docs at /api/docs)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add your ANTHROPIC_API_KEY
uvicorn main:app --reload

# 2. Frontend (http://localhost:5173), in a second terminal
cd frontend
cp .env.example .env
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to the backend (all backend routes live under `/api`, matching the Vercel deployment), so you don't need CORS during local development.

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/generate` | `{ prompt }` | `{ id, content }` |
| POST | `/refine` | `{ document, selected_text, instruction, start?, end?, document_id? }` | `{ replacement, start, end, document }` |
| GET | `/documents` | | recent documents |
| GET | `/documents/{id}` | | document plus its edit history |

`/refine` sends Claude the full document with the selection marked inline, so the rewrite fits the surrounding context. If `start`/`end` are given, they must still match `selected_text` (the endpoint returns 409 when they don't), which prevents edits from landing on stale offsets. When `document_id` is set, the stored document is updated and the edit is logged to the `edits` table.

## How highlight-to-edit works

1. `DocumentView` splits the text into blocks on blank lines. Each block is rendered with `data-start` set to its character offset in the source string.
2. `useTextSelection` reads `window.getSelection()` on pointer/key up and converts the DOM range into `{ start, end }` source offsets. It also records an anchor point at the cursor, above the selection. This snapshot is kept after the native selection is cleared, which happens as soon as you click into the toolbar input.
3. `FloatingToolbar` is a Framer Motion popover rendered through a portal at that anchor. It flips below the selection when there isn't room above it.
4. On submit, the range shows a shimmer and `/refine` is called. When it returns, the new text is spliced into the document and fades in with a highlight.
