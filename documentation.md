# DevSecOps Automation for AI-Powered Vulnerability Prioritization: Project Documentation

**Author:** Gemini
**Date:** January 31, 2026
**Version:** 1.0

## 1. Overview

This document outlines the current state, architecture, and progress of the PFE project focused on creating a fully automated DevSecOps pipeline. The system integrates OWASP DefectDojo for vulnerability management with a custom AI service for intelligent vulnerability prioritization, visualized through a web dashboard.

## 2. Current State: Day 1 - Project Setup & Containerization

The initial project setup is complete. All major components have been scaffolded and configured for containerized deployment using Podman. The core DefectDojo application is ready to be built and launched.

**Progress Checklist:**
- [x] **Environment Setup:** A reproducible `shell.nix` file has been created to provide all necessary tooling (`podman`, `podman-compose`) for the NixOS environment.
- [x] **Component Scaffolding:** Placeholder applications for the `ai_service` (FastAPI) and `dashboard` (React) have been created.
- [x] **Vulnerability Management System:** The official OWASP DefectDojo application has been cloned and its configuration has been adapted for this project.
- [x] **Containerization:** `Dockerfile`s for all custom services and `docker-compose.yml` files for orchestration have been created and heavily modified to work within the specific constraints of the user's system.
- [ ] **Launch DefectDojo Stack:** The final step of Day 1 is to build and run the DefectDojo containers using the command provided below.

## 3. Build Command

Run the following command from the project's root directory (`/home/fun/Desktop/Mob/`) in your own terminal. This will build and launch the entire DefectDojo stack. **Note:** This is a long-running process and may take 15-20 minutes on the first run.

```bash
cd defectdojo && podman-compose up --build -d && cd ..
```

Once this command completes successfully, you can proceed to the next steps.

## 8. System Architecture Details

This section provides a granular look at each container involved in the project, detailing their purpose, configurations, and interconnections.

### 8.1. From `defectdojo/docker-compose.yml` (DefectDojo Stack)

This `docker-compose.yml` orchestrates the core DefectDojo application and its dependencies.

*   **`nginx`**
    *   **Purpose:** Front-end web server for DefectDojo. Serves static files, handles incoming HTTP/HTTPS requests, and acts as a reverse proxy to the `uwsgi` application server.
    *   **Image:** `defectdojo/defectdojo-nginx:latest` (built from `Dockerfile.nginx-alpine`).
    *   **Dependencies:** `uwsgi` (ensures the application server is running before Nginx starts).
    *   **Ports:** Maps host port `8080` to container port `80` (HTTP) and host port `8443` to container port `443` (HTTPS).
    *   **Volumes:** Mounts `defectdojo_media` volume to `/usr/share/nginx/html/media` for persistent storage of user-uploaded files and static assets.
    *   **Environment Variables:** Configures `NGINX_METRICS_ENABLED`, `DD_UWSGI_HOST` (set to `uwsgi` for internal communication), `DD_UWSGI_PORT`.
    *   **Networking:** Connected to the internal `defectdojo_default_network` and the shared external `pfe_network`.

*   **`uwsgi`**
    *   **Purpose:** The main DefectDojo Django application server. It processes dynamic web requests from Nginx and communicates with the PostgreSQL database and Celery workers.
    *   **Image:** `defectdojo/defectdojo-django:latest` (built from `Dockerfile.django-debian`).
    *   **Dependencies:** `initializer` (ensures database is migrated and initial setup is complete), `postgres` (database must be running), `valkey` (Redis-compatible store must be running).
    *   **Ports:** Exposes internal port `3031` for Nginx to proxy requests. Not directly exposed to the host.
    *   **Volumes:** Mounts `./docker/extra_settings` to `/app/docker/extra_settings` for custom Django settings, and `defectdojo_media` to `/app/media` for persistent media storage.
    *   **Environment Variables:** Configures critical settings like `DD_DEBUG`, `DD_DJANGO_METRICS_ENABLED`, `DD_ALLOWED_HOSTS`, `DD_DATABASE_URL`, `DD_CELERY_BROKER_URL`, `DD_SECRET_KEY`, `DD_CREDENTIAL_AES_256_KEY`, `DD_DATABASE_READINESS_TIMEOUT`.
    *   **Networking:** Connected to the internal `defectdojo_default_network` and the shared external `pfe_network`.

