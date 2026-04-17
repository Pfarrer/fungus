## Why

Every push to `main` triggers the `canary-release` job, which mutates `package.json` to bump the patch version, commits it back to `main`, and pushes. This creates a chore commit that re-triggers CI, pollutes git history, and creates a feedback loop risk. The version stored in `package.json` is only used as a release tag source — it doesn't need to be persisted as a file mutation.

## What Changes

- Remove the chore commit steps (git add/commit/push) from the `canary-release` job in `ci.yml`
- Derive the canary version from git tags at runtime instead of reading/mutating `package.json`
- **BREAKING**: The version in `package.json` will no longer be auto-incremented. It becomes a manual floor version (set only for formal releases or left as-is).
- Canary releases will use the next patch version after the latest git tag (e.g., if latest tag is `v0.1.3`, canary becomes `v0.1.4-canary.<short-sha>`)

## Capabilities

### New Capabilities
- `dynamic-versioning`: Derive project version from git tags at CI runtime, supporting both canary and formal release flows without file mutations.

### Modified Capabilities

## Impact

- `.github/workflows/ci.yml`: Remove git commit/push steps from `canary-release`, replace version source with git tag-based derivation
- `package.json`: No longer auto-updated by CI; version field becomes informational
- Docker tags: Canary images will use `<version>-canary.<sha>` instead of just `<version>`
- GitHub releases: Canary releases tagged with `-canary` suffix, making them distinct from formal releases
