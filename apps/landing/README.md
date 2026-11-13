# Landing

Astro marketing site for Exchange. It is a workspace in the Bun monorepo and
renders shared components from `@workspace/ui`.

## Project structure

```text
apps/landing/
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   ├── astro.svg
│   │   └── background.svg
│   ├── components/
│   │   └── Welcome.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── globals.css
├── astro.config.mjs
├── components.json
└── package.json
```

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
