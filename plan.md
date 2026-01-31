Phase 1: Foundations & Discovery (Month 1)

  This phase is about understanding the tools and setting up the project environment.

   * 1.1: Master DefectDojo:
       * Install and configure a local instance of DefectDojo.
       * Deep-dive into its architecture, data model (Products, Engagements, Findings), and especially its API. Practice importing
         scanner reports manually.
   * 1.2: Environment Setup:
       * Initialize a Git repository.
       * Set up development environments for Python/Django (for the AI module) and JavaScript/React (for the dashboard).
       * Create a basic CI pipeline using GitHub Actions that runs linters for both backend and frontend code.
   * 1.3: Research & High-Level Design:
       * Research machine learning techniques for vulnerability prioritization. What data points are most predictive? (e.g., CVSS,
         CWE, asset value, scanner confidence, exploit availability).
       * Design the high-level architecture showing how the CI pipeline, security scanners, DefectDojo, the AI module, and the React
         dashboard will interact.

  Phase 2: Automated DevSecOps Pipeline (Month 2)

  The goal here is to get data flowing automatically into DefectDojo.

   * 2.1: Build a Target Application:
       * Create a simple web application with a few known vulnerabilities to act as a test subject.
   * 2.2: Integrate Security Scanners:
       * In your GitHub Actions workflow, add steps to run SAST (e.g., Semgrep) and Dependency Scanning (e.g., Trivy, Snyk) tools
         against the target application.
   * 2.3: Automate Reporting to DefectDojo:
       * Write scripts (e.g., Python scripts using the DefectDojo API) that are triggered in the CI pipeline to automatically push the
         generated security reports into the correct Product in DefectDojo.

  Phase 3: AI Prioritization Module (Months 3-4)

  This is the core AI development phase.

   * 3.1: Data Gathering & Feature Engineering:
       * Collect a dataset of vulnerabilities. You can use public datasets or the data you've gathered in DefectDojo.
       * Define the features for your model. This will likely be a vector containing information like [CVSS_Score, CWE_ID,
         Scanner_Confidence, Is_Exploitable, ...]
       * Define your target variable: what does "priority" mean? It could be a simple risk score (e.g., 1-100) or a category (e.g.,
         Critical, High, Medium, Low).
   * 3.2: Model Training & API Development:
       * Select, train, and test an initial ML model (e.g., a Gradient Boosting classifier) using Python with scikit-learn.
       * Wrap the trained model in a simple REST API using Django. This API should accept vulnerability data and return its calculated
         priority.
   * 3.3: Integration with DefectDojo:
       * Create a process (e.g., a periodic Django management command) that fetches new findings from DefectDojo, enriches them with
         the AI priority score via your new API, and updates them in DefectDojo (e.g., by adding a tag or updating a custom field).

  Phase 4: React Dashboard (Months 4-5)

  This phase is about visualizing the results for the security team.

   * 4.1: UI/UX Design:
       * Design a modern, intuitive dashboard. Key views would include a global list of prioritized vulnerabilities, filters (by
         product, severity, etc.), and a detailed view for each finding.
   * 4.2: Frontend Development:
       * Build the dashboard using React.
       * Implement components for the list, filters, and detail views.
   * 4.3: API Integration:
       * Connect the React frontend to the DefectDojo API to fetch and display the vulnerability data, including the AI-generated
         priority you saved in the previous phase.

  Phase 5: Evaluation & Finalization (Month 6)

  The final month is for testing, refinement, and documentation.

   * 5.1: Evaluate AI Performance:
       * Rigorously test the AI model's effectiveness. How does its prioritization compare to a human expert's? Use metrics like
         precision and recall.
       * Retrain and fine-tune the model based on your findings.
   * 5.2: Complete the CI/CD Chain:
       * Enhance your GitHub Actions workflow to be a true CI/CD pipeline, including steps for building, testing, and deploying the
         Django AI service and the React dashboard.
   * 5.3: Documentation & Handover:
       * Write thorough documentation for the project architecture, setup, and usage.
       * Prepare your final project report and presentation.

The project divides nicely into two main streams:

   * Intern 1 "Glissa" (Backend & AI Focus): Would own the AI/ML part. This includes Phase 3 (AI Module Development), the Python scripting for
     API interactions, and the data science aspects of evaluating the model (Task 5.1).
   * Intern 2 "LFakh" (DevOps & Frontend Focus): Would own the infrastructure and user interface. This includes Phase 2 (DevSecOps Pipeline),
     Phase 4 (React Dashboard), and setting up the complete CI/CD automation (Task 5.2).

  Both interns would collaborate heavily on Phase 1 (Discovery & Design) and Phase 5 (Final Documentation).
