# ⚡ Quick Start Guide - Cleverly AI Grader

Get your MVP running in **15 minutes**.

---

## 📋 Prerequisites

- ✅ Node.js 20+ installed
- ✅ Redis installed (`brew install redis` or `choco install redis`)
- ⚠️ Supabase account (sign up at https://supabase.com)
- ⚠️ Gemini API key (get from https://ai.google.dev)

---

## 🚀 Setup Steps

### 1. Configure Supabase (10 minutes)

**Option A: Follow the visual guide**
Open **[SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md)** for detailed steps with screenshots.

**Option B: Quick setup (if you know Supabase)**
1. Create new Supabase project
2. Open SQL Editor
3. Copy the complete migration script from `SUPABASE_SETUP_GUIDE.md` Step 2.2
4. Run it
5. Create storage bucket named `courses`
6. Get your Project URL and API keys

---

### 2. Configure Environment Variables (2 minutes)

#### Server (.env)

Create `server/.env`:

```env
# Supabase (get from Supabase Dashboard → Settings → API)
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini AI (get from https://ai.google.dev)
GEMINI_API_KEY=AIzaSy...

# Server
PORT=4000
REDIS_URL=redis://localhost:6379
STORAGE_BUCKET=courses
CLIENT_URL=http://localhost:5173
```

#### Client (.env)

Create `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. Verify Supabase Setup (1 minute)

```bash
cd server
npm run verify:supabase
```

You should see:
```
🎉 Perfect! Your Supabase setup is complete!
```

If you see errors, fix them before proceeding.

---

### 4. Start Services (2 minutes)

#### Terminal 1: Redis
```bash
redis-server
```

#### Terminal 2: Backend
```bash
cd server
npm run dev
```

You should see:
```
Server listening on http://localhost:4000
```

#### Terminal 3: Frontend
```bash
cd client
npm run dev
```

You should see:
```
Local: http://localhost:5173
```

---

## 🎯 Test the Application

### Option 1: Automated Test

```bash
cd server
npm run test:pipeline
```

Expected output:
```
✅ All tests passed! (8/8)
```

### Option 2: Manual Test

1. **Open** http://localhost:5173
2. **Sign Up:**
   - Click "Sign In"
   - Switch to "Sign Up" tab
   - Enter email and password
   - Create account
3. **Create Course:**
   - Click "Create course"
   - Enter course details
   - Upload a PDF study guide (optional)
   - Save
4. **Create Grader:**
   - Select the course
   - Upload test paper PDF
   - Upload marking memo PDF
   - AI extracts rubric automatically
   - Review and save
5. **Upload Submission:**
   - Upload student PDF
   - Watch OCR extraction
6. **Grade:**
   - Click "Grade All"
   - Watch real-time progress (0% → 100%)
   - Review AI grades with reasoning

---

## 🐛 Common Issues

### "Connection refused" when starting backend
**Fix:** Start Redis first (`redis-server`)

### "Supabase client error"
**Fix:** Double-check `.env` values match Supabase dashboard

### "Cannot find module"
**Fix:** Run `npm install` in both `server/` and `client/` directories

### Frontend shows "Network Error"
**Fix:** Ensure backend is running on port 4000

---

## 📖 Next Steps

Once everything works:

1. **Read Full Documentation:**
   - [FINAL_MVP_SUMMARY.md](FINAL_MVP_SUMMARY.md) - Complete feature list
   - [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) - Authentication details
   - [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md) - Database setup

2. **Deploy to Production:**
   - See deployment section in FINAL_MVP_SUMMARY.md

3. **Customize:**
   - Add your branding
   - Configure email notifications
   - Adjust grading prompts

---

## 🎉 You're Ready!

Your AI-powered test grading system is now running!

**Features you have:**
- ✅ Handwriting recognition (Gemini Vision)
- ✅ AI grading with RAG context
- ✅ Real-time progress updates
- ✅ User authentication
- ✅ Complete CRUD operations
- ✅ Analytics dashboard

**Need help?** Check the troubleshooting sections in the documentation files.

---

**Time to first grade:** ~15-20 minutes 🚀
