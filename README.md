# Treid

Treid is an open-source trading desk for your [Alpaca](https://alpaca.markets)
account. Sign in, add your own Alpaca keys and trade stocks, ETFs and crypto
on your own, or share a workspace with your team and decide what each person
can do. You can use the hosted app at [treid.app](https://treid.app) or run
your own copy.

## Features

- **Workspaces.** Every account starts with a personal workspace. Invite
  people into a shared one as owner, admin, member, paper member or viewer.
  Roles decide who manages connections and who trades paper or live. Each
  workspace keeps a log of who did what.
- **Paper and live, side by side.** Practice on a paper account, then trade
  live from the same screen. Live orders always ask before they go out.
- **Named key sets.** Add as many Alpaca connections as you need, name each
  one and switch between them.
- **Keys that stay on the server.** Alpaca keys are encrypted with AES-256-GCM
  when saved and used only by the server to call Alpaca. Nobody, owners
  included, can read them back; the app shows a masked key and whether it
  still works.
- **Live prices.** Prices flash as they change and the balance rolls over
  digit by digit.
- **Phone and desktop.** A tab bar on your phone, the full screen on your
  desktop.
- **Deposit wallets.** Each person saves their own Alpaca crypto deposit
  addresses (USDC and USDT on Ethereum and Solana) and sees them under Funds &
  Wallet.
- **Sign-in.** Google, or email and password with a verified address.

## Repository layout

A Bun monorepo run with Turborepo.

| Path                          | What it is                                                         |
| :---------------------------- | :----------------------------------------------------------------- |
| `apps/web`                    | The trading app, Next.js                                           |
| `apps/landing`                | The marketing site with the privacy and terms pages, Astro ([README](apps/landing/README.md)) |
| `packages/auth`               | Better Auth setup, sign-up policy and workspace roles              |
| `packages/db`                 | Drizzle schema, SQL migrations and the restricted app role         |
| `packages/ui`                 | Shared shadcn/ui components and styles                             |
| `packages/typescript-config`  | Shared TypeScript configs                                          |
| `scripts`                     | Operator scripts: secrets, key rotation, owner migration, brand assets |

## Self-hosting

### Requirements

- [Bun](https://bun.sh) 1.2 and Node.js 20 or later.
- PostgreSQL. `compose.yaml` runs Postgres 17 locally, or use any Postgres
  you already run, such as Neon.
- A Google OAuth client. Sign-in fails the environment check without
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- A [Resend](https://resend.com) API key for verification and password reset
  mail. Production requires it.
- A host with an HTTPS reverse proxy, such as Caddy, or a Vercel project.
- An Alpaca account. Each user adds their own keys in the app; a new Alpaca
  account starts with paper trading.

### 1. Clone and install

```bash
git clone https://github.com/jralvarenga/treid
cd treid
bun install
cp apps/web/.env.sample apps/web/.env.local
```

### 2. Generate secrets

```bash
bun run auth:secrets
```

Paste `BETTER_AUTH_SECRET` and `CREDENTIALS_ENCRYPTION_KEYS` into
`apps/web/.env.local` and the deployment environment. Nobody can store Alpaca
keys until `CREDENTIALS_ENCRYPTION_KEYS` is set.

The encryption value is one or more comma-separated `keyId:base64` pairs. Each generated key id
is unique and duplicates are rejected. The first key encrypts new credentials
and every listed key can decrypt. To rotate:

1. Generate another key and prepend it, everywhere the app runs.
2. Run `bun run auth:rewrap-credentials`. Add `--dry-run` to count rows first.
3. Remove the previous key only once the script exits 0. A non-zero exit means
   some rows could not be decrypted or still use the old key, and removing it
   would make them unreadable.

### 3. Configure the environment

`apps/web/.env.sample` lists every variable with comments.

| Variable                      | Purpose                                                                 |
| :---------------------------- | :---------------------------------------------------------------------- |
| `DATABASE_URL`                | Postgres connection the app uses                                        |
| `DATABASE_MIGRATOR_URL`       | Optional table owner for migrations and scripts, see [Restricted database role](#restricted-database-role) |
| `BETTER_AUTH_SECRET`          | Session secret, at least 32 characters                                  |
| `BETTER_AUTH_URL`             | Public HTTPS origin of the app, such as `https://app.example.com`       |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Optional extra CSRF origins, comma-separated                            |
| `CREDENTIALS_ENCRYPTION_KEYS` | Keys that encrypt stored Alpaca credentials                             |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in                                             |
| `RESEND_API_KEY`, `EMAIL_FROM` | Verification and reset mail                                            |
| `AUTH_ALLOWED_EMAILS`         | Optional comma-separated sign-up allowlist                              |
| `AUTH_DISABLE_SIGNUP`         | Optional `true` or `false` to close or open sign-up                     |
| `NEXT_PUBLIC_APP_URL`         | Public app origin for metadata, `robots.txt` and the sitemap            |
| `NEXT_PUBLIC_LANDING_URL`     | Landing origin that serves `/terms` and `/privacy`                      |
| `ALPACA_CRYPTO_LOCATION`      | Optional Alpaca crypto data location: `us`, `us-1`, `us-2`, `eu-1` or `bs-1` |
| `ALPACA_DATA_BASE_URL`        | Optional, and only `https://data.alpaca.markets` is accepted            |

`apps/web/lib/env.ts` validates the server variables on first use, such as
the first sign-in request, not at build time. There are no shared Alpaca keys:
each user stores their own under Settings.

`NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_LANDING_URL` are inlined at build time,
so rebuild after changing them. Without `NEXT_PUBLIC_APP_URL` the app uses the
Vercel deployment URL, then localhost. `NEXT_PUBLIC_LANDING_URL` defaults to
the Astro dev server, `http://127.0.0.1:4321`. To host the landing site too,
see [its README](apps/landing/README.md).

#### Sign-in and sign-up

Email sign-in requires a verified address, and password reset uses the same
mail path. Google and password sign-ins for the same verified email join one
user; an unverified password account is not joined to a later Google sign-in.
Email sign-in is limited to five attempts every 15 minutes, stored in Postgres
so the limit holds across instances.

In Google Cloud, create an OAuth client with this authorized redirect URI:

```text
{BETTER_AUTH_URL}/api/auth/callback/google
```

Sign-up policy, in order:

- A non-empty `AUTH_ALLOWED_EMAILS` (case-insensitive) restricts new accounts
  to those addresses in every environment, local development included.
  `AUTH_DISABLE_SIGNUP` does not override it.
- With no allowlist, `AUTH_DISABLE_SIGNUP=true` closes sign-up and
  `AUTH_DISABLE_SIGNUP=false` opens it.
- With neither set, Vercel production (`VERCEL_ENV=production`) stays closed
  and Vercel previews (`VERCEL_ENV=preview`) stay open, even though Next.js
  sets `NODE_ENV=production` there. Without `VERCEL_ENV`,
  `NODE_ENV=production` stays closed and other environments stay open.

Google sign-in for an existing or migrated user still works when sign-up is
closed; a new Google user must be on the allowlist when one is set.

### 4. Set up the database

`DATABASE_URL` can point at any Postgres. For a hosted one such as Neon, use
the pooled connection string with `sslmode=verify-full`, not the
`sslmode=require` Neon copies by default. pg 8 already treats `require`,
`prefer` and `verify-ca` as `verify-full` and warns about it, so `packages/db`
rewrites those modes to `verify-full` unless the URL sets `uselibpqcompat`.

Apply migrations as a deploy step. Do not use `drizzle-kit push`.

```bash
bun run db:migrate
```

It reads `DATABASE_MIGRATOR_URL`, else `DATABASE_URL`, from the environment,
`packages/db/.env` or `apps/web/.env.local`.

#### Restricted database role

For database-level enforcement of [Alpaca key protection](#alpaca-key-protection),
run the app as a separate role that cannot read the encrypted columns or write
the usage audit:

1. Create a login role, for example `treid_app`. On Neon, use the console.
2. As the table owner, after migrating, run
   `psql "$DATABASE_MIGRATOR_URL" -v app_role=treid_app -f packages/db/sql/app-role.sql`.
   Rerun it after migrations that add tables.
3. Set `DATABASE_URL` to the new role and `DATABASE_MIGRATOR_URL` to the owner
   wherever `db:migrate` and the rewrap script run.

### 5. Build and run

```bash
bun run build
bun run --filter web start
```

The `start` and `dev` scripts bind Next.js to `127.0.0.1:3000`, so the app is
never exposed directly. Put an HTTPS reverse proxy in front of it.

### HTTPS deployment

Run the reverse proxy on the same host so it can reach `127.0.0.1:3000`; a
proxy on another machine cannot reach the loopback address. A minimal Caddy
site, with your own hostname in place of `app.example.com`:

```caddyfile
app.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Caddy obtains and renews TLS certificates for a public hostname. Keep port
`3000` closed externally and expose only the proxy's HTTPS port. Set
`BETTER_AUTH_URL` to that `https://` address. Never publish the app over plain
HTTP: session cookies are Secure and would not be sent.

Caddy `basic_auth` can add an optional second door, but never replaces the app
login:

```caddyfile
app.example.com {
  basic_auth {
    operator <caddy-generated-hash>
  }

  reverse_proxy 127.0.0.1:3000
}
```

The proxy can also add its own rate limit in front of the app's sign-in limit.

### Deploying on Vercel

Set these on the project before the first production or preview deploy:

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

- `BETTER_AUTH_URL` is the public production HTTPS origin. Preview deploys
  set Better Auth's base URL from `VERCEL_URL`, so verification, reset and
  session cookies target that preview.
- Set `NEXT_PUBLIC_APP_URL` for Production only. Server-side API calls also
  use it, so a preview must keep its own `VERCEL_URL`.
- Google does not accept wildcard redirect URIs. Google sign-in on a preview
  works only after `https://<VERCEL_URL>/api/auth/callback/google` is added;
  use email and password on other previews.
- Production sign-up defaults to closed. Previews stay open unless
  `AUTH_DISABLE_SIGNUP` or `AUTH_ALLOWED_EMAILS` is set.

Vercel deploys before migrations finish, so run them in CI as described in
[Continuous integration](#continuous-integration) and keep each migration
backwards compatible.

### Alpaca key protection

No workspace member, owners included, can read a stored key or secret. The
server decrypts them only to call Alpaca, and the database enforces the rest:

- Each key is encrypted with AES-256-GCM and bound to its workspace,
  connection, environment and field (`v2`). A `CHECK` rejects anything that is
  not an encrypted value, and a trigger blocks moving a connection to another
  workspace or environment.
- Member picks and workspace defaults can only point at a connection of the
  same workspace.
- The app reads encrypted keys only through `read_alpaca_credentials()`, which
  checks membership and records each use (member, purpose, count, last use) in
  `alpaca_credential_uses`.
- Row-level security on `alpaca_connections` shows a role that does not own the
  table only the connections of the acting member's workspaces. Queries on it
  run inside `withMemberScope(userId, ...)` from `@workspace/db/member-scope`,
  which sets the member for one transaction; a query outside it sees no rows.
  The table owner (migrations, scripts) bypasses it, so it applies once the app
  uses the [restricted role](#restricted-database-role).
- API responses that contain a decrypted key are refused. Keys are sent only to
  Alpaca's https hosts with redirects refused. Trading routes allow 60
  requests a minute per member on a connection, and 100 a minute per
  connection across all members.

### Workspace authorization

Workspaces use Better Auth's organization plugin, mapped to `workspaces`,
`workspace_members` and `workspace_invitations`. Membership and invitation
changes go through its server APIs. Role permissions, including paper versus
live trading, are defined in `packages/auth/src/access.ts`. Invitations require
a verified matching email, and a deferred database constraint keeps at least
one owner even during concurrent membership changes.

### Deposit wallets

Alpaca's Crypto Wallets API, which returns deposit addresses, is Broker API
only, so personal Trading API keys cannot fetch them. Each user adds their own
addresses under Settings instead.

### Upgrading an existing install

**Workspaces.** On a database that already ran `0000` through `0003`,
`0004_better_auth_workspaces.sql` adds organization fields and invitation
status without replacing workspace IDs or memberships. Hashed invitation links
keep working; new invitations use Better Auth's opaque IDs.

**Credential hardening.** After `0005_credential_hardening.sql`, run
`bun run auth:rewrap-credentials` once to move existing rows from `v1` to `v2`.
Add `--dry-run` to count first.

**Single-password operator.** Old single-password sessions have no email, so
those cookies stop working at deploy. They already expired within 12 hours.
Move the operator once:

```bash
bun run auth:migrate-owner --email you@example.com
```

The command is safe to repeat and works with sign-up closed. It creates a
verified user whose password is the current `DASHBOARD_PASSWORD_HASH` and,
when the old Alpaca key variables are set, stores them encrypted for that user.
Any `ADDRESS_*` deposit addresses are copied into that user's deposit wallets.
If an unverified account already uses the email, it stops instead of adopting
it. Sign in with the same password or with Google on that email; if the
password is lost, use Forgot password. After a successful login, remove
`DASHBOARD_PASSWORD_HASH`, `AUTH_SECRET`, `ALPACA_API_KEY_ID`,
`ALPACA_API_SECRET_KEY`, `ALPACA_ENVIRONMENT`, `ALPACA_TRADING_BASE_URL` and
the `ADDRESS_*` variables.

## Development

```bash
bun install
docker compose up -d
cp apps/web/.env.sample apps/web/.env.local
bun run auth:secrets
bun run db:migrate
bun run dev
```

`docker compose up -d` starts Postgres at
`postgresql://treid:treid@127.0.0.1:5432/treid` and Mailpit. Locally the app
sends mail over SMTP to Mailpit on `127.0.0.1:1025`; read it at
`http://127.0.0.1:8025`. Keep `BETTER_AUTH_URL` at `http://127.0.0.1:3000`:
Chrome treats that host as a secure context, so the Secure session cookie is
sent over local HTTP. `bun run dev` starts the app at `127.0.0.1:3000` and the
landing site at `127.0.0.1:4321`.

| Command               | Action                                                   |
| :-------------------- | :------------------------------------------------------- |
| `bun run dev`         | Runs every app in development                            |
| `bun run build`       | Builds every app                                         |
| `bun run check`       | Lint and format check with Biome                         |
| `bun run format`      | Fixes lint and format issues                             |
| `bun run typecheck`   | Type-checks every workspace                              |
| `bun run test`        | Tests the web app, `packages/auth` and `packages/db`     |
| `bun run db:generate` | Generates a migration after a schema change; commit the SQL |

### Continuous integration

`.github/workflows/ci.yml` runs on every pull request into `main`: lint and
format check, typecheck, a migration consistency check, the tests (with a
Postgres service, so the database integration tests run) and a production
build. It uses placeholder secrets only.

`.github/workflows/migrate.yml` runs `bun run db:migrate` on every push to
`main` and can be started by hand from the Actions tab; manual runs from any
other branch or tag are skipped. Drizzle skips applied migrations, so a push
without schema changes does nothing. Set it up once:

1. In the repository settings, create an environment named `production`.
2. Add a `DATABASE_URL` secret with the pooled connection string, using
   `sslmode=verify-full`. Once the app runs as the
   [restricted role](#restricted-database-role), also add a
   `DATABASE_MIGRATOR_URL` secret with the table owner's connection string;
   the workflow migrates with it. Without it, `DATABASE_URL` must stay the
   owner.
3. Set required reviewers on that environment so each migration waits for
   approval.

Vercel deploys `main` at the same time, so new code can go live before the
migration finishes. Keep every migration backwards compatible with the running
version: add columns and tables first, and drop or rename them in a later
release.

### UI components

Shared components live in `packages/ui`. Add a shadcn/ui component from the
repository root:

```bash
bunx shadcn@latest add button -c apps/web
```

It lands in `packages/ui/src/components`. Import it from the `ui` package:

```tsx
import { Button } from '@workspace/ui/components/button'
```

## Contributing

Found a bug or want a feature? [Open an issue](https://github.com/jralvarenga/treid/issues/new)
or [send a pull request](https://github.com/jralvarenga/treid/pulls). Run
`bun run check`, `bun run typecheck` and `bun run test` before opening one.
