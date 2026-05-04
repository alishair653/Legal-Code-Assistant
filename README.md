# Legal Code Assistant

AI-powered Pakistani legal assistant (PPC, CrPC, QSO). Monorepo layout for a clean FYP / production codebase.

## Repository layout

| Folder | Role |
|--------|------|
| [`frontend/`](frontend/) | **Next.js 16** app — UI, `app/api` routes, components, Tailwind, shadcn/ui |
| [`legal-data/`](legal-data/) | PDFs, extracted JSON, combined datasets (see `legal-data/README.md`) |
| [`ai-ml-module/`](ai-ml-module/) | Python scripts: PDF extraction, embeddings, Qdrant upload |
| [`backend-core/`](backend-core/) | Placeholder for shared server logic / future services (see `backend-core/README.md`) |
| [`plan.md`](plan.md) | 30-day build plan |

## Quick start (web app)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `frontend/.env.example` to `frontend/.env.local` and fill keys (Groq, Supabase, Qdrant, Neo4j, etc.). Next.js only loads env files from the **`frontend/`** directory when you run commands from there.

## Deploy (Vercel)

Set the project **Root Directory** to `frontend`, then add the same environment variables in the Vercel dashboard.

## License

See [LICENSE](LICENSE).
