# ProjectHub — Frontend

Next.js (App Router) client for the ProjectHub project management system. Built with React 19, React Query, Tailwind CSS v4, `react-hook-form` + `zod`, and `@hello-pangea/dnd` for the kanban board.

## Requirements

- Node.js 20+

## Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

| Variable               | Required | Example                        | Notes                   |
| ---------------------- | -------- | ------------------------------ | ----------------------- |
| `NEXT_PUBLIC_API_URL`  | **Yes**  | `http://localhost:3001/api`    | Backend API base URL    |

> `NEXT_PUBLIC_*` vars are bundled into the client and are public by design — never put secrets here.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The development server proxies API calls to the URL in `NEXT_PUBLIC_API_URL`.

## Common Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # start production server
npm run lint     # eslint
```

## Project Layout

- `src/app/` — routes (App Router)
- `src/components/` — shared & feature components
- `src/context/AuthContext.tsx` — session state
- `src/lib/api.ts` — Axios client (JWT, 401 handling, errors)
- `src/lib/constants.ts` — shared status/priority constants
- `src/lib/types.ts` — shared TypeScript types
- `src/lib/hooks/` — hooks (`useRole`, `useDebounce`, …)

## Notes

- The JWT is stored in `localStorage`. Confirm the backend is running and `NEXT_PUBLIC_API_URL` matches before exporting to production.
