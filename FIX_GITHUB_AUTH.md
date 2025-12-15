# 🔧 Fix GitHub Authentication Issue

## Problem
You're authenticated as `Cico-hub` but need to push as `cicology`

## Error Message
```
remote: Permission to cicology/cleverly-ai-grader.git denied to Cico-hub.
fatal: unable to access 'https://github.com/cicology/cleverly-ai-grader.git/': The requested URL returned error: 403
```

---

## Solution 1: Clear Git Credentials (Recommended)

### Step 1: Clear Windows Credential Manager

**Option A: Via Windows Settings**
1. Press `Win + R`
2. Type: `control /name Microsoft.CredentialManager`
3. Click "Windows Credentials"
4. Look for entries starting with `git:https://github.com`
5. Click each one → "Remove"

**Option B: Via Command Line**
```powershell
# Remove GitHub credentials
git credential-manager-core erase
# When prompted, enter:
# protocol=https
# host=github.com
# [Press Enter twice]
```

### Step 2: Try Pushing Again
```bash
git push -u origin main
```

When prompted:
- **Username:** `cicology` (NOT Cico-hub!)
- **Password:** [Your Personal Access Token]

---

## Solution 2: Use Personal Access Token Directly in URL

This bypasses the credential manager:

```bash
# Remove current remote
git remote remove origin

# Add remote with your username in URL
git remote add origin https://cicology@github.com/cicology/cleverly-ai-grader.git

# Push (it will ask for password = your PAT)
git push -u origin main
```

When prompted for password, use your **Personal Access Token**.

---

## Solution 3: Use SSH (Most Reliable)

### Step 1: Generate SSH Key (if you don't have one)
```bash
ssh-keygen -t ed25519 -C "herij46@gmail.com"
```
Press Enter for default location, optionally set a passphrase.

### Step 2: Copy Your Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```
Or on Windows:
```powershell
type C:\Users\heri\.ssh\id_ed25519.pub
```

### Step 3: Add to GitHub
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Title: `Cleverly AI Grader`
4. Paste your public key
5. Click "Add SSH key"

### Step 4: Change Remote to SSH
```bash
git remote remove origin
git remote add origin git@github.com:cicology/cleverly-ai-grader.git
git push -u origin main
```

---

## Getting a Personal Access Token

If you need a new token:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. **Name:** `Cleverly AI Grader Push`
4. **Expiration:** 90 days (or choose)
5. **Scopes:** Check ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

Example token format:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Quick Fix Commands

Try these in order:

```powershell
# 1. Remove old remote
git remote remove origin

# 2. Add remote with your username
git remote add origin https://cicology@github.com/cicology/cleverly-ai-grader.git

# 3. Push
git push -u origin main
# Enter your Personal Access Token when asked for password
```

---

## Verify Your GitHub Repository Exists

Make sure the repository exists at:
```
https://github.com/cicology/cleverly-ai-grader
```

If it doesn't exist:
1. Go to https://github.com/new
2. Repository name: `cleverly-ai-grader`
3. Make it Public or Private
4. **Don't initialize with anything**
5. Click "Create repository"

---

## After Successful Push

Verify at:
```
https://github.com/cicology/cleverly-ai-grader
```

You should see:
- ✅ All your code files
- ✅ Documentation (*.md files)
- ❌ NO .env files
- ❌ NO node_modules

---

## Still Having Issues?

### Check Current Git User
```bash
git config user.name
git config user.email
```

Should show:
```
cicology
herij46@gmail.com
```

### Check Remote URL
```bash
git remote -v
```

Should show:
```
origin  https://cicology@github.com/cicology/cleverly-ai-grader.git (fetch)
origin  https://cicology@github.com/cicology/cleverly-ai-grader.git (push)
```

### Force Update Remote
```bash
git remote set-url origin https://cicology@github.com/cicology/cleverly-ai-grader.git
```

---

## Summary

**The issue is:** Git is using cached credentials for `Cico-hub` instead of `cicology`

**The fix is:** Clear credentials and re-authenticate as `cicology`

**Best method:** Use SSH keys (Solution 3) for permanent fix

**Quick method:** Clear credentials and use Personal Access Token (Solution 1)
