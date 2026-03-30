## Why

The project has no CI/CD pipeline. Every build, test, and deployment is manual. We need automated builds, testing, releases, Docker image publishing, and static hosting for the client to support reliable iteration and deployment.

## What Changes

- Add a CI workflow that runs on every push to main: builds all packages, runs tests, deploys the client to GitHub Pages, builds a Docker image for the server and pushes it to GitHub Container Registry (GHCR), and creates a canary GitHub Release with auto-bumped patch version.
- Add a release workflow triggered by `v*` tags that creates a stable GitHub Release and tags the Docker image with `latest` and the version.
- Add a multi-stage Dockerfile at the repo root that builds the monorepo and produces a lean runtime image for the server.
- Add `.dockerignore` to keep the Docker context lean.
- Set Vite `base` to `/fungus/` so the client works correctly when hosted at `<user>.github.io/fungus/`.

## Capabilities

### New Capabilities
- `ci-workflow`: GitHub Actions workflow for build, test, Pages deploy, canary release, and Docker push on every push to main.
- `release-workflow`: GitHub Actions workflow for stable GitHub Release and Docker image tagging on `v*` tag push.
- `docker-image`: Multi-stage Dockerfile and `.dockerignore` for building and publishing the server image to GHCR.
- `pages-deploy`: Configuration for deploying the Vite client build to GitHub Pages with correct base path.

### Modified Capabilities

## Impact

- `.github/workflows/` (new) — two workflow files
- `Dockerfile` (new) — at repo root
- `.dockerignore` (new) — at repo root
- `packages/client/vite.config.ts` — `base: "/fungus/"` added
- `packages/*/package.json` — version auto-bumped by CI on canary releases
- Requires `contents: write` and `packages: write` permissions in the workflows
- GitHub repo settings: Pages source set to GitHub Actions
