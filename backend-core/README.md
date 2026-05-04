# backend-core

Shared **server-side** logic that should stay separate from React UI.

In this project, **HTTP APIs live in the Next.js App Router** under `frontend/app/api/`. That is the primary “backend” for now.

Use this folder later for:

- Shared TypeScript types / validation used by API routes
- Extracted service modules (e.g. payments, RAG pipeline) imported from `frontend/`
- Optional future standalone service (if you split off from Next.js)

Keep this module small until you have real shared code to place here.
