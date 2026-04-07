# Google OAuth Login

**Date:** 2026-04-07
**Status:** Draft

## Goal

Allow users and admins to sign in (and sign up) using their Google account, in addition to the existing email/password method.

## Current State

- **Auth library:** Better Auth v1.6.0 with Drizzle adapter (PostgreSQL)
- **Existing method:** Email/password with 8-char minimum
- **DB schema:** `account` table already has `providerId`, `accessToken`, `refreshToken`, `idToken`, `scope` columns — OAuth-ready
- **Frontend:** Next.js 16 app router, dark theme (`#0a0a0a` bg, `#ffd053` accent)
- **Auth client:** `better-auth/react` with `createAuthClient`

No database migrations are needed.

## Design

### 1. Backend — `src/auth.ts`

Add Google as a social provider to the Better Auth config:

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // ...existing config...
  socialProviders: {
    google: {
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
});
```

Better Auth handles the full OAuth flow automatically:
- `GET /api/auth/signin/social` — initiates Google redirect
- `GET /api/auth/callback/google` — handles the callback

**Account linking behavior:** When `accountLinking.enabled` is true and Google is a trusted provider, Better Auth will automatically link Google accounts to existing email/password accounts **if the Google email is verified** (which it always is). If the email matches an existing account, the Google provider is added to the same user — no duplicate accounts.

However, per the user's preference for a confirmation step: if Better Auth returns an `ACCOUNT_ALREADY_EXISTS` error (when linking is not automatic for the specific scenario), the UI will show a message asking the user to sign in with their password first.

### 2. Environment Variables — `src/shared/config.ts`

Add two new config fields:

```
GOOGLE_CLIENT_ID     — OAuth 2.0 Client ID from Google Cloud Console
GOOGLE_CLIENT_SECRET — OAuth 2.0 Client Secret from Google Cloud Console
```

Both are optional — Google login button only shows when both are configured.

Update `.env.example` with these vars.

### 3. Frontend Auth Client — `web/lib/auth-client.ts`

No changes needed. The `createAuthClient` from `better-auth/react` automatically exposes `signIn.social()` when social providers are configured on the server.

### 4. UI — Sign In Page (`web/app/auth/sign-in/page.tsx`)

Add before the email/password form:

1. **Google button:** Full-width button with Google "G" SVG icon and text "Continuar con Google"
   - Style: `bg-white text-[#1a1a1a]` (Google's branding guidelines require a light button)
   - On click: `signIn.social({ provider: "google", callbackURL: "/admin" })`
   - After callback, same role-based routing logic applies (admin -> `/admin`, client -> `/`)

2. **Divider:** Horizontal line with centered "o" text
   - Style: `border-[#2a2a2a]` line, `text-[#666]` for "o"

3. **Error handling:** If Google returns `ACCOUNT_ALREADY_EXISTS`, show:
   > "Ya existe una cuenta con este email. Inicia sesion con tu contrasena para vincular tu cuenta de Google."

### 5. UI — Sign Up Page (`web/app/auth/sign-up/page.tsx`)

Same Google button and divider as sign-in page. When a new user signs up via Google:
- Account is created with `role: "client"` (default)
- Name and email are pulled from Google profile
- No password is set (user can add one later if desired)
- Redirect to `/admin` (matches current sign-up behavior)

### 6. Post-Login Role Routing

Both pages need the same routing logic after Google sign-in callback:
- Fetch session with `authClient.getSession()`
- If `user.role === "admin"` → redirect to `/admin`
- Otherwise → redirect to `/`

For the Google flow, this happens on the callback URL. The `callbackURL` param in `signIn.social()` is where Better Auth redirects after success. We set it to a route that checks the role and redirects accordingly.

### 7. Conditional Rendering

The Google button only renders when `GOOGLE_CLIENT_ID` is set. To expose this to the frontend:
- Add `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` to env when Google is configured
- Or simpler: always show the button and let the server return an error if not configured

**Decision:** Always show the button. If Google isn't configured, the server-side error is clear enough, and this avoids needing an extra env var for the frontend.

## Google Cloud Console Setup Guide

For the user to create credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized JavaScript origins:**
   - `http://localhost:3000` (development)
   - Production URL when deployed
7. Add **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `{PRODUCTION_URL}/api/auth/callback/google` (production)
8. Copy the **Client ID** and **Client Secret** to your `.env`

Also enable the **Google+ API** or **Google People API** in the API library (Better Auth uses it to fetch profile info).

## Files Changed

| File | Change |
|------|--------|
| `src/auth.ts` | Add `socialProviders.google` and `account.accountLinking` config |
| `src/shared/config.ts` | Add `googleClientId` and `googleClientSecret` env vars |
| `.env.example` | Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |
| `web/app/auth/sign-in/page.tsx` | Add Google button, divider, error handling |
| `web/app/auth/sign-up/page.tsx` | Add Google button, divider |

## Not In Scope

- Other OAuth providers (GitHub, Apple, etc.) — can be added later with the same pattern
- Email verification flow
- "Link Google account" from user settings/profile page
- Password reset flow
