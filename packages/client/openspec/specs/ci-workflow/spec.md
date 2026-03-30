## ADDED Requirements

### Requirement: CI workflow triggers on push to main
The system SHALL provide a GitHub Actions workflow that triggers on every push to the `main` branch.

#### Scenario: Push to main triggers CI
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the CI workflow SHALL run

#### Scenario: Push to a feature branch does not trigger CI
- **WHEN** a commit is pushed to a branch that is not `main`
- **THEN** the CI workflow SHALL NOT run

### Requirement: CI workflow builds all packages
The CI workflow SHALL install dependencies and build all workspace packages using `npm ci` and `npm run build`.

#### Scenario: Successful build
- **WHEN** the CI workflow runs
- **THEN** it SHALL execute `npm ci` followed by `npm run build` at the repository root
- **AND** the build SHALL succeed if all TypeScript compilation completes without errors

### Requirement: CI workflow runs all tests
The CI workflow SHALL run the full test suite using `npm test` at the repository root.

#### Scenario: Tests pass
- **WHEN** the CI workflow runs and all tests pass
- **THEN** the workflow SHALL proceed to subsequent jobs

#### Scenario: Tests fail
- **WHEN** the CI workflow runs and any test fails
- **THEN** the workflow SHALL fail and not proceed to deploy or release steps

### Requirement: CI workflow deploys client to GitHub Pages
The CI workflow SHALL build the Vite client and deploy the output to GitHub Pages using the official `actions/deploy-pages` action.

#### Scenario: Pages deployment succeeds
- **WHEN** the CI workflow runs and the build and test steps succeed
- **THEN** the client SHALL be built with `npm run build` in the client workspace
- **AND** the built artifacts SHALL be uploaded and deployed to GitHub Pages

### Requirement: CI workflow builds and pushes Docker image
The CI workflow SHALL build a Docker image from the repository root Dockerfile and push it to GHCR with a canary tag.

#### Scenario: Docker canary push
- **WHEN** the CI workflow runs and the build step succeeds
- **THEN** a Docker image SHALL be built
- **AND** pushed to `ghcr.io/<owner>/fungus/server:sha-<7-char-short-sha>`

### Requirement: CI workflow creates a canary GitHub Release
The CI workflow SHALL create a canary GitHub Release with auto-bumped patch version on every push to main.

#### Scenario: Canary release creation
- **WHEN** the CI workflow runs and all prior steps succeed
- **THEN** the system SHALL read the current version from `package.json`
- **AND** bump the patch version
- **AND** commit the version bump back to `main`
- **AND** create a GitHub Release tagged with the new version

### Requirement: CI workflow uses Node.js 22
The CI workflow SHALL use Node.js 22 for all build, test, and deploy steps.

#### Scenario: Node version
- **WHEN** the CI workflow runs
- **THEN** all jobs SHALL use `actions/setup-node` with `node-version: 22`
