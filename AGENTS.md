# Employee Management System (EMS) - AI Agent Guidelines

This document serves as the central rulebook for AI coding assistants and human developers working on the EMS codebase. It dictates code styles, structural patterns, and necessary commands.

---

## 1. Project Overview & Architecture

This project is a full-stack Employee Management System comprising a Spring Boot backend and a React/Vite frontend.

- **Backend**: Java 21, Spring Boot 3.5.10, Maven, MySQL/H2, Flyway, JWT, Lombok, MapStruct.
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Radix UI, React Hook Form, Zod.

### Architecture Highlights

- **Feature-based Packaging (Backend)**: Group files by domain logic instead of technical layer. For example, the `announcement` feature contains its own `controller`, `dto`, `entity`, `service`, and `enums` directories.
- **Strict Typing (Frontend & Backend)**: Both ends heavily rely on static typing (TypeScript and Java). Data transfers must be modeled using strictly validated DTOs and interfaces.

---

## 2. Directory Structure

```text
ems-employee-management-system/
├── backend/                  # Spring Boot Java Application
│   ├── src/main/java/        # Source code (feature-based packages)
│   ├── src/main/resources/   # App properties and Flyway migrations
│   └── pom.xml               # Maven dependencies and build config
├── frontend/                 # React SPA
│   ├── src/                  # Source code (components, hooks, utilities)
│   ├── package.json          # npm scripts and dependencies
│   ├── eslint.config.js      # Flat ESLint configuration
│   └── vite.config.ts        # Vite build configuration
├── docker/                   # Docker configurations
└── docker-compose.yml        # Multi-container orchestration
```

---

## 3. Build, Lint, and Test Commands

### 3.1 Backend Commands (Maven Wrapper)

All backend commands must be executed within the `backend/` directory.

- **Start Dev Server**: `./mvnw spring-boot:run` (Or use `./dev-hot-reload.sh` for hot-reloading).
- **Compile and Build**: `./mvnw clean install` (Builds the `.jar`, running all tests).
- **Run All Tests**: `./mvnw test` (Uses H2 in-memory database configuration).
- **Run a Single Test**: `./mvnw -Dtest="TestClassName" test` (e.g., `./mvnw -Dtest="LeaveServiceImplTest" test`).

### 3.2 Frontend Commands (npm)

All frontend commands must be executed within the `frontend/` directory.

- **Start Dev Server**: `npm run dev` (Starts Vite).
- **Build for Production**: `npm run build` (Runs `tsc -b && vite build`).
- **Lint Codebase**: `npm run lint` (Checks rules using `eslint.config.js`).
- **Fix Lint Issues**: `npm run lint:fix`.
- **Preview Production Build**: `npm run preview`.

---

## 4. Code Style Guidelines

### 4.1 Frontend (TypeScript & React)

- **Framework Choices**: React 19 (functional components, hooks), Tanstack React Query for server states.
- **Component Styling**: Use TailwindCSS and Radix UI.
- **ESLint Enforcements**:
  - **No Hardcoded Strings in JSX**: Text displayed to users must not be hardcoded as direct JSX children (`react/jsx-no-literals`). Use constants or translation files. Props (e.g., `className`) are ignored.
  - **Code Complexity**: Limit functions to a maximum nesting depth of 4 (`max-depth`) and a maximum of 4 parameters (`max-params`). Group parameters into objects if necessary.
  - **Strict Comparisons**: Always use `===` and `!==` (`eqeqeq`).
  - **Logging**: `console.log` is strictly forbidden. Use `console.warn` or `console.error` if logging is necessary.
  - **Component Structure**: Do not define components within other components (`react/no-unstable-nested-components`).
- **Data Validation**: Always use Zod for validating API responses and Form inputs (via `@hookform/resolvers/zod`).

### 4.2 Backend (Java & Spring Boot)

- **Lombok Usage**: Extensively use `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, and `@AllArgsConstructor` to eliminate boilerplate. Use `@RequiredArgsConstructor` for constructor dependency injection.
  - _Warning_: Do **not** use `@Data` on `@Entity` classes to prevent circular dependencies in `toString()`, `equals()`, and `hashCode()`.
- **Entities & Database**:
  - All domain entities must extend `BaseEntity` (which handles common audit fields).
  - Explicitly declare constraints on `@Column` (e.g., `nullable = false`, `length = 255`).
  - Index commonly queried fields using `@Table(indexes = {...})`.
  - Do not let Hibernate create the schema automatically. All database changes must be tracked via Flyway migrations (`db/migration`).
- **Controllers & APIs**:
  - Always return responses wrapped in the standard `ApiResponse<T>` form.
  - Apply method-level security using `@PreAuthorize` (e.g., `RoleAuthorization.HAS_ADMIN_ONLY`).
  - Provide Swagger documentation on every endpoint via `@Operation` and `@Tag`.
- **DTOs & Mapping**:
  - Define separate Request and Response DTOs inside a `dto` package.
  - Map Entities to DTOs and vice-versa using MapStruct (`@Mapper`).
  - Apply `jakarta.validation` annotations (like `@NotBlank`, `@NotNull`, `@Size`) directly to the DTOs.

---

## 5. Naming Conventions

- **Variables, Properties & Functions**: `camelCase` (e.g., `getUserById`, `emailDeliveryRequested`).
- **Classes, Interfaces & Types**: `PascalCase` (e.g., `AnnouncementController`, `UserProfile`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `CREATE_SUCCESS_MESSAGE`, `MAX_RETRIES`).
- **File Names**:
  - **Backend**: Match the Java class name exactly (`PascalCase.java`).
  - **Frontend**: `PascalCase.tsx` for React Components, `kebab-case.ts` or `camelCase.ts` for utilities/hooks. Use `index.ts` for barrel exports.

---

## 6. Types and Error Handling

### 6.1 Strict Typing

- Provide explicit return types for all public methods (Java) and utility functions (TypeScript).
- Do not use `any` in TypeScript. Use `unknown` or define a precise generic/interface.

### 6.2 Global Error Handling

- **Backend**: Use `@RestControllerAdvice` to catch exceptions globally. Translate database and validation exceptions into standardized HTTP responses using `ApiResponse.error()`. Never leak raw stack traces to the frontend.
- **Frontend**: Handle API failures gracefully. Wrap form actions and data-fetching hooks with appropriate error feedback (using toast notifications via `sonner`).

---

## 7. AI Agent Directives

1. **Context Awareness**: Always examine existing files (e.g., `BaseEntity.java`, `ApiResponse.java`, `eslint.config.js`) before implementing new features to ensure exact structural alignment.
2. **Minimal Intrusiveness**: Avoid refactoring large unrelated blocks of code. Do not update or modify configurations (`pom.xml`, `package.json`, `eslint.config.js`) unless specifically requested.
3. **Paths**: Use absolute paths or correct relative paths when making file edits.
4. **Git Operations**: Never run arbitrary git commits unless directly instructed by the user.
