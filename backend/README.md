# ProjectHub — Backend API

NestJS backend for the ProjectHub project management system. Exposes a REST API under the `/api` prefix, with JWT authentication, role-based authorization, PostgreSQL persistence via TypeORM, and auto-generated Swagger documentation.

---

## Requirements

- Node.js 20+
- PostgreSQL 14+ running locally

## Environment Variables

Copy the example file and fill in values:

```bash
cp .env.example .env
```

See [.env.example](./.env.example) for the full list of variables.

| Variable          | Required | Default        | Notes                                     |
| ----------------- | -------- | -------------- | ----------------------------------------- |
| `DB_HOST`         | No       | `localhost`    | Postgres host (local connection)          |
| `DB_PORT`         | No       | `5432`         | Postgres port                             |
| `DB_USERNAME`     | No       | `postgres`     | Postgres user                             |
| `DB_PASSWORD`     | No       | *(empty)*      | Postgres password                         |
| `DB_DATABASE`     | No       | `project_management` | Postgres database name             |
| `DATABASE_URL`    | No       | —              | Optional full connection URL (cloud/SSL)  |
| `JWT_SECRET`      | **Yes**  | —              | JWT signing secret — **must** be set      |
| `PORT`            | No       | `3001`         | HTTP port                                 |
| `FRONTEND_URL`    | No       | —              | Allowed CORS origin for the frontend      |

## Getting Started

```bash
npm install

# create the database (once)
#   psql -c "CREATE DATABASE project_management;"

# run in watch mode
npm run start:dev
```

By default TypeORM uses `synchronize: true`, so tables are created automatically on first boot.

## Endpoints

Swagger (interactive) is served at:

```
http://localhost:3001/api/docs
```

Health check:

```
http://localhost:3001/api/health
```

See the [root README](../README.md#api-documentation) for a full endpoint reference.

## Common Scripts

```bash
npm run start:dev     # watch mode
npm run build         # compile TypeScript
npm run start:prod    # run compiled build
npm run lint          # lint + auto-fix
npm run test          # unit tests
npm run test:cov      # coverage
```

## Deployment Note

Before deploying, set `synchronize: false` and adopt TypeORM migrations — see [Database & Migrations](../README.md#database--migrations) in the root README.
