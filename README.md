# hospital-management-system
A single-tenant Hospital Information Management System for Nigerian Federal Teaching Hospitals, covering the patient journey from registration to nursing, billing/NHIA claims, pharmacy, laboratory, and 12+ modules. Each hospital runs independently, with Go handling core workflows and Python/FastAPI managing HL7/FHIR interoperability.


## Repository layout

```text
backend/       Go core and Python interoperability services
frontend/      React application
infra/         Infrastructure configuration
docs/          Specifications, decisions, guides and audit records
```

Run Docker Compose from the repository root. The root `AGENTS.md` contains
assistant guardrails; existing numbered specifications remain in `docs/`.

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Project requirements](docs/requirements/PRD.md) and [recorded decisions](docs/requirements/ASSUMPTIONS.md)
- [API route design](docs/api/10_API_ROUTES.md) and [operations endpoints](docs/api/BACKEND_OPERATIONS_ROUTES.md)
- [Authentication security and deployment](docs/security/AUTHENTICATION_SECURITY.md)
- [Task checklist](docs/project/TASKS.md) and [live integration scope](docs/project/PREVIEW_INTEGRATION.md)
- [Project audit](docs/audits/PROJECT_AUDIT.md), [remediation](docs/audits/AUDIT_FIXES.md) and [PR merge review](docs/audits/PR_MERGE_AUDIT.md)
