# Supabase Configuration Files

This directory contains all the scripts and documentation needed to set up your Supabase database for the Cleverly platform.

## Quick Links

- **New to setup?** Start with [QUICK_START.md](QUICK_START.md)
- **Need details?** See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Environment variables?** Check [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md)

## Files Overview

### Setup Scripts (Run These)

| File | Purpose | When to Use |
|------|---------|-------------|
| **complete_setup.sql** | All database migrations in one file | Run ONCE when setting up new project |
| **storage_policies.sql** | Storage bucket access policies | Run AFTER creating 'courses' bucket |
| **verify_setup.sql** | Verify your setup is correct | Run to check everything is configured |
| **test_vector_search.sql** | Test vector search functionality | Run to verify embeddings work |

### Documentation (Read These)

| File | Purpose | Who Should Read |
|------|---------|-----------------|
| **QUICK_START.md** | 10-minute setup guide | Everyone (start here!) |
| **SETUP_GUIDE.md** | Detailed step-by-step instructions | First-time users |
| **ENV_CONFIGURATION.md** | Environment variable guide | Everyone (for .env setup) |
| **README.md** | This file - directory overview | You're reading it! |

### Migration Files (Reference Only)

| File | Purpose | Note |
|------|---------|------|
| **001_initial_schema.sql** | Profiles table and extensions | Included in complete_setup.sql |
| **002_courses.sql** | Courses and embeddings tables | Included in complete_setup.sql |
| **003_grading_module.sql** | Grading system tables | Included in complete_setup.sql |
| **004_match_course_embeddings.sql** | Vector search function | Included in complete_setup.sql |

**Note:** You don't need to run these individually - they're all combined in `complete_setup.sql`.

## Setup Workflow

### First-Time Setup

```
1. Read QUICK_START.md
   ↓
2. Create Supabase project
   ↓
3. Run complete_setup.sql
   ↓
4. Create 'courses' storage bucket
   ↓
5. Run storage_policies.sql
   ↓
6. Configure .env files (see ENV_CONFIGURATION.md)
   ↓
7. Run verify_setup.sql
   ↓
8. (Optional) Run test_vector_search.sql
   ↓
9. Start your application!
```

### Visual Guide

```
┌─────────────────────────────────────────┐
│     1. Create Supabase Project          │
│        (via supabase.com)               │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     2. Run complete_setup.sql           │
│        • Creates all tables             │
│        • Enables extensions             │
│        • Sets up RLS policies           │
│        • Creates vector search function │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     3. Create Storage Bucket            │
│        • Name: courses                  │
│        • Type: Private                  │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     4. Run storage_policies.sql         │
│        • Sets up RLS for storage        │
│        • Controls file access           │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     5. Configure Environment Vars       │
│        • server/.env                    │
│        • client/.env                    │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     6. Verify with verify_setup.sql     │
│        • Checks all components          │
│        • Confirms RLS is enabled        │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     7. Test with test_vector_search.sql │
│        • Verifies vector search works   │
│        • Tests embeddings               │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     8. Start Application!               │
│        Ready to use                     │
└─────────────────────────────────────────┘
```

## What Gets Created

### Database Tables (8 total)

1. **profiles** - User profile information
2. **courses** - Course metadata
3. **course_files** - Uploaded course files
4. **course_embeddings** - Vector embeddings for RAG
5. **graders** - Grading assignments
6. **rubrics** - Grading criteria
7. **submissions** - Student submissions
8. **submission_grades** - Individual question grades

### Extensions

1. **uuid-ossp** - UUID generation
2. **vector** - pgvector for similarity search

### Functions

1. **match_course_embeddings()** - Semantic search on embeddings

### Storage

1. **courses** bucket - File storage with RLS policies

### Security

- Row Level Security (RLS) enabled on all tables
- Storage policies to protect user files
- User-specific access controls

## Database Schema Overview

