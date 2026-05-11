# Next.js Supabase Multi-Tenant API Setup

**Skill Type:** Multi-step workflow  
**Scope:** Project initialization  
**Complexity:** Advanced  
**Time:** ~30 minutes  

## Overview

This skill guides you through setting up a production-ready Next.js API server with Supabase multi-tenant architecture. It covers project scaffolding, Supabase integration, API route structure, type safety, build optimization, and deployment configuration.

## Prerequisites

- Node.js 18+ installed
- Supabase project created (with schema already applied or ready to apply)
- Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for auth/admin operations)

## Step 1: Initialize Next.js Project

1. **Create project with dependencies:**
   ```bash
   npm init next-app my-api
   cd my-api
   npm install @supabase/ssr @supabase/supabase-js
   ```

2. **Update `package.json`:**
   - Ensure Next.js ≥16.x for latest features
   - Ensure React 19.x for server components

3. **Create `.env.local`:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```

4. **Verify no TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

## Step 2: Set Up Supabase Clients

**Create `src/lib/supabase/client.ts`** (browser client):
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

**Create `src/lib/supabase/server.ts`** (server client with cookie handling):
- Use `createServerClient` with `getAll` and `setAll` cookie methods
- Create both `createClient()` and `createServiceClient()` functions
- Use `CookieOptions` type from `@supabase/ssr` for proper typing

**Create `src/lib/utils/auth.ts`** (auth helper):
- Extract `getAuthenticatedSeller()` function to avoid repetition
- Returns: `{ user, seller, supabase, error }`
- Used in protected route handlers

## Step 3: Configure Middleware/Proxy

**Create `src/middleware.ts`:**
- Define `PUBLIC_ROUTES` for endpoints that don't need auth (register, login)
- Use `createServerClient` in middleware
- Check `auth.getUser()` and return 401 if unauthorized
- Use proper type annotations for cookie methods

**Quality Check:**
- Middleware runs before all API routes (verify matcher pattern)
- Public routes bypass auth check
- Session refresh happens automatically via cookies

## Step 4: Build Response Helpers

**Create `src/lib/utils/response.ts`:**
```typescript
- successResponse(data, status)    → { success: true, data }
- errorResponse(message, status)    → { success: false, error }
- paginatedResponse(data, meta)     → { success, data, meta with totalPages }
```

**Quality Check:**
- Consistent response format across all routes
- Proper HTTP status codes (201 for POST, 400 for validation, 401 for auth, 404 for not found, 500 for errors)

## Step 5: Create API Routes

**Pattern for each resource (products, orders, customers, etc.):**

### List + Create route (`/api/resource/route.ts`):
```typescript
GET  → fetch with pagination, filtering, searching
POST → create new record (validate input, check auth)
```

### Detail routes (`/api/resource/[id]/route.ts`):
```typescript
GET    → fetch single record
PUT    → update record (partial updates, validate)
DELETE → delete record
```

**For each route:**
1. Call `getAuthenticatedSeller()` to verify auth + get seller context
2. Use `company_id` from seller for data isolation (RLS handles it)
3. Validate input: required fields, constraints (price ≥ 0, etc.)
4. Batch queries where possible (Promise.all for independent operations)
5. Return proper HTTP status codes and response format

### Special Routes (Authentication):
- `POST /api/auth/register` → Create company + seller_profile (uses service role)
- `POST /api/auth/login` → Return session + seller profile
- `GET /api/auth/me` → Return authenticated user info
- `POST /api/auth/logout` → Sign out

## Step 6: Handle TypeScript Type Safety

**Checklist:**
- ✅ Import types correctly: `type CookieOptions from "@supabase/ssr"`
- ✅ Type callback parameters in cookie methods
- ✅ Use `Record<string, unknown>` for partial updates
- ✅ Type route params: `type Params = { params: Promise<{ id: string }> }`
- ✅ Run `npx tsc --noEmit` before each deploy

**Common Errors:**
- "Parameter implicitly has 'any' type" → Add explicit type annotations
- "Cannot find module" → Run `npm install` after adding dependencies
- Deprecated signatures → Use newer API (e.g., `getAll`/`setAll` vs `get`/`set`)

## Step 7: Configure Next.js for Deployment

**Update `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/ssr"],
};
```

**Create root page (`src/app/page.tsx`):**
- Display API endpoint list (useful for debugging)
- Prevents 404 on root URL

**Build and verify:**
```bash
npm run build
```
- Check for 0 errors, 0 warnings
- All routes should appear in build output
- Routes marked as `○ (Static)` or `ƒ (Dynamic)` as expected

## Step 8: Deploy Configuration

### For Vercel:
- Add env variables in dashboard
- Deployment auto-triggers on git push
- No config file needed (Next.js auto-detected)

### For Netlify:
**Create `netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Add env variables in Netlify dashboard**

### For Other Platforms:
- Ensure platform supports Node.js 18+ and Next.js
- Set env variables in platform dashboard
- Run `npm run build` to verify build succeeds locally first

## Validation Checklist

Before deploying:
- [ ] `npm run build` succeeds with 0 errors
- [ ] All API routes listed in build output
- [ ] TypeScript compiles clean: `npx tsc --noEmit`
- [ ] `.env.local` has all 3 Supabase keys
- [ ] `.env.local` is in `.gitignore`
- [ ] Root `/` page returns 200 (not 404)
- [ ] Auth middleware protects all `/api/*` routes except register/login
- [ ] Response format consistent across all endpoints

## Common Pitfalls

1. **Missing `.env.local`** → API returns 500 (env var undefined)
2. **Wrong `PUBLISHABLE_KEY`** → Auth fails silently
3. **Missing `SUPABASE_SERVICE_ROLE_KEY`** → Registration fails (can't create company)
4. **Not exporting response types correctly** → TypeScript errors in calling code
5. **Pagination off-by-one** → `from = (page - 1) * limit; to = from + limit - 1`
6. **RLS policies not matching** → 401/403 errors on queries

## Example Prompts to Use This Skill

- "Set up a Next.js API with Supabase for a [domain] app with [list of resources]"
- "I have a Supabase schema, create the API routes to match it"
- "Help me add [new resource] to my existing Next.js Supabase API"
- "Deploy my Next.js API to [Vercel/Netlify/other]"

## Related Skills to Create Next

- **Supabase RLS & Auth** — Setting up RLS policies and auth middleware
- **API Documentation** — Auto-generating OpenAPI/Swagger from route handlers
- **Database Migrations** — Creating and managing Supabase migrations
- **Error Handling & Logging** — Comprehensive error handling and observability
- **Testing API Routes** — Unit and integration tests for Next.js API

---

**Last Updated:** 2026-05-11  
**Version:** 1.0
