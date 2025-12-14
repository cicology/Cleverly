# Environment Configuration Guide

This guide explains exactly how to configure your environment variables for both the backend (server) and frontend (client) applications.

## Table of Contents
1. [Getting Supabase Credentials](#getting-supabase-credentials)
2. [Getting Gemini API Key](#getting-gemini-api-key)
3. [Backend Configuration (server/.env)](#backend-configuration-serverenv)
4. [Frontend Configuration (client/.env)](#frontend-configuration-clientenv)
5. [Environment Variable Reference](#environment-variable-reference)
6. [Security Best Practices](#security-best-practices)

---

## Getting Supabase Credentials

### Step 1: Navigate to Project Settings
1. Open your Supabase project dashboard
2. Click on the **Settings** icon (gear icon) in the left sidebar at the bottom
3. Click on **API** under "Project Settings"

### Step 2: Find Your Project URL
- Look for the "Project URL" section
- Copy the URL (format: `https://xxxxxxxxxxxxx.supabase.co`)
- This is your `SUPABASE_URL`

### Step 3: Find Your API Keys
In the same API settings page, scroll to "Project API keys":

#### anon public key
- This is safe to use in browsers
- Used for client-side authentication
- Copy this for `SUPABASE_ANON_KEY`

#### service_role secret key
- **DANGER**: This key has admin privileges
- **NEVER** use this in frontend code
- **NEVER** commit this to version control
- Only use on the backend server
- Copy this for `SUPABASE_SERVICE_ROLE_KEY`

### Visual Guide - Where to Find in Supabase UI:
```
Supabase Dashboard
└── Settings (gear icon)
    └── API
        ├── Project URL
        │   └── https://xxxxxxxxxxxxx.supabase.co
        │
        └── Project API keys
            ├── anon public (safe for client)
            └── service_role (SERVER ONLY - secret!)
```

---

## Getting Gemini API Key

### Step 1: Go to Google AI Studio
1. Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account

### Step 2: Create API Key
1. Click "Create API Key"
2. Select an existing Google Cloud project or create a new one
3. Click "Create API Key in existing project" or "Create API key in new project"

### Step 3: Copy Your Key
1. Copy the generated API key
2. This is your `GEMINI_API_KEY`
3. Store it securely - you won't be able to see it again

### Note on Gemini API
- The free tier includes generous quotas for development
- Rate limits: 60 requests per minute
- Embeddings: 768 dimensions (already configured in migrations)

---

## Backend Configuration (server/.env)

The backend needs full access to Supabase (including admin privileges) and external APIs.

### Location
`server/.env`

### Complete Template
```env
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
# Get these from: Supabase Dashboard > Settings > API

# Your Supabase project URL
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Service role key (SECRET - has admin access)
# NEVER commit this or share it publicly
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...

# Anon key (public - safe to use)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...

# ============================================================================
# GOOGLE GEMINI AI
# ============================================================================
# Get this from: https://makersuite.google.com/app/apikey

GEMINI_API_KEY=AIzaSy...

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

# Port the backend server runs on
PORT=4000

# Environment (development, production, test)
NODE_ENV=development

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
# Redis is used for BullMQ job queues (embedding processing, grading jobs)

# Local Redis URL (default)
REDIS_URL=redis://localhost:6379

# For production Redis (e.g., Redis Cloud):
# REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345

# ============================================================================
# SUPABASE STORAGE
# ============================================================================

# Storage bucket name for course files
# Must match the bucket name created in Supabase Storage
STORAGE_BUCKET=courses

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

# Client URL for Socket.IO CORS
CLIENT_URL=http://localhost:5173

# For production:
# CLIENT_URL=https://yourdomain.com
```

### How to Fill In

1. **SUPABASE_URL**: Paste your Supabase project URL
2. **SUPABASE_SERVICE_ROLE_KEY**: Paste the service_role key (long JWT string)
3. **SUPABASE_ANON_KEY**: Paste the anon public key (long JWT string)
4. **GEMINI_API_KEY**: Paste your Google Gemini API key
5. **PORT**: Keep as 4000 (or change if port is in use)
6. **NODE_ENV**: Keep as "development" for local development
7. **REDIS_URL**: Keep as "redis://localhost:6379" if Redis is running locally
8. **STORAGE_BUCKET**: Keep as "courses" (must match bucket name in Supabase)
9. **CLIENT_URL**: Keep as "http://localhost:5173" (Vite's default port)

### Quick Fill Example
```env
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjQyMDAwMCwiZXhwIjoxOTMxOTk2MDAwfQ.xxx
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTY0MjAwMDAsImV4cCI6MTkzMTk5NjAwMH0.yyy
GEMINI_API_KEY=AIzaSyABCDEF1234567890abcdefghijklmnop
PORT=4000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
STORAGE_BUCKET=courses
CLIENT_URL=http://localhost:5173
```

---

## Frontend Configuration (client/.env)

The frontend only needs public credentials and the backend API URL.

### Location
`client/.env`

### Complete Template
```env
# ============================================================================
# API CONFIGURATION
# ============================================================================

# Backend API URL
# In development: http://localhost:4000/api
# In production: https://your-api-domain.com/api
VITE_API_URL=http://localhost:4000/api

# ============================================================================
# SUPABASE CONFIGURATION (Client-side)
# ============================================================================
# These are used for client-side authentication if needed
# Note: Only use the ANON key here, NEVER the service role key

# Your Supabase project URL (same as backend)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon key (public - safe to use in browser)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
```

### How to Fill In

1. **VITE_API_URL**: Keep as "http://localhost:4000/api" for local development
2. **VITE_SUPABASE_URL**: Paste your Supabase project URL (same as backend)
3. **VITE_SUPABASE_ANON_KEY**: Paste the anon public key (same as backend)

### Quick Fill Example
```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTY0MjAwMDAsImV4cCI6MTkzMTk5NjAwMH0.yyy
```

---

## Environment Variable Reference

### Complete List of All Variables

| Variable | Required | Location | Description | Example |
|----------|----------|----------|-------------|---------|
| `SUPABASE_URL` | Yes | Both | Your Supabase project URL | `https://abc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Backend only | Admin access key (SECRET!) | `eyJhbGc...` (JWT) |
| `SUPABASE_ANON_KEY` | Yes | Both | Public access key | `eyJhbGc...` (JWT) |
| `GEMINI_API_KEY` | Yes | Backend only | Google Gemini API key | `AIzaSy...` |
| `PORT` | No | Backend only | Server port | `4000` |
| `NODE_ENV` | No | Backend only | Environment mode | `development` |
| `REDIS_URL` | Yes | Backend only | Redis connection URL | `redis://localhost:6379` |
| `STORAGE_BUCKET` | Yes | Backend only | Supabase storage bucket name | `courses` |
| `CLIENT_URL` | Yes | Backend only | Frontend URL for CORS | `http://localhost:5173` |
| `VITE_API_URL` | Yes | Frontend only | Backend API endpoint | `http://localhost:4000/api` |
| `VITE_SUPABASE_URL` | Yes | Frontend only | Supabase project URL | `https://abc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Frontend only | Public Supabase key | `eyJhbGc...` (JWT) |

### Variable Naming Convention

- **VITE_**: Prefix for Vite (frontend) environment variables
- All frontend environment variables MUST start with `VITE_` to be accessible in the browser
- Backend variables don't need a prefix

---

## Security Best Practices

### DO:
- Store `.env` files locally only
- Add `.env` to `.gitignore`
- Use environment-specific `.env` files (.env.development, .env.production)
- Rotate API keys periodically
- Use different Supabase projects for development and production
- Keep `service_role` key on the backend only

### DON'T:
- Commit `.env` files to version control
- Share your `service_role` key with anyone
- Use production credentials in development
- Hardcode credentials in source code
- Use the `service_role` key in frontend code

### .gitignore Entry
Ensure your `.gitignore` includes:
```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production
.env.test

# Keep example files
!.env.example
```

### Key Rotation
If you accidentally expose your `service_role` key:
1. Go to Supabase Dashboard > Settings > API
2. Click "Reset service_role key"
3. Update your backend `.env` file immediately
4. Restart your backend server

---

## Production Configuration

### Backend (.env.production)
```env
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
SUPABASE_ANON_KEY=your-production-anon-key
GEMINI_API_KEY=your-production-gemini-key
PORT=4000
NODE_ENV=production
REDIS_URL=redis://your-redis-cloud-url:6379
STORAGE_BUCKET=courses
CLIENT_URL=https://yourdomain.com
```

### Frontend (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## Verification

### Test Backend Configuration
```bash
# Navigate to backend
cd server

# Load environment variables and check
node -e "require('dotenv').config(); console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.slice(0, 30) + '...'); console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING');"
```

### Test Frontend Configuration
```bash
# Navigate to frontend
cd client

# Start dev server and check console
npm run dev
# Open browser console and check if VITE_ variables are accessible
```

---

## Troubleshooting

### Problem: "Environment variable not defined"

**Backend:**
- Ensure `.env` file exists in `server/` directory
- Check variable names match exactly (case-sensitive)
- Restart the server after changing `.env`

**Frontend:**
- Ensure variable starts with `VITE_`
- Restart the dev server after changing `.env`
- Check browser console for errors

### Problem: "Invalid API key" or "Unauthorized"

**Solution:**
- Verify you copied the complete key (they're long!)
- Check for extra spaces or newlines
- Ensure you're using the correct key type (anon vs service_role)
- Try regenerating the key in Supabase dashboard

### Problem: "Cannot connect to Redis"

**Solution:**
- Ensure Redis is installed and running: `redis-server`
- Check Redis URL is correct: `redis://localhost:6379`
- Test connection: `redis-cli ping` (should return "PONG")

### Problem: "Storage bucket not found"

**Solution:**
- Verify bucket name is exactly "courses" in both `.env` and Supabase
- Check bucket exists in Supabase Dashboard > Storage
- Ensure bucket is created before starting the server

---

## Quick Setup Checklist

- [ ] Created Supabase project
- [ ] Copied Project URL
- [ ] Copied anon public key
- [ ] Copied service_role secret key
- [ ] Created Gemini API key
- [ ] Created `server/.env` file
- [ ] Filled in all backend environment variables
- [ ] Created `client/.env` file
- [ ] Filled in all frontend environment variables
- [ ] Added `.env` to `.gitignore`
- [ ] Verified Redis is running
- [ ] Created "courses" storage bucket in Supabase
- [ ] Tested backend starts without errors
- [ ] Tested frontend starts without errors

---

**You're all set!** Your environment is now properly configured for development.
