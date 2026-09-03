# Exchange

A private, single-operator trading dashboard. Dashboard identity comes from the
secrets configured by the person who deploys it; there is no user database.

## Dashboard authentication

The dashboard accepts one deploy-time password and stores only its bcrypt hash.
Successful login creates a 12-hour, HMAC-SHA-256-signed session in a
`__Host-` cookie with `HttpOnly`, `Secure`, and `SameSite=Strict`. Login attempts
are limited to five per client address every 15 minutes in each running app
process.

There are three distinct values:

| Value | What it is | Where it goes |
| --- | --- | --- |
| Your actual password | A memorable, strong password you choose and enter on the login screen | Keep it in your password manager; do not put it in an environment variable |
| Password hash | A one-way bcrypt representation of your actual password | `DASHBOARD_PASSWORD_HASH` |
| Auth secret | Random machine-generated data used to sign session cookies | `AUTH_SECRET` |

The password hash is not encrypted and cannot be decrypted back into your
password. The app checks whether the password entered at login matches this
hash.

### Generate both values

From the repository root, run:

```bash
bun run auth:setup
```

The script hides your typing, asks you to enter the password twice, and prints
the two complete lines to copy into `apps/web/.env.local`:

```dotenv
DASHBOARD_PASSWORD_HASH=\$2b\$12\$...generated bcrypt hash...
AUTH_SECRET=...generated random signing secret...
```

Keep the backslashes before all three `$` characters. Next.js uses `$` for env
variable expansion, so the backslashes tell it these are literal parts of the
bcrypt hash. Next.js removes the backslashes when it loads the value.

The script does not print or save your actual password. At login, use the
original password you entered into the script. The `AUTH_SECRET` is generated
with the same cryptographically secure random source as an OpenSSL-generated
secret; you do not need to run OpenSSL separately.

Store the two generated values in the deployment platform's secret environment,
not a committed file. If a device is lost, run the script again with a new
password and replace both values; replacing `AUTH_SECRET` invalidates every
existing cookie immediately.

When setting `DASHBOARD_PASSWORD_HASH` through a hosting provider's environment
variable UI instead of a `.env` file, paste the raw bcrypt hash without the
backslashes. The escaping is required only in `.env*` files parsed by Next.js.

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

The built-in rate limiter is intentionally state-free and per process. For a
multi-process or multi-instance deployment, add a shared limiter at the reverse
proxy while retaining the app limiter.

## Optional passkey follow-up

Passkeys may be added later only as a second factor after the environment
password session exists. That design needs a small private JSON file containing
the credential ID, public key, and signature counter, plus an environment
`RECOVERY_TOKEN`. Do not expose an unclaimed instance publicly, and do not make
the passkey the only lock or recovery path.

Alpaca credentials and OAuth/Connect link the brokerage account only. They are
not dashboard administrator identity.

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
