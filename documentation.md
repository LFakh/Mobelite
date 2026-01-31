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

## 4. System Architecture

The system is composed of three primary services, orchestrated with two `podman-compose` files.

### 4.1. Components

1.  **`defectdojo`:** The core vulnerability management platform. It's a complex application composed of multiple services itself (nginx, uwsgi, celery workers, postgres database, etc.).
    *   **Source:** Cloned from the official [django-DefectDojo GitHub repository](https://github.com/DefectDojo/django-DefectDojo).
    *   **Orchestration:** Managed by `defectdojo/docker-compose.yml`.

2.  **`ai_service`:** A custom-built FastAPI service that will host the `feather.gguf` Large Language Model. This service will eventually receive vulnerability data and return prioritization scores.
    *   **Source:** Created in the `ai_service/` directory.
    *   **Orchestration:** Managed by the root `docker-compose.yml`.

3.  **`dashboard`:** A custom-built React + Vite single-page application for visualizing data. It is served by an Nginx container.
    *   **Source:** Created in the `dashboard/` directory.
    *   **Orchestration:** Managed by the root `docker-compose.yml`.

### 4.2. Networking

All containers across both `docker-compose` files are connected via a shared external Podman network.

*   **Network Name:** `pfe_network`
*   **Creation Command:** `podman network create pfe_network`
*   **Configuration:** Each service in both `docker-compose.yml` files is explicitly configured to join the `pfe_network`. This allows, for example, the `dashboard` to make API calls to `defectdojo` or the `ai_service`.

## 5. Key Configuration & Secrets

Several files were modified to achieve the current setup. The most important ones contain placeholder secrets that **must be changed** in a production environment.

*   **File:** `defectdojo/docker-compose.yml`
*   **Placeholder Secrets:**
    *   `DD_SECRET_KEY`: `hhZCp@D28z!n@NED*yB!ROMt+WzsY*iq`
    *   `DD_CREDENTIAL_AES_256_KEY`: `&91a*agLqesc*0DJ+2*bAbsUZfR*4nLw`
    *   PostgreSQL Credentials: `defectdojo:defectdojo`

## 6. Important Notes for Final Report (NixOS/Podman Challenges)

The primary challenge of this initial phase was adapting a standard Docker-based system to a security-hardened NixOS environment using Podman. This required several specific, non-obvious fixes which should be noted.

1.  **Environment Reproducibility:** A `shell.nix` file was created to provide a consistent development environment, solving the initial `podman-compose: command not found` error.

2.  **Podman Short-Name Resolution:** Podman on NixOS, by default, does not search public registries for container images with short names (e.g., `python:3.10`).
    *   **Error:** `short-name ... did not resolve to an alias`
    *   **Solution:** All `FROM` instructions in every `Dockerfile` and all `image:` declarations in `docker-compose.yml` files were modified to use fully-qualified image names (e.g., `docker.io/library/python:3.10-slim`).

3.  **Podman Compose Build Order:** `podman-compose` did not correctly resolve the dependency for the locally-built `defectdojo/defectdojo-django` image. Services were attempting to *pull* the image before it had been built by the `uwsgi` service.
    *   **Error:** `short-name "defectdojo/defectdojo-django:latest" did not resolve`
    *   **Solution:** The `defectdojo/docker-compose.yml` file was modified to add an explicit `build:` section to every service that depends on this image (`celerybeat`, `celeryworker`, `initializer`), forcing each to build it locally.

4.  **External Network Configuration:** When connecting services to an external network (`pfe_network`), `podman-compose` failed with a `missing networks: default` error.
    *   **Solution:** An explicit `default` network bridge was defined in the `defectdojo/docker-compose.yml` file alongside the external network definition.

5.  **Execution Path:** `podman-compose` failed to find the Dockerfiles when run from the root directory due to relative path issues.
    *   **Solution:** The build command must be run from *within* the `defectdojo/` directory.

## 7. Project Roadmap

This section outlines the detailed plan for completing the DevSecOps automation project. Each task will be tracked with a checkbox to indicate progress.

### Phase 1: Foundation & Setup (Day 1 - Current)

- [x] **Task 1.1: NixOS Environment Setup:** Create `shell.nix` for reproducible `podman` and `podman-compose` tooling.
- [x] **Task 1.2: Component Scaffolding:** Create base directories and initial files for `ai_service` (FastAPI) and `dashboard` (React/Vite).
- [x] **Task 1.3: DefectDojo Integration:** Clone the official `django-DefectDojo` repository.
- [x] **Task 1.4: Initial Containerization:** Develop/modify `Dockerfile`s for all services and `docker-compose.yml` files for orchestration.
- [x] **Task 1.5: Network Configuration:** Establish the shared external `pfe_network` for inter-service communication.
- [x] **Task 1.6: NixOS/Podman Issue Resolution:** Address specific challenges related to Podman on NixOS (short-name resolution, build order, network definition).
- [ ] **Task 1.7: Initial DefectDojo Stack Launch:** Successfully build and run the full `defectdojo` container stack using the command:
    ```bash
    cd defectdojo && podman-compose up -d && cd ..
    ```
    *Note: The `--build` flag is now omitted as images should be pre-built or cached.*
- [ ] **Task 1.8: Ancillary Services Launch:** Bring up the `ai_service` and `dashboard` containers using the root `docker-compose.yml`.
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

