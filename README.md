# Cleverly AI Grader (MVP)

AI-assisted test management: ingest study guides, extract course topics, generate rubrics from memos, and grade handwritten submissions with Gemini + RAG on Supabase.

## What you get
- **Course builder** with 2-step modal (info + topics/materials) and optional AI topic extraction.
- **Grader setup** to upload test & memo, extract/edit rubrics, and queue grading.
- **AI marking dashboard** with split view (submissions list + question-by-question feedback) and override controls.
- **Backend skeleton** (Express + Supabase + BullMQ + Gemini) wired for courses, graders, submissions, analytics.
- **LTI 1.3 integration hooks** for LMS launch + course linking.
- **Database migrations** for courses, files, embeddings, graders, rubrics, submissions, and grade overrides.

## UX/Wireframes
- See `design/wireframes.md` for psychology-informed recommendations (Hick’s Law sorting, Fitts’ Law grading tray, queue/offline status, variable-reward insights, subject color system) and ASCII wireframes for the core screens.

## Stack
- Frontend: Next.js 15 + React 19 + TypeScript, Zustand store, React Query provider, Tailwind CSS + shadcn/ui, Lucide icons.
- Backend: Express, Supabase client, BullMQ (Redis), Google Gemini (File Search + OCR), Zod validation, Pino logging.
- Data: Supabase Postgres + pgvector, Supabase Storage for files.

## Project layout
```
client/      # React UI (course modal, rubric editor, grading dashboard)
server/      # Express API, services, workers
supabase/    # SQL migrations (001-006)
docker-compose.yml  # Redis for BullMQ
.env.example       # Required environment variables
```

## Setup

### Prerequisites
- Node.js 20+ and npm
- Docker (for Redis)
- Supabase account and project
- Google Gemini API key

### Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```
   This will install dependencies for the root workspace, client, and server.

2. **Environment configuration**
   - Copy `.env.example` to `.env` in the project root
   - Fill in the required values:
     ```env
     # Supabase credentials (get from your project settings)
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     SUPABASE_ANON_KEY=your-anon-key

     # Google Gemini API key
     GEMINI_API_KEY=your-gemini-api-key

     # Backend configuration
     PORT=4000
     REDIS_URL=redis://localhost:6379
     STORAGE_BUCKET=courses
     CLIENT_URL=http://localhost:3000
     CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
     MAX_UPLOAD_MB=10
     MAX_UPLOAD_FILES=20
     ALLOW_DEV_AUTH_BYPASS=false
     ALLOW_USER_GEMINI_KEYS=false
     GEMINI_FILE_SEARCH_ENABLED=true
     GEMINI_FILE_SEARCH_MODEL=gemini-2.0-flash
     GEMINI_FILE_SEARCH_STORE_PREFIX=cleverly-course-
     GEMINI_FILE_SEARCH_POLL_MS=5000
     GEMINI_FILE_SEARCH_MAX_WAIT_MS=120000
     GEMINI_GRADING_MODEL=gemini-2.0-flash
     OCR_MODEL=gemini-1.5-pro
     ADMIN_API_KEY=your-admin-api-key

     # Frontend configuration (in client/.env.local)
     NEXT_PUBLIC_API_URL=http://localhost:4000/api
     NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
     NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
     NEXT_PUBLIC_ALLOW_DEMO_TOKEN=false
     ```

3. **Database setup**
   - Go to your Supabase project SQL Editor
   - Run migrations in order:
     1. `supabase/migrations/001_initial_schema.sql`
     2. `supabase/migrations/002_courses.sql`
     3. `supabase/migrations/003_grading_module.sql`
     4. `supabase/migrations/004_match_course_embeddings.sql` (required for RAG)
     5. `supabase/migrations/005_user_settings.sql` (required for user settings)
     6. `supabase/migrations/006_file_search_and_lti.sql` (File Search + LTI)
   - These migrations will:
     - Enable `uuid-ossp` and `vector` extensions
     - Create tables: profiles, courses, course_files, course_embeddings, graders, rubrics, submissions, submission_grades, user_settings, lti_course_links, lti_launches
     - Set up Row Level Security (RLS) policies
     - Create indexes and vector similarity search functions
     - Create indexes for performance

4. **Start Redis**
   ```bash
   docker-compose up -d redis
   ```
   Redis is required for BullMQ job queues (embedding and grading workers).

5. **Build the application**
   ```bash
   npm run build
   ```
   This builds both client and server for production.

6. **Run in development mode**

   **Option A: Run both services concurrently (recommended)**
   ```bash
   npm run dev
   ```

   **Option B: Run services separately**

   Terminal 1 (Backend):
   ```bash
   npm run dev:server
   ```

   Terminal 2 (Frontend):
   ```bash
   npm run dev:client
   ```

7. **Access the application**
   - Frontend: http://localhost:3000 (Next.js dev server)
   - Backend API: http://localhost:4000
   - Health check: http://localhost:4000/api/health

### Admin utilities
- `POST /api/admin/file-search/precreate` (requires `Authorization: Bearer $ADMIN_API_KEY`)
- Body: `{ "course_id": "uuid"?, "upload_files": true?, "force_reupload": false?, "limit": 200? }`

### Troubleshooting

**TypeScript build errors**
- If you see type import errors, ensure you're using `import type` for type-only imports
- The project uses `verbatimModuleSyntax` in tsconfig

**Redis connection errors**
- Verify Docker is running: `docker ps`
- Check Redis container: `docker-compose ps redis`
- Restart Redis: `docker-compose restart redis`

**Supabase connection errors**
- Verify your Supabase URL and keys are correct
- Check if your Supabase project is active
- Ensure pgvector extension is enabled in your project

**Gemini API errors**
- Verify your API key is valid
- The app will use stubs if GEMINI_API_KEY is not set (for local dev)
- Check API quotas in Google Cloud Console

## API surfaces (Express)
- `GET /api/health`
- Courses: `GET /api/courses`, `POST /api/courses` (+file uploads for study_guide/textbook/extra_content), `GET /api/courses/:id/files`
- Graders: `POST /api/graders` (test+memo upload, AI rubric extraction), `GET /api/graders/:id`, `PUT /api/graders/:id/rubric`
- Submissions: `POST /api/graders/:id/submissions`, `GET /api/graders/:id/submissions`, `POST /api/graders/:id/grade-all`, `GET /api/submissions/:id`, `PATCH /api/submission-grades/:id`
- Analytics: `GET /api/graders/:id/analytics`

> Auth placeholder: requests accept `Authorization: Bearer <token>` and attach it as `user.id`. Replace `requireAuth` with Supabase JWT verification before production.
> Now wired: backend will validate Supabase JWTs via `supabase.auth.getUser(token)`. Provide a real access token (or set `NEXT_PUBLIC_SUPABASE_DEMO_TOKEN` in the client for quick tests).

## Frontend highlights
- **Hero + stats** to summarize pipeline health.
- **Course library grid** with status badges and topic chips.
- **Course creation modal** with tabbed flow, file upload CTA, manual/AI topic capture, subtopic chips.
- **Rubric table** editable inline with regenerate/add question actions.
- **Grading dashboard** split view showing submissions, confidence tags, overrides, and export CTA.

## Next improvements
1. Replace OCR stub with real handwriting extraction (Gemini Vision / tesseract) and map to per-question answers.
2. Add socket events for job progress and client-side React Query hooks calling real APIs.
3. Harden workers (backoff, retries, dead-letter) and add analytics aggregations.
4. Flesh out auth UI flow (Supabase email/password or magic link) and persist tokens cleanly.
