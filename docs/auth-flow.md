# Authentication & Provisioning Flow

This document describes the complete authentication and user provisioning system for QA Hub.

## Overview

QA Hub uses Supabase Auth with a three-layer authorization model:

1. **Supabase Auth** - Manages user identities (email/password, invites)
2. **Profiles table** - QA Hub-specific metadata (role, status, name)
3. **Row Level Security (RLS)** - Database-level access control

## Auth State Machine

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    ▼                                                         │
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Create   │───►│   Invite     │───���│   Click Link │───►│  Set Password    │
│  Admin    │    │  (Admin UI)  │    │  (Email)     │    │  /auth/set-      │
└──────────┘    └──────────────┘    └──────────────┘    │  password          │
                                                         └────────┬───────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  /auth/confirm   │
                                                         │  (verify OTP)    │
                                                         └──────────────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  /overview       │
                                                         │  (authenticated) │
                                                         └──────────────────┘
```

### Flow A: Initial Admin Bootstrap

There are two ways to create the first admin:

#### Option 1: Dashboard (Recommended for production)

1. Create user in Supabase Dashboard → Authentication → Users
2. Note the UUID
3. Run SQL:
```sql
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES ('<auth-user-uuid>', 'admin@example.com', 'Admin User', 'ADMIN', 'ACTIVE');
```

#### Option 2: Bootstrap Script (For local/dev)

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
BOOTSTRAP_ADMIN_PASSWORD=SecurePass123! \
BOOTSTRAP_ADMIN_NAME="Admin User" \
npx tsx scripts/bootstrap-admin.ts
```

### Flow B: Normal User Login

```
/login
  → Email + Password form
  → signInWithPassword()
  → If success: getAuthAccessState()
    → profile exists & ACTIVE → /overview
    → profile missing → /access?reason=unprovisioned
    → profile INACTIVE → /access?reason=inactive
  → If fail: /login?error=...
```

### Flow C: Invitation Flow (The Critical Path)

```
1. ADMIN creates invite
   → admin.auth.admin.inviteUserByEmail(email, {redirectTo})
   → Profile created BEFORE invite sent
   
2. User clicks invite link
   → /auth/confirm?token_hash=...&type=invite&next=/auth/set-password
   → verifyOtp({token_hash, type})
   → Session established
   → Redirect to /auth/set-password
   
3. User sets password
   → updateUser({password})
   → Redirect to /overview (via redirect_to)
   
4. Future logins
   → /login → signInWithPassword → /overview
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/public key |
| `SUPABASE_SECRET_KEY` | Yes (server) | Service role key for admin ops |
| `NEXT_PUBLIC_QA_DEMO_MODE` | No | Set to `true` to bypass Supabase |

## Demo Mode

When `NEXT_PUBLIC_QA_DEMO_MODE=true`:
- All auth checks return demo profile
- No Supabase calls are made
- Login page shows demo notice

**Important**: Demo mode must be disabled (`false`) for real auth testing.

## Key Components

### Server Actions (`app/actions/auth.ts`)

- `loginAction()` - Handles email/password login
- `logoutAction()` - Signs out globally

### Service Layer (`services/auth.ts`)

- `getAuthAccessState()` - Determines user's access state
- `getCurrentProfile()` - Returns profile if active
- `requireUser()` - Throws if not active

### Auth Access State

```typescript
type AuthAccessState =
  | { kind: "active"; profile: CurrentProfile }
  | { kind: "unauthenticated" }
  | { kind: "unprovisioned"; email: string }
  | { kind: "inactive"; email: string }
```

### Route Guards

```typescript
// lib/auth-access.ts
function getProtectedRouteRedirect(decision: AccessDecision): string | null
function getLoginRedirect(decision: AccessDecision): string | null
```

## RLS Policies

All tables have RLS enabled. Key policies:

### Read Policies
```sql
-- Most tables: authenticated users can read
create policy <table>_read on <table>
  for select to authenticated using (true);
```

### Write Policies
```sql
-- Profiles: only ADMIN can insert/update
create policy profiles_admin_insert on profiles
  for insert to authenticated 
  with check ((select private.has_role(array['ADMIN'])));
```

### Storage Policies
```sql
-- Evidence: based on execution membership
create policy evidence_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qa-evidence' and exists(...));
```

## Supabase Dashboard Configuration

### Required Settings

1. **Site URL**: `http://localhost:3000` (development) or your production URL
2. **Redirect URLs**:
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/auth/set-password`
   - `http://localhost:3000/`
3. **Email Confirm**: Enable (required for invite flow)

### Email Templates

Customize in Dashboard → Authentication → Email Templates:
- **Invite**: Include the invitation link with correct `redirect_to`
- **Confirmation**: Standard email confirmation

## Troubleshooting

### "Invitation link is invalid or expired"

1. Check if invite email was received
2. Verify link contains valid `token_hash` and `type=invite`
3. Check Supabase email rate limits
4. Ensure site URL is configured correctly

### Redirected to /login after setting password

1. Verify middleware is working (`middleware.ts` exists)
2. Check session cookies are being set
3. Ensure profile exists in database

### "Profile not found" after login

1. Verify profile was created during invite
2. Check profile ID matches auth user ID
3. Ensure profile status is `ACTIVE`

### Demo mode preventing real auth

1. Check `.env.local` has `NEXT_PUBLIC_QA_DEMO_MODE=false`
2. Restart dev server
3. Clear browser cookies

## Testing the Auth Flow

### Manual Test Checklist

1. [ ] Bootstrap creates first admin
2. [ ] Admin can login with email/password
3. [ ] Admin can invite new user
4. [ ] Invite email is received
5. [ ] Clicking link opens set-password page
6. [ ] Setting password succeeds
7. [ ] User redirected to /overview
8. [ ] Future logins work normally
9. [ ] Inactive user denied access
10. [ ] Unprovisioned user shown access page
