## ADDED Requirements

### Requirement: Release workflow triggers on version tags
The system SHALL provide a GitHub Actions workflow that triggers on pushes of tags matching `v*`.

#### Scenario: Version tag push triggers release
- **WHEN** a tag matching `v*` (e.g., `v0.2.0`) is pushed
- **THEN** the release workflow SHALL run

#### Scenario: Non-version tag push does not trigger release
- **WHEN** a tag not matching `v*` is pushed
- **THEN** the release workflow SHALL NOT run

### Requirement: Release workflow creates a stable GitHub Release
The release workflow SHALL create a GitHub Release using the tag name as the release title and tag.

#### Scenario: Stable release creation
- **WHEN** the release workflow runs
- **THEN** a GitHub Release SHALL be created with the tag name as both the tag and title
- **AND** the release SHALL be marked as the latest release

### Requirement: Release workflow tags Docker image with version and latest
The release workflow SHALL build a Docker image and push it to GHCR with both the version tag and `latest`.

#### Scenario: Versioned Docker push
- **WHEN** a tag `v0.2.0` is pushed
- **THEN** the Docker image SHALL be pushed to GHCR as `ghcr.io/<owner>/fungus/server:0.2.0` and `ghcr.io/<owner>/fungus/server:latest`

### Requirement: Release workflow builds and tests before releasing
The release workflow SHALL run `npm ci`, `npm run build`, and `npm test` before creating any release artifacts.

#### Scenario: Build fails before release
- **WHEN** the release workflow runs and the build or test step fails
- **THEN** no GitHub Release or Docker image SHALL be created
