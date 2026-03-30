## ADDED Requirements

### Requirement: Multi-stage Dockerfile at repository root
The system SHALL provide a multi-stage Dockerfile at the repository root that builds the monorepo and produces a minimal runtime image for the server.

#### Scenario: Docker image build
- **WHEN** `docker build` is run from the repository root
- **THEN** a Docker image SHALL be produced that contains the compiled server and game packages and their production dependencies
- **AND** the image SHALL NOT contain development dependencies, test files, or source files

### Requirement: Dockerfile uses Node.js 22
Both build and runtime stages SHALL use Node.js 22 base images.

#### Scenario: Base images
- **WHEN** the Dockerfile is built
- **THEN** the build stage SHALL use `node:22` and the runtime stage SHALL use `node:22-slim`

### Requirement: Server entrypoint
The Docker image SHALL run the server using `node packages/server/dist/main.js` as the entrypoint.

#### Scenario: Container starts
- **WHEN** the Docker image is run
- **THEN** the server SHALL start by executing `node packages/server/dist/main.js`

### Requirement: Exposed port
The Docker image SHALL expose port 3001.

#### Scenario: Port exposure
- **WHEN** the Docker image is built
- **THEN** port 3001 SHALL be declared as exposed
- **AND** the server SHALL listen on the `PORT` environment variable defaulting to 3001

### Requirement: Dockerignore file
The system SHALL provide a `.dockerignore` file that excludes unnecessary files from the Docker build context.

#### Scenario: Dockerignore excludes
- **WHEN** the Docker build runs
- **THEN** the build context SHALL exclude `node_modules`, `.git`, `dist`, `*.md`, `.github`, `.opencode`, `.agents`, `.codex`, and `openspec` directories

### Requirement: GHCR image namespace
The Docker image SHALL be published to GitHub Container Registry under the `ghcr.io/<owner>/fungus/server` namespace.

#### Scenario: Image registry path
- **WHEN** the Docker image is pushed
- **THEN** it SHALL be pushed to `ghcr.io/<owner>/fungus/server` with appropriate tags
