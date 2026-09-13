# mimir — Authentication

## Roadmap context

Auth was explicitly deferred during the Phase 2 discussion ("no auth for now") in favor of pulling Phase 3 items (branching, model switcher) forward. mimir has been a fully anonymous, single-shared-state local app since — no user table, no `user_id` anywhere, every conversation/document/memory globally visible to whoever opens the app (the sidebar's "Public Session / No account needed" label is literal). This spec adds real multi-user accounts.

## Purpose

- mimir is now meant for multiple people, each with their own private conversation history.
- Uploaded documents (RAG) and learned memories stay shared across all users — "shared team assistant" knowledge, not private files. Only conversations are per-user.
- Self-registration (email + password), no invite/admin step.
- Session strategy: JWT in a `Authorization: Bearer` header, matching the pattern already used in this environment's other project (Argus) — a signed token returned on login/register, sent by the frontend on every request. Chosen over server-side session cookies specifically to avoid reworking CORS for credentialed requests and updating every fetch call (including the two SSE streaming ones) to send cookies.
- Existing local test data: `documents` and `memories` are unaffected (they were never going to become per-user). The ~35 existing conversations (no owner, since conversations never had one) get assigned to whichever account registers first — automatic, one-time, no manual migration step.

## Data model

One new table:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

`conversations` gains one column:

```sql
ALTER TABLE conversations ADD COLUMN user_id INTEGER REFERENCES users(id);
```

This is a real migration, not a fresh `CREATE TABLE IF NOT EXISTS` (that only applies to brand-new databases) — `init_db` needs to check whether `conversations` already has a `user_id` column (via `PRAGMA table_info(conversations)`) and run the `ALTER TABLE` once if not, so it's safe to run against the existing local `mimir.db`. SQLite can't add a `NOT NULL` column with no default to a table that already has rows, so the column is nullable at the schema level; every code path that creates a conversation going forward is required to pass a `user_id` (enforced in `repository.create_conversation`, which changes from an optional to a required parameter).

`documents`, `memories`, `artifacts`, `tool_calls` — **no schema changes.** `artifacts` and `tool_calls` inherit ownership transitively through the `messages` → `conversations` chain (a route checks the conversation's owner, not the artifact/tool_call directly).

**Legacy conversation backfill:** in the register endpoint, before inserting the new user row, check `SELECT COUNT(*) FROM users`. If it's `0` (this is the very first account ever created), then after the insert, run `UPDATE conversations SET user_id = ? WHERE user_id IS NULL` with the new user's id. This makes "first person to sign up inherits all the pre-auth test conversations" automatic and one-time — the second and subsequent registrations never see this branch since `users` is no longer empty.

## Backend

### `backend/app/auth.py` (new)

- `hash_password(password: str) -> str` / `verify_password(password: str, password_hash: str) -> bool` — via `passlib[bcrypt]` (new dependency).
- `create_access_token(user_id: int, email: str) -> str` — a JWT via `PyJWT` (new dependency), signed with `JWT_SECRET`, containing `{sub: user_id, email, exp}`. Expiry: 30 days (this is a small local/team tool, not a high-security public service — long-lived tokens favor not re-logging-in constantly over defending against token theft scenarios that don't really apply here).
- `decode_access_token(token: str) -> dict | None` — returns the payload or `None` on invalid/expired.
- `get_current_user(authorization: str = Header(None)) -> dict` — a FastAPI dependency. Parses `Bearer <token>`, decodes it, loads the user from `repository.get_user(conn, user_id)` to confirm the account still exists, returns `{id, email}`. Raises `HTTPException(401)` if the header is missing, malformed, the token is invalid/expired, or the user no longer exists.

`JWT_SECRET` is added to `Settings` (config.py) and documented in `.env.example`, no default — if unset, `create_app` raises at startup rather than silently signing tokens with a predictable value.

### `backend/app/routes/auth.py` (new)

- `POST /api/auth/register` — body `{email, password}`, validated with pydantic (`email: EmailStr` catches obviously-malformed addresses; no confirmation/verification email is sent — this app has no email-sending capability and none is being added). `password` must be at least 8 characters, no other complexity requirement (a local/team tool, not a public service — length alone is a reasonable bar here). 422 on either validation failure, 409 if the email is already registered. On success: hashes the password, does the legacy-backfill check described above, returns `{access_token, user: {id, email}}`.
- `POST /api/auth/login` — body `{email, password}`. 401 on wrong email or password (same error either way — don't reveal which one was wrong). Returns the same shape as register.
- `GET /api/auth/me` — requires auth, returns `{id, email}` for the current token. Used by the frontend on app load to validate a stored token before trusting it.

### Protecting existing routes

Every route except `/api/health` gets `current_user: dict = Depends(get_current_user)`.

- **Conversations, chat, messages, artifacts, tools (resume-tool)**: additionally verify the resource is owned by `current_user["id"]`. A conversation lookup that doesn't belong to the caller returns `404` (not `403`) — a 403 would confirm the conversation ID exists but belongs to someone else, a minor enumeration leak worth just not having.
  - `repository.create_conversation` requires `user_id` now.
  - `repository.get_conversation` / `list_conversations` / the conversation-detail route / the chat SSE route / the active-leaf route / the resume-tool route all filter or check against `user_id`.
  - `generate_reply` and `resume_tool_reply` (`chat_service.py`) take a `user_id` param: passed to `create_conversation` for new conversations, and checked against the loaded conversation's owner before generating anything for an existing one.
- **Documents, memories**: require `current_user` (must be logged in) but apply **no ownership filter** — any authenticated user sees and can modify the full shared set, per the "shared team assistant" decision above.

## Frontend (chatbot-ui)

- **New `AuthContext`** (`src/context/AuthContext.tsx`): holds `{ user, token }`, exposes `login`, `register`, `logout`. Token persisted to `localStorage`; on mount, if a token exists, calls `GET /api/auth/me` to validate it before trusting it (an expired/tampered token falls back to logged-out rather than a broken authenticated-looking state).
- **`AuthProvider` wraps `ChatProvider`** (not merged into it) — a deliberate separation from the already-large `ChatContext`, which stays focused on conversation/chat state. `AuthProvider` renders a Login/Register screen when there's no valid user, and `ChatProvider` + the rest of the app otherwise. `ChatProvider` and everything under it can assume a valid authenticated user exists.
- **`src/lib/api.ts`**: every request gets `Authorization: Bearer <token>` via a shared helper, reading the token from a small module-level holder that `AuthContext` updates on login/logout (mirroring the existing `_authHeaders()`-per-call pattern already established in this codebase's sibling project, but centralized here into one helper all `api.ts` functions route through, rather than duplicated per call). Covers the two `fetch`-based SSE streams (`streamChat`, `resumeToolCall`) the same as every other call — no `EventSource` limitation, since neither ever used `EventSource`.
- **Login/Register UI**: a single new component with a toggle between the two modes (email + password fields, inline validation error display). Not gated behind any existing page — it's what renders in place of the entire app when logged out.
- **Sidebar footer**: "Public Session / No account needed" is replaced with the logged-in user's email and a logout button. Logging out aborts any in-flight generation (reuses the existing `stopGeneration`/`AbortController` path) before clearing the token and resetting `ChatProvider`'s state, so a streaming response in progress doesn't keep writing to a conversation the now-logged-out session can no longer see.

## Error handling

- Wrong password / unknown email at login: one generic "Invalid email or password" message, no distinction (prevents email enumeration via error text).
- Expired or tampered token on any protected route: `401`, frontend's shared fetch helper catches this globally and forces a logout (clears local state, shows the login screen) rather than surfacing a raw error per-call.
- Registering an already-used email: `409` with a clear "Email already registered" message.
- Accessing another user's conversation (by guessing/reusing an old ID): `404`, same as a genuinely nonexistent conversation.

## Testing

- New `backend/tests/test_auth.py`: register success, duplicate email (409), login success, wrong password (401), unknown email (401), `/me` with valid/missing/invalid/expired token, and the legacy-backfill behavior specifically (register the first-ever user against a DB pre-seeded with ownerless conversations, assert they're now all owned by that user; register a *second* user, assert the backfill does not run again).
- Every existing backend test file that exercises a now-protected route needs an authenticated request. This is mechanical but touches most of the suite (`test_conversations.py`, `test_chat_route.py`, `test_chat_service.py`, `test_tools.py`, `test_documents.py`, `test_memories.py`, `test_artifacts.py`) — a shared pytest fixture (e.g. `auth_headers`) that registers a test user against the test DB and returns the `Authorization` header value, used everywhere a request needs to be authenticated. This fixture work is the single largest chunk of mechanical effort in the whole feature.
- Frontend: manual verification (no test runner configured in this repo, consistent with how every other feature this session was verified) — register, log out, log back in, confirm conversations from before logout are still there and messages sent while logged out (there shouldn't be any, since the whole app is gated) don't leak between two different test accounts, confirm documents/memories are visible to both accounts.
