## ADDED Requirements

### Requirement: Canary version derivation from git tags
The CI pipeline SHALL derive the canary release version from the latest git tag without mutating any files in the repository.

#### Scenario: Canary version with existing tags
- **WHEN** a push to `main` occurs and the latest git tag is `v0.1.3`
- **THEN** the canary version SHALL be `0.1.4-canary.<short-sha>` where `<short-sha>` is the 7-character abbreviated commit SHA

#### Scenario: Canary version with no prior tags
- **WHEN** a push to `main` occurs and no git tags exist
- **THEN** the canary version SHALL be `0.0.1-canary.<short-sha>`

### Requirement: No chore commits on main
The CI pipeline SHALL NOT commit or push any changes to the repository during the canary-release job.

#### Scenario: Canary release runs without committing
- **WHEN** the canary-release job executes
- **THEN** no `git commit` or `git push` commands SHALL be run
- **AND** the canary release SHALL be created as a GitHub prerelease with the derived version

### Requirement: Docker image tagged with canary version
The canary Docker image SHALL be tagged with the derived canary version in addition to the commit SHA tag.

#### Scenario: Canary Docker image tags
- **WHEN** the canary-release job completes for commit `abc1234` with derived version `0.1.4-canary.abc1234`
- **THEN** the Docker image SHALL be tagged with both `sha-abc1234` and `0.1.4-canary.abc1234`
