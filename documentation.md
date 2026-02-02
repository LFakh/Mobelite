# DevSecOps Automation for AI-Powered Vulnerability Prioritization: Project Documentation

## 1. Overview

This document outlines the current state, architecture, and progress of the PFE project focused on creating a fully automated DevSecOps pipeline. The system integrates OWASP DefectDojo for vulnerability management with a custom AI service for intelligent vulnerability prioritization, visualized through a web dashboard.

## 2. Current State: Day 1 - Project Setup & Containerization

The initial project setup is complete. All major components have been scaffolded and configured for containerized deployment using Podman. The core DefectDojo application is ready to be built and launched.

**Progress Checklist:**
- [x] **Environment Setup:** A reproducible `shell.nix` file has been created to provide all necessary tooling (`podman`, `podman-compose`) for the NixOS environment.
- [x] **Component Scaffolding:** Placeholder applications for the `ai_service` (FastAPI) and `dashboard` (React) have been created.
- [x] **Vulnerability Management System:** The official OWASP DefectDojo application has been cloned and its configuration has been adapted for this project.
- [x] **Containerization:** `Dockerfile`s for all custom services and `docker-compose.yml` files for orchestration have been created and heavily modified to work within the specific constraints of the user's system.
- [x] **Launch DefectDojo Stack:** The final step of Day 1 is to build and run the DefectDojo containers using the command provided below.

## 3. Build Command

Run the following command from the project's root directory (`/home/fun/Desktop/Mob/`) in your own terminal. This will build and launch the entire DefectDojo stack. **Note:** This is a long-running process and may take 15-20 minutes on the first run.

```bash
cd defectdojo && podman-compose up --build -d && cd ..
```

Once this command completes successfully, you can proceed to the next steps.

## 4. Current State: Day 2 - AI Service Development

Day 2 focused on building out the core functionality of the `ai_service` to integrate the LLM for vulnerability prioritization.

**Progress Checklist:**
- [x] **Task 2.1: Model Integration:**
    - Modified `ai_service/main.py` to use `llama-cpp-python` to load the `feather.gguf` LLM.
    - Ensured `feather.gguf` is accessible within the `ai_service` container (via volume mount in `docker-compose.yml`).
    - Updated `ai_service/requirements.txt` with `llama-cpp-python`, `pytest`, `requests`, and `httpx`.
- [x] **Task 2.2: FastAPI Endpoint Creation:**
    - Created a `/prioritize` endpoint in `ai_service/main.py` that accepts vulnerability data (description, severity, CWE) via a Pydantic model.
    - The endpoint constructs an LLM prompt from this data.
- [x] **Task 2.3: Prompt Engineering:**
    - Designed a robust prompt for the LLM to analyze vulnerability data and output a priority score (Critical, High, Medium, Low, Informational) and a concise justification in a strict JSON format.
- [x] **Task 2.4: Response Parsing:**
    - Implemented logic to parse the LLM's raw text response, extracting the first valid JSON object and handling potential errors (e.g., malformed JSON, no JSON found).
    - Updated error responses to use `JSONResponse` with appropriate HTTP status codes (500).
- [x] **Task 2.5: Unit Testing:** Added basic unit tests (`ai_service/test_main.py`) for the `/prioritize` endpoint, focusing on mocking the LLM call, prompt construction, and robust response parsing.

## 5. Day 2 Summary: Commands and Tools Used

This section outlines the key commands and tools utilized during Day 2 for AI Service development.

