# Landing

Astro marketing site for Treid. It is a workspace in the Bun monorepo and
is configured to use the shared styles and components from `@workspace/ui`.

## Project structure

```text
apps/landing/
├── public/                   # favicon
├── src/
│   ├── components/
│   │   ├── features/         # feature list, collaboration first
│   │   ├── hero/             # hero and its ticker tiles
│   │   ├── legal/            # shared shell and sections for the legal pages
│   │   ├── open-source/      # repository link, encryption code, self-host steps
│   │   ├── preview/          # static mock of the portfolio home
│   │   ├── security/         # how keys are stored
│   │   ├── workspaces/       # on your own or with your team
│   │   ├── asset-logo.astro  # stock and ETF logos, same source as the app
│   │   ├── avatar.astro      # member photo with an initials fallback
│   │   ├── edge-fade.astro   # progressive blur for the top and bottom edges
│   │   └── token-field.astro # floating logos that drift with the pointer
│   ├── layouts/layout.astro
│   ├── lib/                  # links, mock market and team data, chart helpers
│   ├── pages/                # index, privacy and terms
│   └── styles/globals.css    # shared tokens plus the float animation
├── astro.config.mjs
└── package.json
```

The page renders shared `@workspace/ui` styles statically: links use
`buttonVariants` so they look exactly like the app's buttons, and no React is
shipped to the browser.

## Environment

| Variable         | Purpose                                   | Default                 |
| :--------------- | :---------------------------------------- | :---------------------- |
| `PUBLIC_APP_URL` | Web app origin for the sign up and log in links | `http://localhost:3000` |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional token, rendered as a `google-site-verification` meta tag | Unset |
| `PUBLIC_SITE_URL` | Public origin of this site, for canonical URLs, Open Graph tags, `robots.txt` and the sitemap | `https://treid.app` |
| `PUBLIC_SUPPORT_EMAIL` | Support address shown in the footer and on the legal pages | `support@example.com` |

Copy `.env.example` to `.env` to change it. It is typed and validated through
`astro:env`. The `PUBLIC_APP_URL` and `PUBLIC_SUPPORT_EMAIL` defaults only suit local
development: set both for every production build, or the sign up and log in links point to localhost and
the footer and legal pages show `support@example.com`. A missing value does not
fail the build. Set `PUBLIC_SITE_URL` when the site runs anywhere other than
`https://treid.app`, such as a self-hosted copy. The hosted site runs at `https://treid.app` with
`PUBLIC_APP_URL=https://app.treid.app`.

The privacy and terms pages show a "Last updated" date from `src/lib/legal.ts`.
Bump it whenever their text changes.

## Commands

Install dependencies once from the repository root:

```sh
bun install
```

Run the rest from `apps/landing`, or from the root with `bun run --filter landing <script>`:

| Command                 | Action                                        |
| :---------------------- | :-------------------------------------------- |
| `bun run dev`           | Starts the dev server at `127.0.0.1:4321`     |
| `bun run build`         | Builds the production site to `./dist/`       |
| `bun run preview`       | Previews the production build locally         |
| `bun run typecheck`     | Runs `astro check`                            |
| `bun run astro -- ...`  | Runs Astro CLI commands, such as `astro add`  |

See the [Astro documentation](https://docs.astro.build) for more.
