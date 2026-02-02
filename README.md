# DevSecOps Automation Project: Windows + Docker Desktop Guide

This guide provides instructions for Windows users leveraging Docker Desktop to set up and run the DevSecOps automation project. By following these steps, you will be able to launch all project services, including OWASP DefectDojo, the AI vulnerability prioritization service, and the React dashboard, reaching the same functional state as Phase 1 through Phase 3 of the project development.

##Step 1. Introduction

This project integrates OWASP DefectDojo for vulnerability management with a custom AI service for intelligent vulnerability prioritization, visualized through a React-based web dashboard. This guide focuses on getting the entire stack running efficiently on a Windows machine using Docker Desktop.

### Step  2: Create the Shared Network

The project services communicate over a shared Docker network. Create this network:

```bash
docker network create pfe_network
```

### Step  3: Build and Run DefectDojo Stack

Navigate into the `defectdojo` directory and use `docker compose` to build and launch the DefectDojo services. This might take a while on the first run as it downloads images and builds custom ones.

```bash
cd defectdojo
docker compose up --build -d
cd ..
```
**Note:** The `initializer` container will run and exit after setting up the database and creating the initial admin user. It will print the generated admin password in its logs if not explicitly set via environment variables. To retrieve it, run `docker logs defectdojo_initializer_1` (or whatever the initializer container name is, you can find it with `docker ps -a`). Look for "Admin password:".

### Step  4: Build and Run AI Service & Dashboard

Now, build and launch the custom AI service and dashboard from the root of the project.

```bash
docker compose up --build -d ai_service dashboard
```

### Step  5: Verify Running Containers

You can check if all containers are running using:

```bash
docker ps
```
You should see containers for `dd_postgres`, `dd_valkey`, `dd_uwsgi`, `dd_celerybeat`, `dd_celeryworker`, `dd_nginx`, `pfe_ai_service`, and `pfe_dashboard`.

## 4. Accessing Services

Once all services are up, you can access them via your web browser:

*   **DefectDojo UI:** [http://localhost:8080](http://localhost:8080)
    *   **Login:** Use `admin` as the username and the password you retrieved from the `initializer` container logs.
*   **AI Service API:** [http://localhost:8001](http://localhost:8001) (This is an API endpoint, not a UI.)
*   **Dashboard UI:** [http://localhost:3000](http://localhost:3000)

## 5. Completing Phase 1 to Phase 3

By following the steps above, you will have successfully set up the project environment, launched all necessary containers, and made the DefectDojo, AI Service, and Dashboard accessible. This state corresponds to the completion of:

*   **Phase 1: Foundation & Setup**
*   **Phase 2: AI Service Development**
*   **Phase 3: Dashboard Development** (including AI prioritization and updating DefectDojo findings)

You can now interact with the dashboard, fetch findings from DefectDojo, trigger AI prioritization, and see the results reflected both in the dashboard and back in DefectDojo.

### Troubleshooting Tip: Line Endings

If you encounter issues with shell scripts inside containers (e.g., `/bin/bash^M: bad interpreter`), it might be due to Windows-style line endings. While `docker compose` usually handles this, you can manually convert scripts if needed. Inside a running container, you might use `dos2unix <script_name>`, or ensure your Git configuration handles line endings appropriately on checkout (`git config --global core.autocrlf input`).

### Next Steps: Verify DefectDojo API Key for Dashboard Integration

The dashboard is pre-configured with a placeholder for the DefectDojo API key. To ensure full functionality (especially for updating findings), you will need to verify or update this key.

1.  Log in to your DefectDojo instance at [http://localhost:8080](http://localhost:8080).
2.  Click on your username in the top right corner and select `API v2 Key`.
   Generate a new key and copy it.
4.  Open `dashboard/src/api.js` and ensure the `DEFECTDOJO_API_KEY` constant matches your newly generated key.

    ```javascript
    const DEFECTDOJO_API_KEY = 'YOUR_GENERATED_API_KEY'; // Ensure this matches your key
    ```

5.  If you changed the `DEFECTDOJO_API_KEY` in `dashboard/src/api.js`, you will need to rebuild the `dashboard` image and restart its container for the changes to take effect:

    ```bash
    docker compose up --build -d dashboard
    ```
