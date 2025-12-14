# Cleverly - Quick Start Guide

Get your Supabase project up and running in 10 minutes.

## Prerequisites
- [ ] Supabase account (free tier is fine)
- [ ] Google account (for Gemini API)
- [ ] Redis installed locally
- [ ] Node.js 18+ installed

---

## Step 1: Create Supabase Project (2 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - Name: `cleverly`
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

---

## Step 2: Run Database Setup (2 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy **ALL** contents from `supabase/complete_setup.sql`
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Wait for success messages

**Verify:** You should see "Query Success" with no errors.

---

## Step 3: Create Storage Bucket (1 minute)

1. Click **Storage** (left sidebar)
2. Click "Create a new bucket"
3. Fill in:
   - Name: `courses` (exactly this!)
   - Public: UNCHECK (keep private)
4. Click "Create bucket"

**Verify:** You should see the "courses" bucket in the list.

---

## Step 4: Configure Storage Policies (2 minutes)

1. Click on the **courses** bucket
2. Click "Policies" tab
3. Click "New Policy" > "Create a custom policy"
4. Copy and paste each policy from below:

### Policy 1: Users can upload files
```sql
-- Policy name: Users can upload files
-- Operation: INSERT
-- Target role: authenticated

-- USING expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]

-- WITH CHECK expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 2: Users can read own files
```sql
-- Policy name: Users can read own files
-- Operation: SELECT
-- Target role: authenticated

-- USING expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 3: Users can delete own files
```sql
-- Policy name: Users can delete own files
-- Operation: DELETE
-- Target role: authenticated

-- USING expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]
```

**Verify:** You should see 3 policies listed under the courses bucket.

---

## Step 5: Get API Credentials (1 minute)

1. Click **Settings** (gear icon, bottom left)
2. Click **API**
3. Copy these values (keep this tab open):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: Your public key
   - **service_role**: Your secret key (keep secure!)

---

## Step 6: Get Gemini API Key (1 minute)

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key

---

## Step 7: Configure Backend (1 minute)

1. Open `server/.env` in your code editor
2. Fill in these values:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
GEMINI_API_KEY=AIzaSy...
PORT=4000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
STORAGE_BUCKET=courses
CLIENT_URL=http://localhost:5173
```

3. Save the file

---

## Step 8: Configure Frontend (30 seconds)

1. Open `client/.env` in your code editor
2. Fill in these values:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

3. Save the file

---

## Step 9: Start Redis (30 seconds)

Open a terminal and run:
```bash
redis-server
```

**Verify:** You should see "Ready to accept connections"

---

## Step 10: Start the Application (1 minute)

### Terminal 1: Start Backend
```bash
cd server
npm install
npm run dev
```

**Verify:** You should see "Server running on port 4000"

### Terminal 2: Start Frontend
```bash
cd client
npm install
npm run dev
```

**Verify:** You should see "Local: http://localhost:5173"

---

## You're Done!

Open your browser to [http://localhost:5173](http://localhost:5173)

---

## Verification Checklist

Run this to verify your setup:

1. Go to Supabase **SQL Editor**
2. Copy contents from `supabase/verify_setup.sql`
3. Paste and run
4. Check for "SUCCESS: ALL CHECKS PASSED!"

---

## Test Vector Search (Optional)

To test the vector search functionality:

1. Go to Supabase **SQL Editor**
2. Copy contents from `supabase/test_vector_search.sql`
3. Paste and run
4. Check that test data is created and queries return results
5. Uncomment cleanup section to remove test data

---

## Common Issues

### "Cannot connect to Redis"
**Solution:** Make sure Redis is running (`redis-server`)

### "Invalid API key"
**Solution:** Double-check you copied the entire key with no extra spaces

### "Storage bucket not found"
**Solution:** Ensure bucket name is exactly "courses" (case-sensitive)

### "Extension 'vector' does not exist"
**Solution:** Run the complete_setup.sql script again

---

## Next Steps

1. Create a user account through the app
2. Create your first course
3. Upload a PDF textbook
4. Ask questions to test the RAG functionality
5. Create a grading assignment

---

## Need Help?

- See `SETUP_GUIDE.md` for detailed instructions
- See `ENV_CONFIGURATION.md` for environment variable details
- Check Supabase logs: Settings > Logs
- Check backend console for error messages

---

## File Reference

| File | Purpose |
|------|---------|
| `complete_setup.sql` | All database migrations combined |
| `SETUP_GUIDE.md` | Detailed step-by-step setup guide |
| `ENV_CONFIGURATION.md` | Environment variable reference |
| `verify_setup.sql` | Verify your setup is correct |
| `test_vector_search.sql` | Test vector search functionality |
| `QUICK_START.md` | This file - quick setup in 10 minutes |

---

**Happy coding!** Your Cleverly platform is ready to use.
