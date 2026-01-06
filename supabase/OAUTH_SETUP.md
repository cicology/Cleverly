# OAuth Provider Setup Guide

This guide explains how to configure Google and GitHub OAuth providers for your Cleverly application.

## Prerequisites

- Access to your Supabase project dashboard
- Google Cloud Console account (for Google OAuth)
- GitHub account (for GitHub OAuth)

## Setting up Google OAuth

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if you haven't already
6. Select **Web application** as the application type
7. Add the following to **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
8. Add the following to **Authorized redirect URIs**:
   ```
   https://tjcgbibnyviotuywwapy.supabase.co/auth/v1/callback
   ```
9. Click **Create** and copy your **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/tjcgbibnyviotuywwapy/auth/providers)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and enable it
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

## Setting up GitHub OAuth

### 1. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the application details:
   - **Application name**: Cleverly
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `https://tjcgbibnyviotuywwapy.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Click **Generate a new client secret**
6. Copy your **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/tjcgbibnyviotuywwapy/auth/providers)
2. Navigate to **Authentication** > **Providers**
3. Find **GitHub** in the list and enable it
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

## Testing OAuth Integration

1. Start your development server:
   ```bash
   cd client && npm run dev
   ```

2. Navigate to http://localhost:3000/auth

3. Click on either "Continue with Google" or "Continue with GitHub"

4. Complete the OAuth flow

5. You should be redirected back to your application and logged in

## Production Deployment

When deploying to production:

1. Update the **Authorized redirect URIs** in your OAuth app settings to include your production domain
2. Update the **Site URL** in Supabase Dashboard under **Authentication** > **URL Configuration**:
   - Set **Site URL** to your production domain
3. Update your `.env` files with production URLs

## Troubleshooting

### "redirect_uri_mismatch" error
- Ensure the callback URL in your OAuth app matches exactly: `https://tjcgbibnyviotuywwapy.supabase.co/auth/v1/callback`
- Check that your OAuth app is using the correct protocol (http vs https)

### User not created in profiles table
- The trigger created in migration `007_auto_create_profile.sql` should automatically create a profile
- Check the Supabase logs if profiles are not being created

### OAuth popup blocked
- Ensure your browser allows popups for your domain
- Try using a redirect-based flow instead if popups are consistently blocked

## Additional Providers

To add more OAuth providers (Microsoft, Facebook, etc.):

1. Follow similar steps to create OAuth credentials with the provider
2. Enable the provider in Supabase Dashboard
3. Add the provider button to `client/app/auth/page.tsx`:
   ```typescript
   handleSocialAuth("provider-name")
   ```

## Security Best Practices

- Never commit OAuth credentials to version control
- Use environment variables for sensitive data
- Regularly rotate OAuth secrets
- Monitor OAuth app usage in provider dashboards
- Restrict OAuth scopes to only what's needed
