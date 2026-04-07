# Google OAuth Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users and admins to sign in/up with Google alongside existing email/password auth.

**Architecture:** Add Google as a social provider to the existing Better Auth config. The DB schema already supports OAuth (account table has `providerId`, `accessToken`, etc). Frontend gets a "Continuar con Google" button on both auth pages. Account linking is enabled for trusted Google provider.

**Tech Stack:** Better Auth (social providers), Next.js 16 (app router), React 19, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-07-google-oauth-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/shared/config.ts` | Modify | Add `googleClientId` and `googleClientSecret` env vars |
| `.env.example` | Modify | Document new Google OAuth env vars |
| `src/auth.ts` | Modify | Add Google social provider + account linking config |
| `web/app/auth/sign-in/page.tsx` | Modify | Add Google sign-in button, divider, error handling |
| `web/app/auth/sign-up/page.tsx` | Modify | Add Google sign-up button, divider |

---

### Task 1: Add Google OAuth env vars to config

**Files:**
- Modify: `src/shared/config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add config fields in `src/shared/config.ts`**

In `src/shared/config.ts`, add these two fields to the `config` object, after the `betterAuthSecret` line:

```ts
  // Google OAuth (for social login)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
```

- [ ] **Step 2: Add audit reporting for Google OAuth in `auditConfig()`**

In the `auditConfig()` function, add this block after the `adminApiKey` check (before the `// Report` comment):

```ts
  if (config.googleClientId && config.googleClientSecret) configured.push("Google OAuth");
  else warnings.push("GOOGLE_CLIENT_ID/SECRET empty — Google sign-in disabled");
```

- [ ] **Step 3: Add env vars to `.env.example`**

In `.env.example`, add a new section after the `# ── Auth (Better Auth) ──` block (after `BETTER_AUTH_SECRET=`):

```env

# ── Google OAuth (Social Login) ──
# Create at: https://console.cloud.google.com/apis/credentials
# Redirect URI: {BASE_URL}/api/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/config.ts .env.example
git commit -m "feat: add Google OAuth env vars to config"
```

---

### Task 2: Configure Better Auth with Google provider

**Files:**
- Modify: `src/auth.ts`

- [ ] **Step 1: Add Google social provider and account linking to `src/auth.ts`**

Replace the entire contents of `src/auth.ts` with:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import { config } from "./shared/config.js";

