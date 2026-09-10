# ProjectHub — Project Management System

A full-stack, Jira-like project management system built with **NestJS** (backend), **PostgreSQL** (database), and **Next.js / React** (frontend).

It supports role-based access (Admin / Member), projects, kanban boards, issues with status & priority, comments, dashboards with stats, and an audit-style activity log.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repo Structure](#repo-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Environment Variables](#1-environment-variables)
  - [2. Database Setup](#2-database-setup)
  - [3. Install & Run](#3-install--run)
- [Database & Migrations](#database--migrations)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Role & Permission Model](#role--permission-model)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Scripts Reference](#scripts-reference)

---

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Backend  | NestJS 11, TypeORM, Passport (JWT), PostgreSQL           |
| Frontend | Next.js 16, React 19, React Query, Tailwind CSS v4, zod |
| Auth     | JWT (bearer token) + bcrypt password hashing            |
| Docs     | Swagger (OpenAPI)                                        |

---

## Repo Structure

```
project-management/
├── backend/                  # NestJS API
│   └── src/
│       ├── auth/             # JWT auth, login/register, guards
│       ├── users/            # Users + role management
│       ├── projects/         # Project CRUD
│       ├── project-members/  # Membership management
│       ├── issues/           # Issue CRUD, filtering, global issues
│       ├── comments/         # Comments on issues
│       ├── dashboard/        # Project statistics
│       ├── activity/         # Audit activity log
│       ├── health/           # Health check endpoint
│       ├── common/           # Shared select helpers
│       ├── filters/          # Global exception filter
│       └── main.ts           # Bootstrap, CORS, ValidationPipe, Swagger
├── frontend/                 # Next.js SPA
│   └── src/
│       ├── app/              # Routes/pages (app router)
│       ├── components/       # Reusable UI + feature components
│       ├── context/          # Auth context
│       ├── lib/              # API client, types, hooks, constants
│       └── ...
├── package.json              # Root scripts (concurrently dev)
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) **20+** (npm included)
- [PostgreSQL](https://www.postgresql.org/) **14+** running locally
- Optional: [Railway](https://railway.app/) / Vercel for cloud deployment

---

## Getting Started

### 1. Environment Variables

Backend — create `backend/.env`:

```env
# Database (local)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=project_management

# Optional: use a full URL instead of the individual DB_* vars (cloud/SSL)
# DATABASE_URL=postgres://user:pass@host:5432/db

# JWT signing secret — REQUIRED, use a long random string
JWT_SECRET=change-me-to-a-long-random-string

# Port (defaults to 3001)
PORT=3001

# Allowed CORS origin for the frontend (optional)
FRONTEND_URL=http://localhost:3000
```

Frontend — create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

> `.env`, `.env.local`, `dist/`, `.next/` and `node_modules/` are git-ignored. Real values are never committed.

### 2. Database Setup

```sql
CREATE DATABASE project_management;
```

The app uses TypeORM with `synchronize: true`, so tables are created automatically on startup — no manual migration step is required in development. See [Database & Migrations](#database--migrations).

### 3. Install & Run

Install dependencies for the whole workspace:

```bash
npm install
```

Run both backend (`:3001`) and frontend (`:3000`) together:

```bash
npm run dev
```

Or run them separately:

```bash
# Backend only (watch mode)
cd backend && npm run start:dev

# Frontend only
cd frontend && npm run dev
```

Open:

- Frontend → http://localhost:3000
- Backend API → http://localhost:3001/api
- Swagger docs → http://localhost:3001/api/docs
- Health check → http://localhost:3001/api/health

---

## Database & Migrations

In development, TypeORM is configured with `synchronize: true` (`backend/src/app.module.ts`), so entity changes are applied automatically when the server boots. No migration files are required.

**For production hardening**, you should disable `synchronize` and use real migrations:

```bash
# 1. Turn off synchronize in app.module.ts (set synchronize: false)
# 2. Install the TypeORM CLI if needed
# 3. Generate a migration from entity changes:
npx typeorm migration:generate -d src/data-source.ts src/migrations/<name>
# 4. Run pending migrations:
npx typeorm migration:run -d src/data-source.ts
```

> ⚠️ `synchronize: true` is convenient for development but can cause destructive schema changes in production. Flip it before deploying.

---

## API Documentation

Interactive Swagger docs are generated automatically and served at:

```
http://localhost:3001/api/docs
```

The API is exposed under the **`/api`** prefix. All routes (except auth) require a `Bearer` JWT token.

### Auth

| Method | Path                 | Description                 | Access |
| ------ | -------------------- | --------------------------- | ------ |
| POST   | `/api/auth/register` | Register (first user = admin) | Public |
| POST   | `/api/auth/login`    | Log in, returns JWT         | Public |
| GET    | `/api/auth/me`       | Current user profile        | Any user |

### Users

| Method | Path                | Description        | Access  |
| ------ | ------------------- | ------------------ | ------- |
| GET    | `/api/users`        | List all users     | Admin   |
| PATCH  | `/api/users/:id/role` | Change user role | Admin   |

### Projects

| Method | Path                 | Description        | Access |
| ------ | -------------------- | ------------------ | ------ |
| GET    | `/api/projects`      | List projects      | Any user |
| POST   | `/api/projects`      | Create project     | Admin  |
| GET    | `/api/projects/:id`  | Project detail     | Any user |
| PATCH  | `/api/projects/:id`  | Update project     | Admin  |
| DELETE | `/api/projects/:id`  | Delete project     | Admin  |
| PATCH  | `/api/projects/:id/archive` | Archive    | Admin  |

### Project Members

| Method | Path                                 | Description      | Access          |
| ------ | ------------------------------------ | ---------------- | --------------- |
| GET    | `/api/projects/:projectId/members`   | List members     | Any user        |
| POST   | `/api/projects/:projectId/members`   | Add member       | Project owner   |
| DELETE | `/api/projects/:projectId/members/:userId` | Remove member | Project owner |

### Issues

| Method | Path                                             | Description                | Access             |
| ------ | ------------------------------------------------ | -------------------------- | ------------------ |
| GET    | `/api/issues`                                    | Issues across my projects (admin: all) | Any user |
| POST   | `/api/projects/:projectId/issues`                | Create issue               | Project member / admin |
| GET    | `/api/projects/:projectId/issues`                | List project issues        | Project member / admin |
| GET    | `/api/projects/:projectId/issues/:id`            | Issue detail               | Project member / admin |
| PUT    | `/api/projects/:projectId/issues/:id`            | Update issue               | Project member / admin |
| DELETE | `/api/projects/:projectId/issues/:id`            | Delete issue (creator)     | Creator            |

### Comments

| Method | Path                                     | Description | Access                 |
| ------ | ---------------------------------------- | ----------- | ---------------------- |
| GET    | `/api/issues/:issueId/comments`          | List comments | Project member / admin |
| POST   | `/api/issues/:issueId/comments`          | Add comment | Project member / admin |
| PUT    | `/api/issues/:issueId/comments/:id`      | Edit comment | Author / admin |
| DELETE | `/api/issues/:issueId/comments/:id`      | Delete comment | Author / admin |

### Dashboard

| Method | Path                                      | Description            | Access             |
| ------ | ----------------------------------------- | ---------------------- | ------------------ |
| GET    | `/api/projects/:projectId/dashboard`      | Project stats & recent activity | Project member / admin |

### Activity

| Method | Path                                 | Description       | Access |
| ------ | ------------------------------------ | ----------------- | ------ |
| GET    | `/api/projects/:projectId/activity`  | Audit activity log | Admin  |

### Health

| Method | Path          | Description    |
| ------ | ------------- | -------------- |
| GET    | `/api/health` | Liveness check |

---

## Architecture

### Backend (NestJS, modular)

- **Modules** are organized by domain: `auth`, `users`, `projects`, `project-members`, `issues`, `comments`, `dashboard`, `activity`, `health`.
- **Auth**: Passport JWT strategy + `JwtAuthGuard` protects all routes. A `RolesGuard` + `@Roles()` decorator restricts admin-only actions.
- **Database**: TypeORM with PostgreSQL. Entities auto-sync in dev (`synchronize: true`).
- **Validation**: Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) strips unknown fields and transforms DTO types.
- **Errors**: Global `HttpExceptionFilter` returns consistent error shapes and logs server errors via Nest `Logger`.
- **Security**:
  - Passwords hashed with `bcrypt` (never stored/returned in plaintext).
  - `User.password` is excluded from query results by default (`select: false`).
  - API responses return safe user projections.
  - CORS allow-list configured centrally.

### Frontend (Next.js, App Router)

- **Client state**: React Query for server data + caching, `AuthContext` for the session.
- **API access**: A single Axios client (`src/lib/api.ts`) attaches the JWT, centralizes 401 handling (clear token + redirect to `/login?redirect=...`), and surfaces errors via toasts.
- **Routing**: App-router pages under `src/app`. Protected routes wrap content in `ProtectedRoute`; role-aware UI uses `useRole()`.
- **UI**: Tailwind CSS v4 with shared components (`AppLayout`, `Sidebar`, `LoadingSpinner`, `ErrorMessage`, `ConfirmModal`, `Comments`, `ProjectMembers`, `ActivityLog`, Kanban board, etc.).

### Data Model

- **User** — `id`, `name`, `email`, `password` (hidden), `role`, timestamps
- **Project** — `id`, `name`, `description`, `status`, `owner`, `createdBy`, timestamps
- **ProjectMember** — join table (project ⇄ user), `joinedAt`
- **Issue** — belongs to a project, has `creator`, `assignee`, `status`, `priority`, `order`, `dueDate`, timestamps
- **Comment** — belongs to an issue, has `author`
- **Activity** — audit log: `action`, `user`, `project`, `meta` (JSONB), `createdAt`

---

## Role & Permission Model

Two concepts are separate:

- **System role** (`users.role`): `admin` | `member`.
  - **Admin** has full **view** access across all projects (issues, dashboards, comments, project details) regardless of membership.
  - **Admin** can create/edit/archive/delete projects, change user roles, and see the global activity log.
- **Project ownership** (`projects.owner`): only the **owner** can add/remove members of their own project.

> Admin can view everything, but member-management remains owner-only by design.

---

## Testing

```bash
# Backend unit tests
cd backend && npm run test

# Backend test coverage
cd backend && npm run test:cov
```

---

## Known Limitations

- **`synchronize: true`**: Table schema syncs automatically; fine for development, but should be replaced with migrations for production (see [Database & Migrations](#database--migrations)).
- **JWT in `localStorage`**: The frontend stores the token in `localStorage` (typical for SPAs, but it is accessible to XSS). Using an HttpOnly cookie would be more secure.
- **Frontend auth is client-side**: Route guards are client-only for UX; real authorization must (and does) happen on the backend. No `middleware.ts` exists for server-side route protection.
- **Owner-only member management**: Even admins cannot add/remove members unless they own the project.
- **No email verification / password reset**: Accounts are created via the public register endpoint (first registered user becomes admin).
- **Duplicate UI helpers**: Some status/priority color maps still exist locally where raw string data needs string-typed maps with fallbacks (kanban/dashboard); the primary issue pages share a centralized `src/lib/constants.ts`.
- **Rate limiting**: No built-in rate limiting on auth endpoints.

---

## Scripts Reference

Root `package.json`:

| Script        | Description                                  |
| ------------- | -------------------------------------------- |
| `npm run dev` | Run backend + frontend in watch mode together |
| `npm run build` | Build the backend                           |
| `npm start`  | Start the backend in production mode          |

Backend (`backend/package.json`):

| Script           | Description                 |
| ---------------- | --------------------------- |
| `npm run start:dev` | Start backend (watch)     |
| `npm run build`   | Compile TypeScript         |
| `npm run lint`    | Lint + auto-fix            |
| `npm run test`    | Run unit tests             |

Frontend (`frontend/package.json`):

| Script       | Description          |
| ------------ | -------------------- |
| `npm run dev` | Start Next.js dev   |
| `npm run build` | Production build  |
| `npm run lint`  | ESLint             |
