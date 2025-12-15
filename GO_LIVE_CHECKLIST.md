# 🚀 Go-Live Checklist for Cleverly AI Grader

## Current Status: MVP Complete (100%)

This checklist covers everything needed to take your application from local development to production.

---

## ✅ Phase 1: Local Development (COMPLETE)

- [x] Backend API implemented
- [x] Frontend UI built
- [x] Database schema created
- [x] AI integrations working (OCR + Grading)
- [x] Real-time updates (Socket.IO)
- [x] Authentication system
- [x] Testing suite
- [x] Code on GitHub

---

## 🔧 Phase 2: Configuration & Setup (REQUIRED)

### 2.1 Supabase Setup (30 minutes)
- [ ] Create Supabase project at https://supabase.com
- [ ] Run database migrations (all 4 SQL files)
- [ ] Verify pgvector extension enabled
- [ ] Create 'courses' storage bucket
- [ ] Configure Row Level Security (RLS) policies
- [ ] Enable Email authentication provider
- [ ] Set site URL to your domain
- [ ] Get Project URL and API keys
- [ ] Test with `npm run verify:supabase`

**Guide:** SUPABASE_SETUP_GUIDE.md (local file)

### 2.2 Get API Keys (10 minutes)
- [ ] **Google Gemini API Key**
  - Go to https://ai.google.dev
  - Create API key
  - Enable Gemini 1.5 Pro and text-embedding-004
  - Copy key to .env

- [ ] **Supabase Keys** (from your project)
  - Project URL
  - Anon/Public key
  - Service Role key

