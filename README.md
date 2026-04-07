# EMS - Employee Management System

[![CI](https://github.com/YOUR_USERNAME/ems-employee-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ems-employee-management-system/actions/workflows/ci.yml)
[![Code Quality](https://github.com/YOUR_USERNAME/ems-employee-management-system/actions/workflows/code-quality.yml/badge.svg)](https://github.com/YOUR_USERNAME/ems-employee-management-system/actions/workflows/code-quality.yml)

A full-stack employee management system built with Spring Boot and React.

## 🚀 Quick Start

### With Docker (Recommended)
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ems-employee-management-system.git
cd ems-employee-management-system

# Copy environment file
cp .env.example .env

# Start all services (Production-like)
docker-compose up -d
```

### With Docker (Development / Hot-Reload)
Sử dụng `docker-compose.override.yml` để kích hoạt hot-reload cho cả Frontend (Vite) và Backend (Spring Boot). Tránh việc phải build lại file JAR mỗi khi thay đổi code.

```bash
# Khởi chạy dev với override (áp dụng hot-reload)
docker compose up --build
# Hoặc lệnh tường minh: docker compose -f docker-compose.yml -f docker-compose.override.yml up --build

# Rebuild service riêng lẻ
docker compose build backend

# Xem logs của service (ví dụ: backend)
docker compose logs -f backend

# Validate nhanh Docker stack (Windows PowerShell)
powershell -ExecutionPolicy Bypass -File ./scripts/validate-docker.ps1
```

**Lưu ý (Đặc tính & Rủi ro):**
- **WSL2/Windows**: Bind-mount có thể chậm trên Windows I/O. Frontend đã cấu hình anonymous volume cho `/app/node_modules` giúp tăng tốc Vite và tránh xung đột quyền/hệ điều hành.
- **Môi trường**: Việc chạy source code qua wrapper `./mvnw` trong container có thể đem lại khác biệt nhỏ với file JAR được build từ GitHub Actions/Production. Maven dependency có cache qua volume dùng chung.
- Hãy dùng `.env` dev với biến môi trường hợp lệ (`VITE_API_URL`, database mock...).

### Access Application

Mở trình duyệt:

- **Frontend** (React/Vite) : http://localhost:5173
- **Backend** (Spring Boot) : http://localhost:8080
- **Swagger Documentation** : http://localhost:8080/swagger-ui.html

### Local 2FA End-to-End Test

Để test xác thực 2 lớp trên local (FE + BE API thật):

1. Đăng nhập vào hệ thống.
2. Mở **Settings → Security (2FA)** và bật 2FA.
3. Quét QR code bằng ứng dụng Authenticator (Google Authenticator/Authy) hoặc nhập secret key thủ công.
4. Nhập mã 6 số để xác nhận bật 2FA và lưu recovery codes.
5. Đăng xuất, sau đó đăng nhập lại bằng tài khoản vừa bật 2FA.
6. Hệ thống sẽ yêu cầu mã OTP 2FA trước khi hoàn tất đăng nhập.

> Lưu ý: frontend gọi backend qua `VITE_API_URL` (mặc định `http://localhost:8080/api/v1`).

### Without Docker
```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

📖 **Full Documentation**: See [DOCKER.md](DOCKER.md) for detailed setup guide.

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
