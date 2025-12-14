# Cleverly Client (Vite + React)

UI skeleton for the Cleverly AI Grader MVP.

## Scripts
```bash
npm install
npm run dev    # start on http://localhost:5173
npm run build
```

## Features
- Hero + stats summarizing AI pipeline health.
- Course creation modal (info + topics/materials) with manual + AI topic flows.
- Course library grid with status badges and topic chips.
- Rubric editor (inline editing, add/regenerate controls).
- Grading dashboard split view (submissions list + question-level feedback/overrides).

Backend base URL defaults to `http://localhost:4000/api` (set `VITE_API_URL` to override). For auth, set `VITE_SUPABASE_DEMO_TOKEN` or wire Supabase auth to populate `sb-access-token` in localStorage.