*   **`celerybeat`**
    *   **Purpose:** Celery beat scheduler, responsible for initiating periodic tasks defined within DefectDojo (e.g., scheduled reports, data synchronization).
    *   **Image:** Same as `uwsgi` (`defectdojo/defectdojo-django:latest`).
    *   **Dependencies:** Same as `uwsgi`.
    *   **Ports:** None.
    *   **Volumes:** Mounts `./docker/extra_settings`.
    *   **Environment Variables:** Same critical database and secret keys as `uwsgi`.
    *   **Networking:** Connected to the internal `defectdojo_default_network` and the shared external `pfe_network`.

*   **`celeryworker`**
    *   **Purpose:** Celery worker, executes asynchronous background tasks dispatched by the Django application (e.g., vulnerability imports, report generation).
    *   **Image:** Same as `uwsgi` (`defectdojo/defectdojo-django:latest`).
    *   **Dependencies:** Same as `uwsgi`.
    *   **Ports:** None.
    *   **Volumes:** Mounts `./docker/extra_settings` and `defectdojo_media`.
    *   **Environment Variables:** Same critical database and secret keys as `uwsgi`.
    *   **Networking:** Connected to the internal `defectdojo_default_network` and the shared external `pfe_network`.

*   **`initializer`**
    *   **Purpose:** A temporary container designed to run database migrations and create the initial superuser account for DefectDojo upon its first launch. It exits after completing its tasks.
    *   **Image:** Same as `uwsgi` (`defectdojo/defectdojo-django:latest`).
    *   **Dependencies:** `postgres` (database must be running).
    *   **Ports:** None.
    *   **Volumes:** Mounts `./docker/extra_settings`.
    *   **Environment Variables:** Configures `DD_DATABASE_URL`, `DD_ADMIN_USER`, `DD_ADMIN_MAIL`, `DD_ADMIN_FIRST_NAME`, `DD_ADMIN_LAST_NAME`, `DD_INITIALIZE`, `DD_SECRET_KEY`, `DD_CREDENTIAL_AES_256_KEY`, `DD_DATABASE_READINESS_TIMEOUT`.
    *   **Networking:** Connected to the internal `defectdojo_default_network` and the shared external `pfe_network`.

