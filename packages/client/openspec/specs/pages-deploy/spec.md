## ADDED Requirements

### Requirement: Client builds with correct base path
The Vite client SHALL be configured with `base: "/fungus/"` so that asset paths resolve correctly when deployed to GitHub Pages at `<owner>.github.io/fungus/`.

#### Scenario: Asset paths include base
- **WHEN** the client is built with `npm run build` in the client workspace
- **THEN** all generated asset references (JS, CSS, images) SHALL use the `/fungus/` base path prefix

#### Scenario: Client loads on GitHub Pages
- **WHEN** a user navigates to `<owner>.github.io/fungus/`
- **THEN** the client SHALL load and render without 404 errors on any assets

### Requirement: GitHub Pages uses Actions as deployment source
The Pages deployment SHALL use the official GitHub Actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`) rather than a branch-based deployment.

#### Scenario: Pages deployment via Actions
- **WHEN** the CI workflow deploys to Pages
- **THEN** it SHALL use `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`
- **AND** the repository Settings > Pages > Source SHALL be set to "GitHub Actions"

### Requirement: Pages deployment only on success
The client SHALL only be deployed to Pages if the build and test steps of the CI workflow succeed.

#### Scenario: Build failure prevents deployment
- **WHEN** the build or test step fails in the CI workflow
- **THEN** the Pages deployment step SHALL NOT execute

#### Scenario: Test failure prevents deployment
- **WHEN** the test step fails in the CI workflow
- **THEN** the Pages deployment step SHALL NOT execute
