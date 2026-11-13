# Landing

Astro marketing site for Exchange. It is a workspace in the Bun monorepo and
is configured to use the shared styles and components from `@workspace/ui`.

## Project structure

```text
apps/landing/
├── public/                   # favicon
├── src/
│   ├── components/
│   │   ├── features/         # feature list, collaboration first
│   │   ├── hero/             # hero and its ticker tiles
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
│   ├── pages/index.astro
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
| `PUBLIC_SUPPORT_EMAIL` | Support address shown in the footer and on the legal pages | `support@example.com` |

Copy `.env.example` to `.env` to change it. It is typed and validated through
`astro:env`.

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
