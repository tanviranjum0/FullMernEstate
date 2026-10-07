<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Architecture, data flow and decisions: `docs/ARCHITECTURE.md`.
- Server data never crosses into components as raw Mongoose documents; map through `src/server/mappers.ts` DTOs.
- Public catalogue reads live in `src/server/queries/*` with `'use cache'` + `cacheTag`; mutations invalidate with `updateTag` from `src/server/cache-tags.ts`.
- Every server action re-checks the session and permission (`src/lib/auth/session.ts`, `src/lib/auth/permissions.ts`) and validates input with Zod.
- Scripts in `scripts/` must refuse to write development data to non-local databases.