export const auth = betterAuth({
  baseURL: config.baseUrl,
  secret: config.betterAuthSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
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
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cache
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "client",
        input: false,
      },
    },
  },
  trustedOrigins: [
    config.webUrl,
  ],
});
```

The key additions are:
- `socialProviders.google` — registers Google as an OAuth provider
- `account.accountLinking` — when a Google login matches an existing email, the accounts are automatically linked (Google email is always verified, and it's a trusted provider)

- [ ] **Step 2: Verify the server compiles**

```bash
npx tsx --no-warnings -e "import './src/auth.js'; console.log('auth ok')"
```

Expected: prints `auth ok` without errors.

- [ ] **Step 3: Commit**

```bash
git add src/auth.ts
git commit -m "feat: add Google social provider to Better Auth config"
```

---

### Task 3: Add Google sign-in button to Sign In page

**Files:**
- Modify: `web/app/auth/sign-in/page.tsx`

- [ ] **Step 1: Update the Sign In page**

Replace the entire contents of `web/app/auth/sign-in/page.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, signIn } from "@/lib/auth-client";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signIn.email({
      email,
      password,
    });

    if (authError) {
      setError(authError.message ?? "Error al iniciar sesion");
      setLoading(false);
      return;
    }

    // Fetch session to check role for routing
    const { data: session } = await authClient.getSession();
    const user = session?.user as { role?: string } | undefined;
    if (user?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);

    const { error: authError } = await signIn.social({
      provider: "google",
      callbackURL: "/auth/callback",
    });

    if (authError) {
      setError(
        authError.code === "ACCOUNT_ALREADY_EXISTS"
          ? "Ya existe una cuenta con este email. Inicia sesion con tu contrasena para vincular tu cuenta de Google."
          : authError.message ?? "Error al iniciar sesion con Google"
      );
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            criteria<span className="text-[#ffd053]">.</span>agency
          </h1>
          <p className="text-[#9d9a9c] text-sm mt-2">
            Inicia sesion para continuar
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#1a1a1a] font-medium rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {googleLoading ? "Conectando..." : "Continuar con Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-sm text-[#666]">o</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#e0e0e0] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#e0e0e0] mb-1.5"
              >
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ffd053] text-[#0a0a0a] font-semibold rounded-lg px-4 py-3 hover:bg-[#ffda73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Iniciar sesion"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#666]">
              No tienes cuenta?{" "}
              <Link
                href="/auth/sign-up"
                className="text-[#ffd053] hover:underline"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Key changes from the original:
- Added `GoogleIcon` SVG component (official Google "G" colors)
- Added `handleGoogleSignIn` function with `signIn.social({ provider: "google" })`
- Added `googleLoading` state
- Error message block moved outside the form (applies to both Google and email errors)
- Added white Google button before the form
- Added "o" divider between Google button and email form
- Special error message for `ACCOUNT_ALREADY_EXISTS` code
- `callbackURL` points to `/auth/callback` (a new lightweight redirect page, see Task 5)

- [ ] **Step 2: Commit**

```bash
git add web/app/auth/sign-in/page.tsx
git commit -m "feat: add Google sign-in button to login page"
```

---

### Task 4: Add Google sign-up button to Sign Up page

**Files:**
- Modify: `web/app/auth/sign-up/page.tsx`

- [ ] **Step 1: Update the Sign Up page**

Replace the entire contents of `web/app/auth/sign-up/page.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signUp.email({
      name,
      email,
      password,
    });

    if (authError) {
      setError(authError.message ?? "Error al crear la cuenta");
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  async function handleGoogleSignUp() {
    setError("");
    setGoogleLoading(true);

    const { error: authError } = await signIn.social({
      provider: "google",
      callbackURL: "/auth/callback",
    });

    if (authError) {
      setError(authError.message ?? "Error al registrarse con Google");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            criteria<span className="text-[#ffd053]">.</span>agency
          </h1>
          <p className="text-[#9d9a9c] text-sm mt-2">
            Crea tu cuenta para comenzar
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#1a1a1a] font-medium rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {googleLoading ? "Conectando..." : "Continuar con Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-sm text-[#666]">o</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#e0e0e0] mb-1.5"
              >
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#e0e0e0] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#e0e0e0] mb-1.5"
              >
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
                placeholder="Minimo 8 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ffd053] text-[#0a0a0a] font-semibold rounded-lg px-4 py-3 hover:bg-[#ffda73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#666]">
              Ya tienes cuenta?{" "}
              <Link
                href="/auth/sign-in"
                className="text-[#ffd053] hover:underline"
              >
                Iniciar sesion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Key changes from the original:
- Added `GoogleIcon` SVG component (same as sign-in page)
- Added `handleGoogleSignUp` function using `signIn.social()` (Google uses the same endpoint for sign-in and sign-up — Better Auth creates the account if it doesn't exist)
- Added `googleLoading` state
- Error block moved outside form
- Google button + divider added before the form
- `callbackURL` points to `/auth/callback`

- [ ] **Step 2: Commit**

```bash
git add web/app/auth/sign-up/page.tsx
git commit -m "feat: add Google sign-up button to registration page"
```

---

### Task 5: Add OAuth callback redirect page

**Files:**
- Create: `web/app/auth/callback/page.tsx`

After Google OAuth completes, Better Auth redirects to `callbackURL`. We need a lightweight page at `/auth/callback` that fetches the session, checks the user's role, and redirects accordingly.

- [ ] **Step 1: Create the callback page**

Create `web/app/auth/callback/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const { data: session } = await authClient.getSession();
      const user = session?.user as { role?: string } | undefined;
      if (user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
    redirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-[#9d9a9c] text-sm">Redirigiendo...</p>
    </div>
  );
}
```

This page:
- Fetches the session (which Better Auth just created via the OAuth callback)
- Routes admin users to `/admin`, clients to `/`
- Shows a minimal loading state while redirecting

- [ ] **Step 2: Commit**

```bash
git add web/app/auth/callback/page.tsx
git commit -m "feat: add OAuth callback page with role-based redirect"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Verify backend compiles**

```bash
npx tsx --no-warnings -e "import './src/auth.js'; console.log('auth ok')"
```

Expected: `auth ok`

- [ ] **Step 2: Verify frontend compiles**

```bash
cd web && npx next build --no-lint 2>&1 | tail -20
```

Expected: Build completes without errors. The auth pages should be listed in the output.

- [ ] **Step 3: Document Google Console setup for user**

Print the following instructions for the user to set up their Google Cloud credentials:

1. Go to https://console.cloud.google.com/
2. Create or select a project
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins: `http://localhost:3000`
7. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Copy Client ID and Client Secret to `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