```
┌─────────────┐
│   Profiles  │
│   (Users)   │
└──────┬──────┘
       │
       │ user_id
       ↓
┌─────────────┐
│   Courses   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ↓                 ↓
┌─────────────┐   ┌─────────────┐
│Course Files │   │   Graders   │
└──────┬──────┘   └──────┬──────┘
       │                 │
       ↓                 ├──────────┐
┌─────────────┐          │          │
│  Embeddings │          ↓          ↓
│  (Vector)   │   ┌─────────┐ ┌─────────┐
└─────────────┘   │Rubrics  │ │Submis-  │
                  │         │ │sions    │
                  └─────────┘ └────┬────┘
                                   │
                                   ↓
                              ┌─────────┐
                              │Submission│
                              │Grades   │
                              └─────────┘
```

## Commands Quick Reference

### Run SQL Script in Supabase

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Click "New query"
4. Copy script contents
5. Paste and click **Run**

### Verify Extensions

```sql
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
```

### Check Tables

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

### Check RLS Status

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;
```

### Test Vector Search

```sql
SELECT * FROM match_course_embeddings(
  array_fill(0, ARRAY[768])::vector(768),
  'your-course-id'::uuid,
  5
);
```

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| "extension 'vector' does not exist" | Enable in Database > Extensions |
| "permission denied for schema public" | Use SQL Editor (not direct psql) |
| "relation does not exist" | Run complete_setup.sql |
| "RLS policy violation" | Check auth.uid() matches user_id |
| "storage bucket not found" | Create 'courses' bucket in Storage UI |

### Getting Help

1. Run `verify_setup.sql` to diagnose issues
2. Check Supabase logs: Settings > Logs
3. Review error messages in browser console
4. Check backend server logs

## Environment Setup

Required environment variables:

### Backend (server/.env)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_ANON_KEY=eyJhbG...
GEMINI_API_KEY=AIzaSy...
REDIS_URL=redis://localhost:6379
STORAGE_BUCKET=courses
```

### Frontend (client/.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

See [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md) for detailed instructions.

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled to ensure:
- Users can only access their own data
- Data isolation between users
- Automatic filtering based on auth.uid()

### Storage Security

Storage bucket policies ensure:
- Users can only upload to their own folders
- Users can only read/update/delete their own files
- File paths are organized by user ID

### API Keys

- **ANON_KEY**: Safe to use in frontend (public)
- **SERVICE_ROLE_KEY**: Backend only (secret!)
- Never commit keys to version control

## Vector Search Details

### Embedding Dimensions
- **768** - Gemini embedding dimension
- Configured in `course_embeddings` table
- Used by `match_course_embeddings()` function

### Index Type
- **IVFFlat** - Inverted File with Flat compression
- Optimized for similarity search
- Configured with 100 lists

### Similarity Metric
- **Cosine distance** (`<=>` operator)
- Returns similarity score (0-1)
- Higher score = more similar

## Testing

### Test Data
Use `test_vector_search.sql` to:
- Insert sample course data
- Insert sample embeddings
- Test vector search queries
- Verify performance
- Clean up test data

### Verification
Use `verify_setup.sql` to:
- Check all extensions are enabled
- Verify all tables exist
- Confirm RLS is enabled
- Check storage buckets
- Validate functions

## Maintenance

### Updating Schema
If you need to modify the schema:
1. Create a new migration file (e.g., `005_new_feature.sql`)
2. Test locally first
3. Apply to production
4. Update `complete_setup.sql` if needed

### Backup
Supabase automatically backs up your database. To manually backup:
1. Go to Settings > Database
2. Click "Backup now"

### Monitoring
Monitor your database:
1. Settings > Database - Check size and connections
2. Settings > Logs - View query logs
3. Database > Extensions - Check extension versions

## Resources

### Supabase Documentation
- [Database](https://supabase.com/docs/guides/database)
- [Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### pgvector Documentation
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Vector Functions](https://github.com/pgvector/pgvector#querying)

### Gemini API
- [Google AI Studio](https://makersuite.google.com/)
- [Embedding Guide](https://ai.google.dev/docs/embeddings_guide)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs
3. Check backend console output
4. Verify all environment variables
5. Ensure Redis is running

## Version History

- **v1.0** - Initial setup with all migrations
  - User profiles
  - Courses and embeddings
  - Grading system
  - Vector search

## License

Part of the Cleverly project.

---

**Quick Start:** Run `complete_setup.sql` → Create `courses` bucket → Run `storage_policies.sql` → Configure `.env` files → You're ready!
