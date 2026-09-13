# mimir — Google & GitHub OAuth Sign-In

## Roadmap context

mimir's JWT-based email/password auth (`docs/superpowers/specs/2026-08-02-auth-design.md`) is implemented and live: self-registration, per-user conversations, shared documents/memories, `Authorization: Bearer <token>` on every request. This spec adds Google and GitHub as additional sign-in methods on top of that system — not a replacement for it.

## Purpose

- Let users sign in with Google or GitHub instead of creating a mimir-specific password.
- Email/password registration and login continue to work exactly as they do today; OAuth is purely additive.
- If someone signs in via Google/GitHub using an email that already has a mimir account (password-based or the other OAuth provider), it's treated as the same account — auto-linked by email, no separate confirmation step. Google and GitHub both verify the emails they report, so this is a reasonable trust boundary for a small local/team tool.
- On top of email, mimir also captures the display name and avatar URL the provider reports, and shows them in the sidebar (replacing the current email-only, initial-circle footer for users who have this data).

## OAuth flow

Backend-mediated redirect flow, chosen over a frontend-driven or popup-based flow specifically because: the client secret never has to leave the backend, and the codebase already hit real popup-blocker friction earlier in the `open_url` tool work, which a popup-based OAuth flow would risk repeating.

1. The user clicks "Continue with Google" (or GitHub) — a plain link to `GET /api/auth/{provider}/login`, no JavaScript needed to start the flow.
2. That backend route builds the provider's authorize URL (client ID, redirect URI, scopes, a random `state` value), sets `state` in a short-lived httponly cookie for CSRF protection, and 302-redirects the browser to the provider's consent screen.
3. The user approves. The provider redirects the browser to `GET /api/auth/{provider}/callback?code=...&state=...`.
4. The callback route verifies `state` matches the cookie (rejecting on mismatch), exchanges `code` for an access token via a server-to-server POST (using the client secret), and fetches the profile (email, name, avatar) from the provider's userinfo endpoint.
5. It looks up `users` by email:
   - No match: creates a new user (no `password_hash`, `oauth_provider`/`oauth_id` set to this provider/ID). If this is the very first user ever created, it runs the same legacy-conversation-backfill that email registration already triggers.
   - Match (however that account was originally created): updates `oauth_provider`/`oauth_id`/`name`/`avatar_url` on the existing row and logs in as that account.
6. Issues a normal mimir JWT via the existing `create_access_token` (identical shape/expiry to email/password tokens — nothing about `get_current_user` or route protection changes).
7. 302-redirects to `http://localhost:4028/auth/callback#token=<jwt>` — the token rides in the URL *fragment*, not a query param, so it's never sent to a server or written to access logs.
8. The frontend's `/auth/callback` page reads the token from `location.hash`, calls the existing `setAuthToken()`, then does a full `window.location.href = '/'` (not a client-side route change) so `AuthProvider` remounts and re-validates the token via its existing on-mount `/api/auth/me` check — no new state-sync code needed.

On failure (consent denied, state mismatch, code exchange error), the callback route redirects to `http://localhost:4028/auth/callback#error=<message>` instead of a token; the callback page detects `error` in the hash, surfaces it via the existing toast system, and sends the user back to `/` (still logged out, so the login screen shows again).

## Data model

`users` gains four nullable columns:

```sql
ALTER TABLE users ADD COLUMN oauth_provider TEXT;  -- 'google' | 'github' | NULL
ALTER TABLE users ADD COLUMN oauth_id TEXT;         -- provider's stable user ID
ALTER TABLE users ADD COLUMN name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
```

`password_hash` becomes nullable, since an OAuth-only account never sets one. SQLite's `ALTER TABLE` can't drop a `NOT NULL` constraint, so this migration rebuilds the table rather than altering it in place: `CREATE TABLE users_new (...)` with the new schema (four new nullable columns, `password_hash` now nullable) → `INSERT INTO users_new SELECT ... FROM users` → `DROP TABLE users` → `ALTER TABLE users_new RENAME TO users`. This runs once, guarded the same way the existing `_migrate_conversations_user_id` is (check `PRAGMA table_info(users)` for the new columns first, skip if already present), so it's safe to run against the already-migrated local `mimir.db`.