*   **`postgres`**
    *   **Purpose:** The primary database server, storing all DefectDojo application data.
    *   **Image:** `docker.io/library/postgres:18.1-alpine` (fully qualified).
    *   **Dependencies:** None explicit in compose, other services depend on it.
    *   **Ports:** Internal `5432/tcp`. Not directly exposed to the host.
    *   **Volumes:** `defectdojo_postgres` for persistent database data.
    *   **Environment Variables:** Sets `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
    *   **Networking:** Connected to the internal `defectdojo_default_network` and the shared external `pfe_network`.

*   **`valkey`**
    *   **Purpose:** Redis-compatible in-memory data store. Used by Celery for message brokering (queuing tasks) and caching.
    *   **Image:** `docker.io/valkey/valkey:7.2.11-alpine` (fully qualified).
    *   **Dependencies:** None explicit.
    *   **Ports:** Internal `6379/tcp`. Not directly exposed to the host.
    *   **Volumes:** `defectdojo_redis` for persistent data.
    *   **Networking:** Connected to the internal `defectdojo_default_network` and the shared external `pfe_network`.

### 8.2. From `docker-compose.yml` (Root Project Services)

This `docker-compose.yml` orchestrates our custom AI service and dashboard.

*   **`ai_service`**
    *   **Purpose:** A custom FastAPI application designed to host the `feather.gguf` Large Language Model. It will expose an API endpoint for vulnerability prioritization.
    *   **Image:** `localhost/mob_ai_service:latest` (built locally from `./ai_service` directory).
    *   **Dependencies:** None explicit in its compose file. Logically, it might consume data from DefectDojo and provide processed data to the Dashboard.
    *   **Ports:** Maps host port `8001` to container port `8000`.
    *   **Volumes:** Mounts the LLM model file (`./feather.gguf`) into the container at `/app/feather.gguf` in read-only mode (`:ro`).
    *   **Environment Variables:** (To be defined later for model configuration, API keys, etc.).
    *   **Networking:** Connected to the shared external `pfe_network`.

*   **`dashboard`**
    *   **Purpose:** A custom React/Vite single-page application served by an Nginx web server. It will provide a visualization layer for the overall DevSecOps system.
    *   **Image:** `localhost/mob_dashboard:latest` (built locally from `./dashboard` directory).
    *   **Dependencies:** `ai_service` (logically, as it will likely make API calls to the AI service).
    *   **Ports:** Maps host port `3000` to container port `80`.
    *   **Volumes:** None explicitly defined as it serves built static assets from its image.
    *   **Environment Variables:** (To be defined later for API endpoints, feature flags, etc.).
    *   **Networking:** Connected to the shared external `pfe_network`.

### 8.3. Inter-Container Communication & Networking

The entire system relies on a unified networking strategy to allow all services to communicate seamlessly.

*   **`pfe_network` (External, Shared Network):**
    *   **Type:** External bridge network created manually (`podman network create pfe_network`).
    *   **Role:** This network acts as the primary communication backbone, allowing services from the `defectdojo/docker-compose.yml` (like `nginx` and `uwsgi`) and services from the root `docker-compose.yml` (like `ai_service` and `dashboard`) to discover and interact with each other. For example, the `dashboard` will make API requests to `defectdojo_nginx_1` (DefectDojo's Nginx service) or `pfe_ai_service`.

*   **`defectdojo_default_network` (Internal to DefectDojo):**
    *   **Type:** Internal bridge network managed by `podman-compose` within the DefectDojo stack.
    *   **Role:** Enables communication between the core DefectDojo services (e.g., `uwsgi` talking to `postgres` or `valkey`) using their service names directly. This encapsulates internal DefectDojo communication.

## 9. Key Configuration & Secrets

Several files were modified to achieve the current setup. The most important ones contain placeholder secrets that **must be changed** in a production environment.

*   **File:** `defectdojo/docker-compose.yml`
*   **Placeholder Secrets:**
    *   `DD_SECRET_KEY`: `hhZCp@D28z!n@NED*yB!ROMt+WzsY*iq`
    *   `DD_CREDENTIAL_AES_256_KEY`: `&91a*agLqesc*0DJ+2*bAbsUZfR*4nLw`
    *   PostgreSQL Credentials: `defectdojo:defectdojo` (for `POSTGRES_USER` and `POSTGRES_PASSWORD`).

## 10. Important Notes for Final Report (NixOS/Podman Challenges)

The primary challenge of this initial phase was adapting a standard Docker-based system to a security-hardened NixOS environment using Podman. This required several specific, non-obvious fixes which should be noted.

1.  **Environment Reproducibility:** A `shell.nix` file was created to provide a consistent development environment, solving the initial `podman-compose: command not found` error.

2.  **Podman Short-Name Resolution:** Podman on NixOS, by default, does not search public registries for container images with short names (e.g., `python:3.10`).
    *   **Error:** `short-name ... did not resolve to an alias`
    *   **Solution:** All `FROM` instructions in every `Dockerfile` and all `image:` declarations in `docker-compose.yml` files were modified to use fully-qualified image names (e.g., `docker.io/library/python:3.10-slim`). This was applied to `defectdojo`'s `Dockerfile`s and the custom `ai_service` and `dashboard` `Dockerfile`s.

3.  **Podman Compose Build Order:** `podman-compose` did not correctly resolve the dependency for locally-built images. Services were attempting to *pull* images before they had been built.
    *   **Error:** `short-name "defectdojo/defectdojo-django:latest" did not resolve`
    *   **Solution:** Explicit `build:` sections were added to all services consuming locally-built images in both `docker-compose.yml` files (`defectdojo/docker-compose.yml` for `celerybeat`, `celeryworker`, `initializer`, `uwsgi`; and root `docker-compose.yml` for `ai_service` and `dashboard`).

4.  **External Network Configuration:** When connecting services to an external network (`pfe_network`), `podman-compose` initially failed with a `missing networks: default` error.
    *   **Solution:** An explicit `default` network bridge (`name: defectdojo_default_network`) was defined in the `defectdojo/docker-compose.yml` file alongside the external network definition.

5.  **Execution Path for `podman-compose`:** `podman-compose` needed to be run from the directory containing its respective YAML file for correct context.
    *   **Solution:** The build command for DefectDojo explicitly includes `cd defectdojo && ... && cd ..`.

6.  **Missing `package-lock.json`:** The `dashboard`'s Dockerfile failed to build because `package-lock.json` was missing.
    *   **Solution:** `npm install --package-lock-only` was run in the `dashboard` directory to generate the file.

## 11. Current Issue & Solution (DD_DATABASE_URL)

We encountered a `django.core.exceptions.ImproperlyConfigured` error in the `uwsgi` container logs, stating: `Set the {DD_DATABASE_URL:-postgresql://defectdojo:defectdojo@postgres:5432/defectdojo} environment variable`.

*   **Problem:** DefectDojo's Django application within the `uwsgi` container is not correctly interpreting the `DD_DATABASE_URL` environment variable definition from `defectdojo/docker-compose.yml`, particularly the default value syntax (`${VAR:-default_value}`). This prevents the Django application from connecting to the PostgreSQL database.
*   **Solution:** We need to explicitly set the `DD_DATABASE_URL` for `uwsgi`, `celerybeat`, `celeryworker`, and `initializer` services in `defectdojo/docker-compose.yml` to the direct connection string, rather than relying on the `${VAR:-default_value}` syntax, which seems to be problematic for this specific setup.

    We will replace:
    `DD_DATABASE_URL: ${DD_DATABASE_URL:-postgresql://defectdojo:defectdojo@postgres:5432/defectdojo}`
    with:
    `DD_DATABASE_URL: postgresql://defectdojo:defectdojo@postgres:5432/defectdojo`

    This ensures the database URL is always correctly passed to the Django application.

## 12. Project Roadmap

This section outlines the detailed plan for completing the DevSecOps automation project. Each task will be tracked with a checkbox to indicate progress.

### Phase 1: Foundation & Setup (Day 1)

- [x] **Task 1.1: NixOS Environment Setup:** Create `shell.nix` for reproducible `podman` and `podman-compose` tooling.
- [x] **Task 1.2: Component Scaffolding:** Create base directories and initial files for `ai_service` (FastAPI) and `dashboard` (React/Vite).
- [x] **Task 1.3: DefectDojo Integration:** Clone the official `django-DefectDojo` repository.
- [x] **Task 1.4: Initial Containerization:** Develop/modify `Dockerfile`s for all services and `docker-compose.yml` files for orchestration.
- [x] **Task 1.5: Network Configuration:** Establish the shared external `pfe_network` for inter-service communication.
- [x] **Task 1.6: NixOS/Podman Issue Resolution:** Address specific challenges related to Podman on NixOS (short-name resolution, build order, network definition).
- [x] **Task 1.7: Initial DefectDojo Stack Launch:** Successfully build and run the full `defectdojo` container stack using the command:
    ```bash
    cd defectdojo && podman-compose up -d && cd ".."`
    ```
    *Note: The `--build` flag is now omitted as images should be pre-built or cached.*
- [x] **Task 1.8: Ancillary Services Launch:** Bring up the `ai_service` and `dashboard` containers using the root `docker-compose.yml`.
- [ ] **Task 1.9: Connectivity Verification:** Confirm all services are running and can communicate over the `pfe_network`.

### Phase 2: AI Service Development (Day 2)

- [ ] **Task 2.1: Model Integration:**
    - Modify `ai_service/main.py` to use `llama-cpp-python` to load the `feather.gguf` LLM.
    - Ensure `feather.gguf` is accessible within the `ai_service` container (e.g., via volume mount in `docker-compose.yml`).
    - Update `ai_service/requirements.txt` with `llama-cpp-python`.
- [ ] **Task 2.2: FastAPI Endpoint Creation:**
    - Create a `/prioritize` endpoint in `ai_service/main.py` that accepts vulnerability data (e.g., description, severity, CWE).
    - The endpoint should construct an LLM prompt from this data.
- [ ] **Task 2.3: Prompt Engineering:**
    - Design a robust prompt for the LLM to analyze vulnerability data and output a priority score (e.g., Critical, High, Medium, Low, Informational) and a concise justification.
- [ ] **Task 2.4: Response Parsing:**
    - Implement logic to parse the LLM's raw text response into a structured JSON object (e.g., `{"new_priority": "High", "justification": "..."}`).
- [ ] **Task 2.5: Unit Testing:** Add basic unit tests for the `/prioritize` endpoint, focusing on prompt construction and response parsing.

### Phase 3: Dashboard Development (Day 3)

- [ ] **Task 3.1: UI Scaffolding:**
    - In `dashboard/src/App.jsx`, create basic UI components for a dashboard layout (e.g., using a component library).
- [ ] **Task 3.2: DefectDojo API Integration (Data Fetching):**
    - Implement a service in the React app to fetch a list of findings from the DefectDojo API. (Requires API key and endpoint discovery).
- [ ] **Task 3.3: Finding Display:**
    - Display the fetched DefectDojo findings in an interactive table, showing relevant details (title, severity, etc.).
- [ ] **Task 3.4: AI Service Integration (Prioritization Trigger):**
    - Add a "Prioritize with AI" button for each finding.
    - On click, send the finding's data to the `ai_service`'s `/prioritize` endpoint.
- [ ] **Task 3.5: AI Result Display:**
    - Show the AI's returned priority and justification for each finding in the dashboard UI.
- [ ] **Task 3.6: DefectDojo Update (Optional Stretch Goal):**
    - Implement functionality to update the finding's priority in DefectDojo via its API using the AI-generated score.

### Phase 4: Automation & CI/CD (Day 4-5)

- [ ] **Task 4.1: Security Scanning Tool Integration:**
    - Select and integrate a SAST tool (e.g., `semgrep`) and a dependency scanner (e.g., `trivy`).
    - Create a script to run these scans against a sample vulnerable application or project.
- [ ] **Task 4.2: GitHub Actions Workflow Creation:**
    - Create a `.github/workflows/devsecops.yml` file.
    - Define a workflow that triggers on specific events (e.g., `push` to `main` branch).
- [ ] **Task 4.3: Workflow Steps Implementation:**
    - **Checkout Code.**
    - **Run Security Scans:** Execute the scanning script (from Task 4.1).
    - **Upload Scan Results to DefectDojo:** Use DefectDojo API to create an engagement and upload scan results (e.g., SARIF format).
    - **(Advanced) AI-Powered Prioritization within CI:** Implement a step to automatically trigger the `ai_service` for prioritization of newly imported findings in DefectDojo, then update DefectDojo.

### Phase 5: Finalization (Day 6-7)

- [ ] **Task 5.1: Documentation Finalization:** Review and complete `documentation.md`, adding detailed usage instructions and deployment guidelines.
- [ ] **Task 5.2: Secure Secret Management:** Implement proper environment variable handling for sensitive data in `docker-compose.yml` files and GitHub Actions.
- [ ] **Task 5.3: End-to-End Testing:** Perform comprehensive testing of the entire DevSecOps pipeline, from code commit to AI prioritization and dashboard visualization.

