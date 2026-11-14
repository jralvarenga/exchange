# Treid

A trading dashboard. People sign in with Better Auth. Each account stores its
own Alpaca paper and live keys, encrypted at rest, and those keys are used for
that account's Alpaca calls.

## Authentication

Google is offered first. Email and password require a verified address, and
password reset uses the same mail path. Google and password sign-ins for the
same verified email join one user. An unverified password account cannot be
joined to a later Google sign-in. Email sign-in is limited to five attempts
every 15 minutes, stored in Postgres so the limit holds across instances.

Sign-up policy, in order:

- A non-empty `AUTH_ALLOWED_EMAILS` list (comma-separated, case-insensitive)
  restricts new accounts to those addresses in every environment, including
  local development. `AUTH_DISABLE_SIGNUP` does not override the list.
- With no allowlist, `AUTH_DISABLE_SIGNUP=true` closes sign-up and
  `AUTH_DISABLE_SIGNUP=false` opens it.
- With neither set, Vercel production (`VERCEL_ENV=production`) stays
  closed. Previews (`VERCEL_ENV=preview`) stay open even though Next.js
  sets `NODE_ENV=production` there. Without `VERCEL_ENV`,
  `NODE_ENV=production` stays closed and other environments stay open.

Owner migration writes the user directly, so it still works when sign-up is
closed. Google sign-in for an existing allowed or migrated user still
works; a new Google user must be on the allowlist when one is set.

Session cookies are Secure. Locally, set `BETTER_AUTH_URL` to
`http://127.0.0.1:3000`. Chrome treats that host as a secure context, so the
cookie is sent on local HTTP. Production stays behind HTTPS.

### Workspace authorization

Workspaces use Better Auth's organization plugin, mapped to `workspaces`,
`workspace_members`, and `workspace_invitations`. Membership and invitation
changes go through its server APIs. The shared access-control definitions in
`packages/auth/src/access.ts` cover owner, admin, member, paper member, and
viewer permissions, including paper versus live trading.

On a database that already ran `0000` through `0003` of this history,
`0004_better_auth_workspaces.sql` adds organization fields and invitation
status without replacing workspace IDs or memberships. Hashed invitation
links keep working; new invitations use Better Auth's opaque IDs and still
require a verified matching email. A deferred database constraint preserves
at least one owner even during concurrent membership changes.

Migrations run with `bun run db:migrate`. `.github/workflows/migrate.yml`
runs that command on every push to `main`. `CREDENTIALS_ENCRYPTION_KEYS`
must be set before anyone can store Alpaca keys.

### Google

In Google Cloud, create an OAuth client and set the authorized redirect URI to:

```text
{BETTER_AUTH_URL}/api/auth/callback/google
```

Put the client id and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
Preview deploys use `https://<VERCEL_URL>/api/auth/callback/google`. Google
does not accept wildcard redirect URIs, so Google sign-in on a preview only
works after that exact URI is added. Use email and password on other previews.

### Database

Local Postgres and Mailpit come from Compose:

```bash
docker compose up -d
```

`DATABASE_URL` for that database is
`postgresql://treid:treid@127.0.0.1:5432/treid`. Production uses a Neon
pooled connection string in the same variable. Set `sslmode=verify-full` on it,
not the `sslmode=require` Neon copies by default. pg 8 already treats
`require`, `prefer`, and `verify-ca` as `verify-full` and prints a security
warning about it, so `packages/db` rewrites those modes to `verify-full` unless
the URL sets `uselibpqcompat`. Apply migrations as a deploy
step. Do not use `drizzle-kit push`. `bun run db:migrate` reads
`DATABASE_MIGRATOR_URL`, else `DATABASE_URL`, from the environment,
`packages/db/.env`, or `apps/web/.env.local`.

```bash
bun run db:migrate
```

Generate a new migration after a schema change with `bun run db:generate`, then
commit the SQL.

### Mail

Production sends verification and reset mail through Resend (`RESEND_API_KEY`,
`EMAIL_FROM`). Locally, the app sends SMTP to Mailpit on `127.0.0.1:1025`. Open
the mailbox at `http://127.0.0.1:8025`.