*   **`read_file documentation.md`**: Used to understand the project roadmap and current state.
*   **`read_file ai_service/requirements.txt`**: Used to inspect existing dependencies.
*   **`replace ai_service/requirements.txt ...`**: Used to add `llama-cpp-python`, `pytest`, `requests`, and `httpx` dependencies.
*   **`read_file ai_service/main.py`**: Used to inspect the FastAPI application code.
*   **`write_file ai_service/main.py ...`**: Used repeatedly to fix syntax/indentation errors and apply new logic to `main.py`. This was preferred over `replace` for ensuring a clean state due to persistent issues with partial replacements.
*   **`read_file docker-compose.yml`**: Used to inspect Docker Compose configurations.
*   **`replace docker-compose.yml ...`**: Used to add a volume mount for `./ai_service:/app` to the `ai_service` service definition, enabling live code reloading.
*   **`replace ai_service/Dockerfile ...`**: Used to add the `--reload` flag to the `uvicorn` command, enabling automatic application reloading on code changes.
*   **`podman network inspect pfe_network`**: Used to verify the existence of the shared network.
*   **`podman-compose down`**: Used to stop and remove containers cleanly.
*   **`podman-compose up --build -d ai_service`**: Used to build and run the `ai_service` container, applying `Dockerfile` and `requirements.txt` changes.
*   **`podman-compose restart ai_service`**: Used to restart the `ai_service` container, applying `main.py` code changes due to the volume mount and `--reload` flag.
*   **`podman-compose logs ai_service`**: Crucial for debugging issues, inspecting LLM output, and identifying runtime errors (e.g., `IndentationError`, `SyntaxError`, JSON parsing errors).
*   **`curl -X POST -H "Content-Type: application/json" -d '...' http://localhost:8001/prioritize`**: Used extensively to test the `/prioritize` endpoint with various inputs and verify responses.
*   **`rm ai_service/test_main.py`**: Used to ensure a clean slate for the test file due to previous editing issues.
*   **`write_file ai_service/test_main.py ...`**: Used to create the test file with unit tests for the `/prioritize` endpoint.
*   **`podman-compose exec ai_service pytest /app/test_main.py`**: Used to run the unit tests inside the `ai_service` container.

## 8. System Architecture Details

This section provides a granular look at each container involved in the project, detailing their purpose, configurations, and interconnections.

### 8.1. System Architecture Diagram

