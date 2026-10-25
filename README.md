# Exchange

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
- With neither set, production (`NODE_ENV=production` or
  `VERCEL_ENV=production`) stays closed and other environments stay open.

Owner migration writes the user directly, so it still works when sign-up is
closed. Google sign-in for an existing allowed or migrated user still
works; a new Google user must be on the allowlist when one is set.

Session cookies are Secure. Locally, set `BETTER_AUTH_URL` to
`http://127.0.0.1:3000`. Chrome treats that host as a secure context, so the
cookie is sent on local HTTP. Production stays behind HTTPS.

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
`postgresql://exchange:exchange@127.0.0.1:5432/exchange`. Production uses a Neon
pooled connection string in the same variable. Apply migrations as a deploy
step. Do not use `drizzle-kit push`. `bun run db:migrate` reads `DATABASE_URL`
from the environment, `packages/db/.env`, or `apps/web/.env.local`.

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
key encrypts new credentials. Every listed key can decrypt. To rotate, generate
another key, prepend it, and keep the previous keys until every stored row has
been saved again. Duplicate key ids are rejected.

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
app binds to loopback. A minimal Caddy site is:

```caddyfile
dashboard.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Caddy obtains and renews TLS certificates for a public hostname. Keep port
`3000` closed externally and expose only the proxy's HTTPS port. Never publish
this app over plain HTTP: the required Secure session cookie will not be sent.

Caddy `basic_auth` may be added as an optional second door, but must never
replace the app login:

```caddyfile
dashboard.example.com {
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
```

A non-empty `AUTH_ALLOWED_EMAILS` restricts sign-up to those addresses in
every environment. `AUTH_DISABLE_SIGNUP=false` reopens sign-up only when no
allowlist is set. `AUTH_DISABLE_SIGNUP=true` closes it. Production defaults
to closed.

`BETTER_AUTH_URL` must be the public production HTTPS origin, for example
`https://dashboard.example.com`. Preview deploys set Better Auth's base URL
from `VERCEL_URL` so email verification, password reset, and session cookies
target that preview. Google sign-in on a preview still needs that preview's
callback URI in Google Cloud; otherwise use email and password there. Add
extra CSRF origins with a comma-separated `BETTER_AUTH_TRUSTED_ORIGINS` if
needed.
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
2. Add a `DATABASE_URL` secret to it with the Neon pooled connection string.
3. Set required reviewers on that environment so each migration waits for approval.

Vercel deploys `main` at the same time, so the new code can go live before the
migration finishes. Keep every migration backwards compatible with the version
that is running: add columns and tables first, and drop or rename them in a
later release.

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
