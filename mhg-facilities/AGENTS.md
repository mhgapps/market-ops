# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router routes, layouts, and page-level UI.
- `src/components`: UI and domain components (organized by feature like `tickets/`, `vendors/`, `ui/`).
- `src/dao` and `src/services`: data access and business logic layers; keep database-facing code in `dao`.
- `src/hooks`, `src/stores`, `src/providers`, `src/lib`, `src/types`, `src/theme`, `src/emails`, `src/messages`: shared logic and platform concerns.
- `public/`: static assets. `supabase/migrations` and `supabase/seed.sql`: database schema + seed data.
- Tests live next to source in `src/**/__tests__/*.test.ts`.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server (Turbopack) on `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run ESLint against `src/`.
- `npm run type-check`: TypeScript type checks with `tsc --noEmit`.
- `npm run test`: run Vitest once; `npm run test:watch` for watch mode; `npm run test:coverage` for coverage.

## Coding Style & Naming Conventions
- TypeScript + React (Next.js). Use the `@/` alias for imports from `src/` (e.g., `@/services/tickets`).
- Match existing formatting: 2-space indentation and no semicolons are the prevailing style.
- File naming: use `kebab-case` for component files (e.g., `dropdown-menu.tsx`); use `PascalCase` for React component names.
- ESLint allows unused variables only when prefixed with `_` (e.g., `_unused`).

## Testing Guidelines
- Unit/integration tests use Vitest with `jsdom` and Testing Library.
- Place tests under `__tests__` with `*.test.ts` naming. Keep tests close to the modules they cover.
- Prefer testing services/DAO logic directly rather than UI snapshots unless UI behavior is the focus.

## Commit & Pull Request Guidelines
- Commit messages follow a conventional format: `type(scope): summary` (e.g., `fix(phase8): align ticket schema`).
- Keep commits focused and describe the “why” in the summary.
- PRs should include a brief description, testing notes, and screenshots for UI changes. Call out any schema or migration updates.

## Configuration & Data
- Copy `.env.example` to `.env.local` for local configuration; never commit secrets.
- Database changes should be captured in `supabase/migrations` with a short note in the PR.