### 2.3 Redis Setup (5 minutes)
- [ ] Install Redis locally OR
- [ ] Sign up for Redis Cloud (https://redis.com/try-free/)
- [ ] Get connection URL
- [ ] Test connection: `redis-cli ping`

### 2.4 Environment Variables (5 minutes)

**Server (.env):**
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
PORT=4000
REDIS_URL=redis://localhost:6379
STORAGE_BUCKET=courses
CLIENT_URL=http://localhost:5173
```

**Client (.env):**
```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- [ ] Configure server/.env
- [ ] Configure client/.env
- [ ] Test configuration

---

## 🧪 Phase 3: Testing & Verification (REQUIRED)

### 3.1 Local Testing (15 minutes)
- [ ] Start Redis: `redis-server`
- [ ] Start backend: `cd server && npm run dev`
- [ ] Start frontend: `cd client && npm run dev`
- [ ] Run automated test: `npm run test:pipeline`
- [ ] Test manual workflow:
  - [ ] Sign up new account
  - [ ] Create course with study guide
  - [ ] Create grader (upload test + memo)
  - [ ] Verify rubric extraction
  - [ ] Upload student submission
  - [ ] Trigger grading
  - [ ] Verify real-time progress
  - [ ] Check AI grades
  - [ ] Test grade override

### 3.2 Security Verification
- [ ] No API keys in code (search codebase)
- [ ] .env files not in git
- [ ] RLS policies working on Supabase
- [ ] CORS configured correctly
- [ ] File upload size limits set
- [ ] SQL injection prevention verified

---

## 🌐 Phase 4: Deployment (Production)

### 4.1 Backend Deployment (Choose one)

**Option A: Railway.app (Recommended - Easy)**
- [ ] Sign up at https://railway.app
- [ ] Create new project
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Deploy backend
- [ ] Get deployment URL
- [ ] Test API endpoints

**Option B: Render.com**
- [ ] Sign up at https://render.com
- [ ] Create Web Service
- [ ] Connect GitHub repo
- [ ] Select `server` directory
- [ ] Build: `npm install && npm run build`
- [ ] Start: `npm start`
- [ ] Set environment variables
- [ ] Deploy

**Option C: Fly.io**
- [ ] Install flyctl
- [ ] Run `fly launch` in server directory
- [ ] Configure environment
- [ ] Deploy with `fly deploy`

**Backend Checklist:**
- [ ] Backend deployed and accessible
- [ ] Environment variables set
- [ ] Redis connected (use managed Redis)
- [ ] Health check endpoint works: `/api/health`
- [ ] Note deployment URL for frontend config

### 4.2 Frontend Deployment (Choose one)

**Option A: Vercel (Recommended - Easy)**
- [ ] Sign up at https://vercel.com
- [ ] Import GitHub repo
- [ ] Root directory: `client`
- [ ] Framework: Vite
- [ ] Build: `npm run build`
- [ ] Output: `dist`
- [ ] Set environment variables:
  - `VITE_API_URL` = your backend URL + /api
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Deploy
- [ ] Get deployment URL

**Option B: Netlify**
- [ ] Sign up at https://netlify.com
- [ ] Connect GitHub repo
- [ ] Base directory: `client`
- [ ] Build: `npm run build`
- [ ] Publish: `dist`
- [ ] Set environment variables
- [ ] Deploy

**Option C: Cloudflare Pages**
- [ ] Sign up at https://pages.cloudflare.com
- [ ] Connect GitHub repo
- [ ] Framework: Vite
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy

**Frontend Checklist:**
- [ ] Frontend deployed and accessible
- [ ] Environment variables set correctly
- [ ] Can access the UI
- [ ] Backend API connection working
- [ ] Note deployment URL

### 4.3 Custom Domain (Optional)
- [ ] Register domain (e.g., Namecheap, Google Domains)
- [ ] Configure DNS for frontend (A/CNAME records)
- [ ] Configure DNS for backend (A/CNAME records)
- [ ] Enable HTTPS/SSL (automatic on Vercel/Netlify)
- [ ] Update CORS settings in backend
- [ ] Update Supabase site URL
- [ ] Update environment variables with new URLs

### 4.4 Production Environment Variables

**Update Server .env:**
```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
```

**Update Client .env:**
```env
VITE_API_URL=https://your-backend-domain.com/api
```

---

## 🔒 Phase 5: Production Hardening (IMPORTANT)

### 5.1 Security
- [ ] Enable HTTPS everywhere (SSL certificates)
- [ ] Add rate limiting to API endpoints
- [ ] Set up CORS whitelist (not *)
- [ ] Enable Supabase email verification
- [ ] Add password strength requirements
- [ ] Implement API request logging
- [ ] Set up error monitoring (Sentry)
- [ ] Review and test RLS policies
- [ ] Add Content Security Policy headers
- [ ] Enable CSRF protection

### 5.2 Performance
- [ ] Enable CDN for frontend static assets
- [ ] Configure Redis caching for analytics
- [ ] Add database connection pooling
- [ ] Optimize images/assets
- [ ] Enable gzip compression
- [ ] Set up database indexes (already done)
- [ ] Monitor API response times
- [ ] Add health check monitoring

### 5.3 Reliability
- [ ] Set up uptime monitoring (UptimeRobot, Better Stack)
- [ ] Configure error alerts (email/Slack)
- [ ] Set up backup strategy for database
- [ ] Implement graceful error handling
- [ ] Add retry logic to workers (exponential backoff)
- [ ] Set up dead letter queue for failed jobs
- [ ] Test disaster recovery process

### 5.4 Monitoring & Logging
- [ ] Set up application monitoring (LogRocket, DataDog)
- [ ] Configure error tracking (Sentry)
- [ ] Add analytics (Google Analytics, Plausible)
- [ ] Monitor Gemini API usage/costs
- [ ] Monitor Supabase usage/costs
- [ ] Set up alerts for high error rates
- [ ] Log all authentication events

---

## 📋 Phase 6: Production Testing (CRITICAL)

### 6.1 Smoke Tests
- [ ] Can access the application
- [ ] Can sign up new account
- [ ] Email verification works
- [ ] Can log in
- [ ] Can create course
- [ ] File upload works
- [ ] Embeddings generate
- [ ] Can create grader
- [ ] Rubric extraction works
- [ ] Can upload submissions
- [ ] OCR extraction works
- [ ] Grading completes
- [ ] Real-time updates work
- [ ] Can override grades
- [ ] Can sign out

### 6.2 Load Testing (Optional but Recommended)
- [ ] Test with 10 concurrent users
- [ ] Test with 50 submissions
- [ ] Monitor memory usage
- [ ] Monitor database connections
- [ ] Check Redis queue performance
- [ ] Verify no memory leaks

### 6.3 Edge Cases
- [ ] Large file uploads (>10MB)
- [ ] Poor quality handwriting
- [ ] Non-standard PDF formats
- [ ] Special characters in text
- [ ] Multiple simultaneous gradings
- [ ] Network interruptions
- [ ] API rate limits

---

## 📢 Phase 7: Launch Preparation (OPTIONAL)

### 7.1 Documentation
- [ ] Create user guide
- [ ] Create video tutorials
- [ ] Set up help center/FAQ
- [ ] Document API endpoints (if public)
- [ ] Create onboarding flow

### 7.2 Legal & Compliance
- [ ] Add Privacy Policy
- [ ] Add Terms of Service
- [ ] Add Cookie Policy (if applicable)
- [ ] GDPR compliance (if EU users)
- [ ] Data retention policy
- [ ] User data export feature

### 7.3 Marketing (If Public)
- [ ] Create landing page
- [ ] Set up social media
- [ ] Prepare launch announcement
- [ ] Create demo video
- [ ] Prepare case studies
- [ ] Product Hunt launch (optional)

---

## 🎯 Minimum to Go Live (MVP Launch)

**Must Have (Can't launch without):**
1. ✅ Supabase configured with migrations
2. ✅ API keys obtained (Gemini + Supabase)
3. ✅ Redis running (local or cloud)
4. ✅ Environment variables set
5. ✅ Backend deployed and accessible
6. ✅ Frontend deployed and accessible
7. ✅ Basic smoke tests passing
8. ✅ HTTPS enabled
9. ✅ Error monitoring set up

**Should Have (Recommended for production):**
- Rate limiting
- Uptime monitoring
- Database backups
- User analytics
- Error logging

**Nice to Have (Can add later):**
- Custom domain
- Email notifications
- Advanced analytics
- User documentation
- Marketing materials

---

## 📊 Estimated Time to Production

**Fast Track (Minimal MVP):**
- Configuration: 1 hour
- Testing: 30 minutes
- Deployment: 1-2 hours
- **Total: 3-4 hours**

**Recommended Path:**
- Configuration: 1 hour
- Testing: 1 hour
- Deployment: 2-3 hours
- Hardening: 2-3 hours
- **Total: 6-8 hours**

**Full Production:**
- Everything above: 8 hours
- Documentation: 4 hours
- Legal/Compliance: 2 hours
- Marketing prep: 4 hours
- **Total: 18-20 hours**

---

## 🚨 Critical Pre-Launch Checklist

Before announcing to users:

- [ ] All environment variables in production
- [ ] Database migrations applied
- [ ] Backups configured
- [ ] Error monitoring active
- [ ] Uptime monitoring active
- [ ] HTTPS working everywhere
- [ ] User signup/login working
- [ ] Core workflow tested end-to-end
- [ ] Support email configured
- [ ] Privacy policy live
- [ ] Terms of service live

---

## 🎉 You're Ready When...

✅ All "Phase 2: Configuration" items complete
✅ All "Phase 3: Testing" items passing
✅ Backend and frontend deployed
✅ Can complete full user workflow in production
✅ Monitoring and alerts configured

**Then you can:** Share with first users, announce publicly, or add to portfolio!

---

## 📞 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google AI Studio:** https://ai.google.dev
- **Railway:** https://railway.app
- **Vercel:** https://vercel.com
- **Redis Cloud:** https://redis.com
- **Sentry:** https://sentry.io
- **UptimeRobot:** https://uptimerobot.com

---

**Current Status:** Local MVP Complete ✅
**Next Step:** Complete Phase 2 (Configuration & Setup)
**Time to Production:** 3-8 hours depending on path chosen

Good luck with your launch! 🚀