### Secrets

```bash
bun run auth:secrets
```

Paste `BETTER_AUTH_SECRET` and `CREDENTIALS_ENCRYPTION_KEYS` into
`apps/web/.env.local` and the deployment environment. The encryption value is
one or more `keyId:base64` pairs. Each generated key id is unique. The first
key encrypts new credentials. Every listed key can decrypt. Duplicate key ids
are rejected. To rotate:

1. Generate another key and prepend it, everywhere the app runs.
2. Run `bun run auth:rewrap-credentials`.
3. Remove the previous key only once the script exits 0. A non-zero exit means
   some rows could not be decrypted or still use the old key, and removing it
   would make them unreadable.

### Alpaca key protection

No workspace member, owners included, can read a stored key or secret. The server
decrypts them only to call Alpaca. The database enforces the rest:

- Each key is encrypted with AES-256-GCM and bound to its workspace,
  connection, environment and field (`v2`). A `CHECK` rejects anything that is
  not an encrypted value. A trigger blocks moving a connection to another
  workspace or environment.
- Member picks and workspace defaults can only point at a connection of the
  same workspace.
- The app reads encrypted keys only through `read_alpaca_credentials()`. It
  checks membership and records each use (member, purpose, count, last use) in
  `alpaca_credential_uses`.
- Row-level security on `alpaca_connections` shows a role that does not own
  the table only the connections of the acting member's workspaces. Queries on
  that table run inside `withMemberScope(userId, ...)` from
  `@workspace/db/member-scope`, which sets the member for one transaction. A
  query outside it sees no rows. The table owner (migrations, scripts) is not
  subject to it, so it applies once the app uses the restricted role below.
- API responses that contain a decrypted key are refused, keys are sent only
  to Alpaca's https hosts with redirects refused, and trading routes allow 60
  requests a minute per member and connection.

After `0005_credential_hardening.sql`, run `bun run auth:rewrap-credentials`
once to move existing rows from `v1` to `v2`. Add `--dry-run` to count first.

For database-level enforcement, run the app as a separate role that cannot
read the encrypted columns or write the usage audit:

1. Create a login role, for example `treid_app`. On Neon, use the console.
2. As the table owner, after migrating, run
   `psql "$DATABASE_MIGRATOR_URL" -v app_role=treid_app -f packages/db/sql/app-role.sql`.
   Rerun it after migrations that add tables.
3. Set `DATABASE_URL` to the new role and `DATABASE_MIGRATOR_URL` to the
   owner wherever `db:migrate` and the rewrap script run.

### Deposit wallets

Each user adds their own Alpaca crypto deposit addresses (USDC and USDT on
Ethereum and Solana) under Settings, and Funds & Wallet shows only that user's
addresses. Alpaca's Crypto Wallets API that returns these addresses is Broker
API only, so personal Trading API keys cannot fetch them automatically.

### Existing operator

There is no email on the old single-password session, so those cookies stop
working at deploy. They already expired within 12 hours. Move the operator once:

```bash
bun run auth:migrate-owner --email you@example.com
```

The command is safe to repeat. It creates a verified user whose password is the
current `DASHBOARD_PASSWORD_HASH`, and, when the old Alpaca key variables are
set, stores them encrypted for that user. Any `ADDRESS_*` deposit addresses
are copied into that user's deposit wallets. If an unverified account already
uses the email, the command stops instead of adopting it. Sign in with the same password, or
with Google on that email. If the password is lost, use Forgot password on the
login page. After a successful login, remove `DASHBOARD_PASSWORD_HASH`,
`AUTH_SECRET`, `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY`,
`ALPACA_ENVIRONMENT`, `ALPACA_TRADING_BASE_URL`, and the `ADDRESS_*` variables.

## HTTPS deployment

The `dev` and `start` scripts bind Next.js to `127.0.0.1`, so it is not exposed
directly. Run the HTTPS reverse proxy on the same host so it can connect to
`127.0.0.1:3000`. You cannot place the proxy on a different machine when the
app binds to loopback. A minimal Caddy site, with your own hostname in place of
`app.example.com`, is:

```caddyfile
app.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Caddy obtains and renews TLS certificates for a public hostname. Keep port
`3000` closed externally and expose only the proxy's HTTPS port. Never publish
this app over plain HTTP: the required Secure session cookie will not be sent.

Caddy `basic_auth` may be added as an optional second door, but must never
replace the app login:

```caddyfile
app.example.com {
  basic_auth {
    operator <caddy-generated-hash>
  }

  reverse_proxy 127.0.0.1:3000
}
```

Sign-in rate limits are stored in Postgres. A reverse proxy can add its own
limit in front of them.

## Vercel

Set these on the project before the first production or preview deploy. Trading
no longer reads `ALPACA_API_KEY_ID` or `ALPACA_API_SECRET_KEY` at runtime; each
user stores their own keys under Settings.

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
RESEND_API_KEY
EMAIL_FROM
CREDENTIALS_ENCRYPTION_KEYS
AUTH_ALLOWED_EMAILS
AUTH_DISABLE_SIGNUP
NEXT_PUBLIC_APP_URL # Production only
NEXT_PUBLIC_LANDING_URL
```

A non-empty `AUTH_ALLOWED_EMAILS` restricts sign-up to those addresses in
every environment. `AUTH_DISABLE_SIGNUP=false` reopens sign-up only when no
allowlist is set. `AUTH_DISABLE_SIGNUP=true` closes it. Production defaults
to closed. Preview deploys stay open unless `AUTH_DISABLE_SIGNUP` or
`AUTH_ALLOWED_EMAILS` is set.

`BETTER_AUTH_URL` must be the public production HTTPS origin, for example
`https://app.treid.app`. Preview deploys set Better Auth's base URL
from `VERCEL_URL` so email verification, password reset, and session cookies
target that preview. Google sign-in on a preview still needs that preview's
callback URI in Google Cloud; otherwise use email and password there. Add
extra CSRF origins with a comma-separated `BETTER_AUTH_TRUSTED_ORIGINS` if
needed.
`NEXT_PUBLIC_LANDING_URL` is the landing site origin, for example
`https://treid.app`. The login and sign-up pages link its `/terms` and
`/privacy` pages. Next.js inlines it at build time, so redeploy after changing
it. It defaults to the Astro dev server, `http://127.0.0.1:4321`.
`NEXT_PUBLIC_APP_URL` is the app's public origin, for example
`https://app.treid.app`. Link previews, the canonical login and sign-up URLs,
`robots.txt` and `sitemap.xml` are built from it. Next.js inlines it at build
time. Without it they use the Vercel deployment URL, then localhost. Set it
for the Production environment only: server-side API calls also use it, so a
preview deploy must keep its own `VERCEL_URL`.
`ALPACA_CRYPTO_LOCATION` and `ALPACA_DATA_BASE_URL` stay optional. After
`bun run auth:migrate-owner` succeeds, remove the legacy password, Alpaca, and
`ADDRESS_*` variables from Vercel.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request into `main`: lint and
format check, typecheck, a migration consistency check, the tests (with a
Postgres service, so the database integration tests run), and a production
build. It uses placeholder secrets only.

`.github/workflows/migrate.yml` runs `bun run db:migrate` on every push to
`main`, and can also be started by hand from the Actions tab. Manual runs
from any other branch or tag are skipped. Drizzle skips migrations that
were already applied, so a push without schema changes does nothing. Set
it up once:

1. In the repository settings, create an environment named `production`.
2. Add a `DATABASE_URL` secret to it with the Neon pooled connection string,
   using `sslmode=verify-full`. Once the app runs as the restricted role from
   "Alpaca key protection", also add a `DATABASE_MIGRATOR_URL` secret with the
   table owner's connection string; the workflow migrates with it. Without it,
   `DATABASE_URL` must stay the owner.
3. Set required reviewers on that environment so each migration waits for approval.

Vercel deploys `main` at the same time, so the new code can go live before the
migration finishes. Keep every later migration backwards compatible with the
version that is running: add columns and tables first, and drop or rename
them in a later release.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
