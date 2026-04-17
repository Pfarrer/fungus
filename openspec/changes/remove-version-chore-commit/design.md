## Context

The current CI pipeline (`ci.yml` → `canary-release` job) bumps the version in `package.json` by incrementing the patch number, then commits and pushes that change back to `main`. This chore commit triggers another CI run (since it pushes to `main`), pollutes git history, and couples the version to file state rather than git state.

The `release.yml` workflow already derives its version from the git tag (`${GITHUB_REF_NAME#v}`), proving that runtime version derivation works.

Project stack: Node.js monorepo with npm workspaces, GitHub Actions CI/CD, Docker images on GHCR, GitHub Pages deployment.

## Goals / Non-Goals

**Goals:**
- Eliminate the chore commit from the canary-release job
- Derive canary versions from git tags at CI runtime
- Keep Docker image tags meaningful and traceable (include both version and commit SHA)
- Maintain the existing formal release flow (triggered by `v*` tags)

**Non-Goals:**
- Changing the formal release workflow (`release.yml`)
- Adding semantic versioning tooling (semantic-release, standard-version, etc.)
- Changing the `package.json` version field during formal releases
- Supporting major/minor auto-bumps

## Decisions

### 1. Derive canary version from the latest git tag

**Decision**: Use `git describe --tags --abbrev=0` to find the latest `v*` tag, then compute the next patch version with a `-canary.<short-sha>` suffix.

**Rationale**: Tags are the source of truth for releases. Deriving from tags avoids file mutations and works without additional tooling.

**Alternatives considered**:
- Read `package.json` version without committing back: Works but the version in `package.json` would drift from reality and create confusion.
- Use commit count (`git rev-list --count`): Less meaningful than tag-derived versions.
- Use just the commit SHA as version: Loses ordering/semantic meaning.

### 2. Canary version format: `<next-patch>-canary.<short-sha>`

**Decision**: If latest tag is `v0.1.3`, canary version is `0.1.4-canary.abc1234`.

**Rationale**: The `-canary` suffix makes prerelease status explicit (sorted before the formal release by semver). The short SHA provides traceability to the exact commit. The patch increment signals "this is what will become the next release."

### 3. No fallback to `package.json`

**Decision**: If no git tags exist, use `0.0.0` as the base version.

**Rationale**: After the initial release tag exists, this is a non-issue. Avoids coupling to `package.json` state.

### 4. Remove `package.json` mutation entirely

**Decision**: The version field in `package.json` stays at whatever it was last manually set to. CI never touches it.

**Rationale**: Eliminates the chore commit entirely. The `package.json` version becomes informational only.

## Risks / Trade-offs

- **No git tags yet**: Canary versions will be `0.0.1-canary.<sha>` → Acceptable for initial development phase.
- **`package.json` version drifts from reality**: The version field won't match the latest release → Acceptable since CI-derived version is the source of truth. Could add a post-release step to sync it later if desired.
- **Concurrent CI runs on `main`**: Removing the chore commit eliminates the feedback loop risk entirely → This is a net positive.
