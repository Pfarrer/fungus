## Context

The fungus project is a monorepo (npm workspaces) with three packages: `game` (shared library), `client` (Vite + PixiJS browser app), and `server` (WebSocket server using `ws`). There is currently no CI/CD pipeline — all builds, tests, and deployments are manual.

The project uses TypeScript with `tsc --build` at the root level for compilation. The client uses Vite for bundling and dev serving. The server reads `PORT` from environment variables.

## Goals / Non-Goals

**Goals:**
- Automate build, test, and release on every push to main
- Deploy the client to GitHub Pages with correct base path
- Publish a Docker image for the server to GHCR on every push
- Support stable releases on `v*` tag pushes
- Auto-bump patch version on canary releases

**Non-Goals:**
- Server hosting/deployment (user will handle separately)
- Client-server connection URL configuration
- PR preview deployments
- Custom domain setup
- npm package publishing

## Decisions

### 1. Two separate workflow files

`ci.yml` (on push to main) and `release.yml` (on tag push `v*`). Keeping them separate avoids conditional spaghetti in a single file and makes triggers clear.

**Alternative considered:** Single workflow with `if` conditions. Rejected because it becomes hard to read and maintain.

### 2. Multi-stage Dockerfile at repo root

The monorepo's `tsc --build` compiles packages in dependency order. A single Dockerfile at the root builds everything, then copies only the runtime artifacts into a `node:slim` image.

```
Stage 1 (builder): node:22
  - COPY package.json, package-lock.json, tsconfig.json
  - COPY packages/*/package.json, packages/*/tsconfig.json
  - RUN npm ci
  - COPY source files
  - RUN npm run build

Stage 2 (runtime): node:22-slim
  - COPY --from=builder dist/ (game + server)
  - COPY --from=builder node_modules/ (production only)
  - COPY packages/server/package.json
  - ENTRYPOINT ["node", "packages/server/dist/main.js"]
  - EXPOSE 3001
```

### 3. GitHub Pages via `actions/deploy-pages`

Using the official GitHub Pages deployment action with `actions/configure-pages` and `actions/upload-pages-artifact`. The Pages source in repo settings must be set to "GitHub Actions" (not "Deploy from a branch").

**Alternative considered:** `peaceiris/actions-gh-pages` pushing to a `gh-pages` branch. Rejected because orphan branches pollute the repo and the native action is simpler.

### 4. Vite base path set to `/fungus/`

The repo name is `fungus`, so Pages will serve at `<user>.github.io/fungus/`. The `base` config ensures asset paths resolve correctly.

### 5. Auto-bump via commit back to main

On canary releases, the CI reads the current version from root `package.json`, bumps the patch, commits and pushes back. Uses `GITHUB_TOKEN` which does not trigger recursive workflows.

### 6. Docker image tagging strategy

- Every push to main: `ghcr.io/<owner>/fungus/server:sha-<7-char-short-sha>` (canary)
- Every `v*` tag: `ghcr.io/<owner>/fungus/server:latest` and `ghcr.io/<owner>/fungus/server:<version>` (stable)

## Risks / Trade-offs

- **[Auto-bump commits on main]** → The version-bump commit won't trigger another CI run (GitHub prevents recursive `GITHUB_TOKEN` triggers). This is safe but means the bumped version is only in the repo, not in the canary release artifact that was just created. Acceptable for canary. → Mitigation: The next canary release will pick up the bumped version.
- **[Pages path locked to `/fungus/`]** → If the repo is renamed, the Pages URL changes. → Mitigation: Update `vite.config.ts` `base` if renamed. Could use env var instead but overkill for now.
- **[Docker image includes game package]** → The image is larger than strictly necessary since it includes the shared game lib's dist. → Mitigation: Negligible impact, and the monorepo build approach is simpler.
- **[No test step in release workflow]** → The release workflow trusts that main is already tested by CI. → Mitigation: The CI workflow runs tests on every push; tags should only come from tested commits.