`oauth_provider`/`oauth_id` track the most recent OAuth provider linked to an account — not a full multi-provider identity table. A user who links both Google and GitHub to the same email ends up with whichever provider they used most recently recorded there; both logins still resolve to the same account either way, since matching is by email, not by these columns. This is a deliberate simplification: nothing in the product requires distinguishing "linked both" from "linked one," so a richer `user_oauth_identities` table isn't justified here.

## Backend

Two new route pairs (`app/routes/oauth.py`, new file):

- `GET /api/auth/google/login`, `GET /api/auth/google/callback`
- `GET /api/auth/github/login`, `GET /api/auth/github/callback`

Provider-specific bits (authorize URL, token URL, userinfo URL, scopes) live in small per-provider config dicts/functions in that same file — no new HTTP library needed, since `httpx` (already a dependency, already used by `services`/`ollama_client.py`-equivalent code) covers the server-to-server token exchange and userinfo fetch.

`repository.py` gains `get_or_create_oauth_user(conn, email, oauth_provider, oauth_id, name, avatar_url) -> tuple[int, bool]` (returns the user's id and whether this is a brand-new account, so the route knows whether to run the legacy backfill) and `link_oauth_to_user(conn, user_id, oauth_provider, oauth_id, name, avatar_url)`.

New config (`app/config.py` / `.env.example`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — all optional at the `Settings` level (unlike `jwt_secret`, the app should still start and email/password auth should still work if these are unset; the `/login` routes for an unconfigured provider return a clear error instead of crashing the app). Redirect URIs and the frontend origin stay hardcoded to `http://localhost:8000` / `http://localhost:4028`, matching the existing CORS configuration's own hardcoded-localhost convention.

**Existing `/api/auth/login` needs one guard added:** an OAuth-only account has `password_hash = None`, and passing `None` into `verify_password` would error rather than cleanly reject. The check becomes `if not user or not user["password_hash"] or not verify_password(body.password, user["password_hash"])`, so someone who only ever signed in via Google/GitHub gets the same generic "Invalid email or password" on a password-login attempt as any other wrong-credentials case — it doesn't leak whether the account exists or how it was created.

**Not in scope:** letting an OAuth-only account set a password afterward (an account-settings "add a password" flow). Attempting `/api/auth/register` with an email that already has an OAuth-linked account still correctly 409s ("Email already registered") — same as any other duplicate-email registration attempt — so that path isn't silently broken, it's just not the smoothest experience if someone specifically wants password login later. Not needed for this feature; can be a follow-up if it ever comes up.

## Frontend

- `AuthScreen.tsx`: two new buttons above the email/password form, each a plain `<a href="{API_BASE}/api/auth/{provider}/login">` — full navigation, no click handler needed.
- New page `src/app/auth/callback/page.tsx`: reads the token (or error) from `location.hash` and either logs in (`setAuthToken` + full reload to `/`) or shows an error toast and redirects to `/`.
- `AuthUser` (`api.ts`) gains `name: string | null` and `avatar_url: string | null`; `fetchMe()`'s response already carries these once the backend returns them, no separate call needed.
- `Sidebar.tsx` footer: shows the avatar image when `avatar_url` is present (falling back to today's "N" initial-circle), and the display name when `name` is present (falling back to email, as today).

## Testing

- New `backend/tests/test_oauth.py`: mocks the provider's token-exchange and userinfo HTTP calls (same mocking pattern the existing LLM-streaming tests already use) to cover: new-user creation via OAuth, auto-linking an OAuth login to an existing email/password account by matching email, the first-user legacy-backfill triggering on an OAuth-created first account, and state-mismatch rejection on the callback route.
- Manual, in-browser verification of the actual end-to-end handshake (real "Continue with Google" click through to a real consent screen and back) is only possible once real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` values are in `backend/.env` — that live check happens at the end of implementation, after the OAuth apps are registered.
