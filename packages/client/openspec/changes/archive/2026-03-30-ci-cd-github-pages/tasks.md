## 1. Vite Configuration

- [x] 1.1 Set `base: "/fungus/"` in `packages/client/vite.config.ts`

## 2. Docker

- [x] 2.1 Create `.dockerignore` at repository root excluding node_modules, .git, dist, *.md, .github, .opencode, .agents, .codex, openspec
- [x] 2.2 Create `Dockerfile` at repository root with multi-stage build (node:22 builder → node:22-slim runtime, entrypoint `node packages/server/dist/main.js`, expose 3001)

## 3. CI Workflow

- [x] 3.1 Create `.github/workflows/ci.yml` with trigger on push to main
- [x] 3.2 Add build job: checkout, setup Node.js 22, npm ci, npm run build, npm test
- [x] 3.3 Add Pages deploy job (depends on build): build client with Vite, upload artifact, deploy using actions/deploy-pages
- [x] 3.4 Add Docker job (depends on build): login to GHCR, build image, push as `ghcr.io/<owner>/fungus/server:sha-<short-sha>`
- [x] 3.5 Add canary release job (depends on build): read version, bump patch, commit back to main, create GitHub Release with new version tag

## 4. Release Workflow

- [x] 4.1 Create `.github/workflows/release.yml` with trigger on `v*` tag push
- [x] 4.2 Add build-and-test job: checkout, setup Node.js 22, npm ci, npm run build, npm test
- [x] 4.3 Add release job (depends on build-and-test): create GitHub Release using tag name
- [x] 4.4 Add Docker job (depends on build-and-test): login to GHCR, build image, push as `ghcr.io/<owner>/fungus/server:<version>` and `ghcr.io/<owner>/fungus/server:latest`

## 5. Verification

- [x] 5.1 Push to main and verify CI workflow runs all jobs successfully
- [x] 5.2 Verify GitHub Pages is accessible at `<owner>.github.io/fungus/`
- [x] 5.3 Verify Docker image appears in GHCR with canary tag
- [x] 5.4 Push a `v*` tag and verify release workflow creates a GitHub Release and tags Docker image with version and latest