Below is the Graphviz DOT content representing the system architecture. You can use an online Graphviz renderer (e.g., https://dreampuf.github.io/GraphvizOnline/) or a local Graphviz installation to visualize this diagram.

```dot
digraph Architecture {
    rankdir=LR;
    node [shape=box style="filled" fillcolor="lightgray"];

    subgraph cluster_defectdojo {
        label = "DefectDojo Stack";
        color = blue;

        dd_postgres [label="PostgreSQL\n(dd_postgres)" fillcolor="lightblue"];
        dd_valkey [label="Valkey/Redis\n(dd_valkey)" fillcolor="lightblue"];
        dd_uwsgi [label="DefectDojo Django App\n(dd_uwsgi)" fillcolor="lightgreen"];
        dd_celerybeat [label="Celery Beat\n(dd_celerybeat)" fillcolor="lightgreen"];
        dd_celeryworker [label="Celery Worker\n(dd_celeryworker)" fillcolor="lightgreen"];
        dd_nginx [label="DefectDojo Nginx\n(dd_nginx)" fillcolor="lightpink"];
    }

    pfe_ai_service [label="AI Service\n(pfe_ai_service)" fillcolor="gold"];
    pfe_dashboard [label="React Dashboard\n(pfe_dashboard)" fillcolor="orange"];

    # Connections within DefectDojo stack
    dd_uwsgi -> dd_postgres [label="DB access"];
    dd_uwsgi -> dd_valkey [label="Broker"];
    dd_celerybeat -> dd_postgres [label="DB access"];
    dd_celerybeat -> dd_valkey [label="Broker"];
    dd_celeryworker -> dd_postgres [label="DB access"];
    dd_celeryworker -> dd_valkey [label="Broker"];
    dd_nginx -> dd_uwsgi [label="HTTP/HTTPS proxy"];

    # Connections with custom services
    pfe_dashboard -> dd_nginx [label="DefectDojo API (http://localhost:8080)"];
    pfe_dashboard -> pfe_ai_service [label="AI Prioritization API (http://localhost:8001)"];
}
```

### 8.2. Manual Podman Commands for DefectDojo

Due to persistent issues with `podman-compose`, the DefectDojo stack was manually started using individual `podman run` commands. This section lists the commands in the correct startup order.

1.  **Remove existing DefectDojo containers (if any):**
    ```bash
    podman rm -f dd_postgres dd_valkey dd_initializer dd_uwsgi dd_celerybeat dd_celeryworker dd_nginx
    ```

2.  **Start PostgreSQL (dd_postgres):**
    ```bash
    podman run -d --name dd_postgres \\
      -e POSTGRES_DB=defectdojo \\
      -e POSTGRES_USER=defectdojo \\
      -e POSTGRES_PASSWORD=defectdojo \\
      -v defectdojo_postgres:/var/lib/postgresql/data \\
      --network pfe_network \\
      docker.io/library/postgres:18.1-alpine@sha256:b40d931bd0e7ce6eecc59a5a6ac3b3c04a01e559750e73e7086b6dbd7f8bf545
    ```

3.  **Start Valkey (dd_valkey):**
    ```bash
    podman run -d --name dd_valkey \\
      -v defectdojo_redis:/data \\
      --network pfe_network \\
      docker.io/valkey/valkey:7.2.11-alpine@sha256:9e483e0fe4c98b631b166b41d530c7ff1b8009a44f261bff28e9d1e2e27db58d
    ```

4.  **Run Initializer (dd_initializer):**
    ```bash
    podman run --rm --name dd_initializer \\
      -e DD_DATABASE_URL='postgresql://defectdojo:defectdojo@postgres:5432/defectdojo' \\
      -e DD_ADMIN_USER=admin \\
      -e DD_ADMIN_MAIL=admin@defectdojo.local \\
      -e DD_ADMIN_FIRST_NAME=Admin \\
      -e DD_ADMIN_LAST_NAME=User \\
      -e DD_INITIALIZE=true \\
      -e DD_SECRET_KEY='hhZCp@D28z!n@NED*yB!ROMt+WzsY*iq' \\
      -e DD_CREDENTIAL_AES_256_KEY='&91a*agLqesc*0DJ+2*bAbsUZfR*4nLw' \\
      -e DD_DATABASE_READINESS_TIMEOUT=30 \\
      -e DD_CELERY_BROKER_URL='redis://dd_valkey:6379/0' \\
      -v /home/fun/Desktop/Mob/defectdojo/docker/extra_settings:/app/docker/extra_settings \\
      --network pfe_network \\
      --network defectdojo_default_network \\
      localhost/defectdojo/defectdojo-django:latest \\
      /wait-for-it.sh dd_postgres:5432 -- /entrypoint-initializer.sh
    ```

5.  **Start uWSGI (dd_uwsgi):**
    ```bash
    podman run -d --name dd_uwsgi \\
      -e DD_DEBUG=False \\
      -e DD_DJANGO_METRICS_ENABLED=False \\
      -e DD_DATABASE_URL='postgresql://defectdojo:defectdojo@postgres:5432/defectdojo' \\
      -e DD_CELERY_BROKER_URL='redis://dd_valkey:6379/0' \\
      -e DD_SECRET_KEY='hhZCp@D28z!n@NED*yB!ROMt+WzsY*iq' \\
      -e DD_CREDENTIAL_AES_256_KEY='&91a*agLqesc*0DJ+2*bAbsUZfR*4nLw' \\
      -e DD_DATABASE_READINESS_TIMEOUT=30 \\
      -v /home/fun/Desktop/Mob/defectdojo/docker/extra_settings:/app/docker/extra_settings \\
      -v defectdojo_media:/app/media \\
      --network pfe_network \\
      --network defectdojo_default_network \\
      localhost/defectdojo/defectdojo-django:latest \\
      /wait-for-it.sh dd_postgres:5432 -t 30 -- /entrypoint-uwsgi.sh
    ```

6.  **Start Celery Beat (dd_celerybeat):**
    ```bash
    podman run -d --name dd_celerybeat \\
      -e DD_DATABASE_URL='postgresql://defectdojo:defectdojo@postgres:5432/defectdojo' \\
      -e DD_CELERY_BROKER_URL='redis://dd_valkey:6379/0' \\
      -e DD_SECRET_KEY='hhZCp@D28z!n@NED*yB!ROMt+WzsY*iq' \\
      -e DD_CREDENTIAL_AES_256_KEY='&91a*agLqesc*0DJ+2*bAbsUZfR*4nLw' \\
      -e DD_DATABASE_READINESS_TIMEOUT=30 \\
      -v /home/fun/Desktop/Mob/defectdojo/docker/extra_settings:/app/docker/extra_settings \\
      --network pfe_network \\
      --network defectdojo_default_network \\
      localhost/defectdojo/defectdojo-django:latest \\
      /wait-for-it.sh dd_postgres:5432 -t 30 -- /entrypoint-celery-beat.sh
    ```

7.  **Start Celery Worker (dd_celeryworker):**
    ```bash
    podman run -d --name dd_celeryworker \\
      -e DD_DATABASE_URL='postgresql://defectdojo:defectdojo@postgres:5432/defectdojo' \\
      -e DD_CELERY_BROKER_URL='redis://dd_valkey:6379/0' \\
      -e DD_SECRET_KEY='hhZCp@D28z!n@NED*yB!ROMt+WzsY*iq' \\
      -e DD_CREDENTIAL_AES_256_KEY='&91a*agLqesc*0DJ+2*bAbsUZfR*4nLw' \\
      -e DD_DATABASE_READINESS_TIMEOUT=30 \\
      -v /home/fun/Desktop/Mob/defectdojo/docker/extra_settings:/app/docker/extra_settings \\
      -v defectdojo_media:/app/media \\
      --network pfe_network \\
      --network defectdojo_default_network \\
      localhost/defectdojo/defectdojo-django:latest \\
      /wait-for-it.sh dd_postgres:5432 -t 30 -- /entrypoint-celery-worker.sh
    ```

8.  **Start Nginx (dd_nginx):**
    ```bash
    podman run -d --name dd_nginx \\
      -p 8080:8080 -p 8443:8443 \\
      -e NGINX_METRICS_ENABLED=false \\
      -e DD_UWSGI_HOST=dd_uwsgi \\
      -e DD_UWSGI_PORT=3031 \\
      -v defectdojo_media:/usr/share/nginx/html/media \\
      --network pfe_network \\
      --network defectdojo_default_network \\
      localhost/defectdojo/defectdojo-nginx:latest
    ```

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
*   **Solution:** We have explicitly set the `DD_DATABASE_URL` for `uwsgi`, `celerybeat`, `celeryworker`, and `initializer` services in `defectdojo/docker-compose.yml` to the direct connection string, rather than relying on the `${VAR:-default_value}` syntax, which was problematic. This ensures the database URL is always correctly passed to the Django application.

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
- [x] **Task 1.9: Connectivity Verification:** Confirm all services are running and can communicate over the `pfe_network`.

### Phase 2: AI Service Development (Day 2)

- [x] **Task 2.1: Model Integration:**
    - Modified `ai_service/main.py` to use `llama-cpp-python` to load the `feather.gguf` LLM.
    - Ensured `feather.gguf` is accessible within the `ai_service` container (via volume mount in `docker-compose.yml`).
    - Updated `ai_service/requirements.txt` with `llama-cpp-python`, `pytest`, `requests`, and `httpx`.
- [x] **Task 2.2: FastAPI Endpoint Creation:**
    - Created a `/prioritize` endpoint in `ai_service/main.py` that accepts vulnerability data (description, severity, CWE) via a Pydantic model.
    - The endpoint constructs an LLM prompt from this data.
- [x] **Task 2.3: Prompt Engineering:**
    - Designed a robust prompt for the LLM to analyze vulnerability data and output a priority score (Critical, High, Medium, Low, Informational) and a concise justification in a strict JSON format.
- [x] **Task 2.4: Response Parsing:**
    - Implemented logic to parse the LLM's raw text response, extracting the first valid JSON object and handling potential errors (e.g., malformed JSON, no JSON found).
    - Updated error responses to use `JSONResponse` with appropriate HTTP status codes (500).
- [x] **Task 2.5: Unit Testing:** Added basic unit tests (`ai_service/test_main.py`) for the `/prioritize` endpoint, focusing on mocking the LLM call, prompt construction, and robust response parsing.

### Phase 3: Dashboard Development (Day 3)

- [x] **Task 3.1: UI Scaffolding:**
    - In `dashboard/src/App.jsx`, create basic UI components for a dashboard layout (e.g., using a component library).
- [x] **Task 3.2: DefectDojo API Integration (Data Fetching):**
    - Implement a service in the React app to fetch a list of findings from the DefectDojo API. (Requires API key and endpoint discovery).
- [x] **Task 3.3: Finding Display:**
    - Display the fetched DefectDojo findings in an interactive table, showing relevant details (title, severity, etc.).
- [x] **Task 3.4: AI Service Integration (Prioritization Trigger):**
    - Add a "Prioritize with AI" button for each finding.
    - On click, send the finding's data to the `ai_service`'s `/prioritize` endpoint.
- [x] **Task 3.5: AI Result Display:**
    - Show the AI's returned priority and justification for each finding in the dashboard UI.
- [x] **Task 3.6: DefectDojo Update (Optional Stretch Goal):**
    - Implement functionality to update the finding's priority in DefectDojo via its API using the AI-generated score.

### Phase 4: Automation & CI/CD (Day 4)

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

### Phase 5: Finalization (Day 5)

- [ ] **Task 5.1: Documentation Finalization:** Review and complete `documentation.md`, adding detailed usage instructions and deployment guidelines.
- [ ] **Task 5.2: Secure Secret Management:** Implement proper environment variable handling for sensitive data in `docker-compose.yml` files and GitHub Actions.
- [ ] **Task 5.3: End-to-End Testing:** Perform comprehensive testing of the entire DevSecOps pipeline, from code commit to AI prioritization and dashboard visualization.