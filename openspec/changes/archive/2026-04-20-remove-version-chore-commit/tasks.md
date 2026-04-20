## 1. Rewrite canary-release version derivation

- [x] 1.1 Replace the `jq`-based version bump step with a script that derives the version from `git tag --sort=-version:refname | head -1`, computing `<next-patch>-canary.<short-sha>`
- [x] 1.2 Handle the no-tags case by defaulting to `0.0.1-canary.<short-sha>`
- [x] 1.3 Remove the `git config`, `git add`, `git commit`, and `git push` steps from the `canary-release` job

## 2. Update canary Docker image tagging

- [x] 2.1 Add the derived canary version as an additional Docker tag in the `docker` job (alongside the existing `sha-<sha>` tag)

## 3. Update canary GitHub release

- [x] 3.1 Ensure the `softprops/action-gh-release` step uses the derived canary version for the tag name and release name
- [x] 3.2 Verify the release is still marked as `prerelease: true`

## 4. Verification

- [x] 4.1 Manually trigger or push to main and verify: no chore commit appears in git history
- [x] 4.2 Verify canary release tag follows the `<next-patch>-canary.<sha>` format
- [x] 4.3 Verify Docker image has both `sha-<sha>` and `<version>-canary.<sha>` tags
