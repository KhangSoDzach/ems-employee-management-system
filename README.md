# EMS - Employee Management System

A full-stack employee management system built with Spring Boot and React.

## Tech Stack

**Backend:**
- Java 21
- Spring Boot 3.5.10
- Spring Security (JWT Authentication)
- Spring Data JPA / Hibernate
- MySQL Database
- Flyway (Database Migrations)
- Swagger/OpenAPI (API Documentation)
- Maven

**Frontend:**
- React 19
- TypeScript
- Vite
- TanStack Query (React Query)
- React Router
- Radix UI Components
- Tailwind CSS

## Agent Prompt Template

When invoking an AI agent to work on this repository, **start every prompt with these two lines** (copy-paste exactly):

```
"Strictly follow .agent/skills.manifest.json and only use folders under .agent/active-skills/ unless the user explicitly approves additional skills."

"If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."
```

### Why These Rules?

These rules ensure the agent:
- Uses only curated, project-relevant skills
- Maintains consistent code quality and patterns
- Asks permission before introducing new patterns or approaches
- Follows project-specific conventions

### Quick Start for Agents

See [.agent/prompt-templates.md](.agent/prompt-templates.md) for ready-to-use prompt templates covering:
- Feature implementation
- Bug fixes
- API endpoints
- Database migrations
- Security tasks
- Testing
- Deployment
- And more...

### Active Skills

View the complete list of active skills in [.agent/skills.index.md](.agent/skills.index.md)

**Categories:**
- Core Development (Java, Architecture, API Design)
- Database (Design, Migrations, SQL)
- Security & Auth (JWT, API Security, Secrets)
- Testing (Unit, Integration, TDD)
- Frontend (React, TypeScript)
- DevOps (Docker, CI/CD, Monitoring)

---
