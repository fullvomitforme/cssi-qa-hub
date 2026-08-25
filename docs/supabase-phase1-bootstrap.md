# Supabase Phase 1 Bootstrap

The hosted QA Hub project intentionally does not contain a permanent "first user becomes ADMIN" path.

## Create the first real administrator

### Option 1: Dashboard (Recommended)

1. In the Supabase Dashboard, open `Authentication -> Users`.
2. Create a user manually and mark the email as confirmed.
3. Copy the new Auth user UUID.
4. In the SQL Editor, run:

```sql
insert into public.profiles (id, email, full_name, role, status)
values (
  '<auth-user-uuid>',
  '<admin-email>',
  '<display-name>',
  'ADMIN',
  'ACTIVE'
);
```

This bootstrap path preserves the deployed RLS and `private.guard_profile_role()` protections. It does not weaken runtime authorization and it does not rely on a browser-visible service role.

### Option 2: Bootstrap Script (Local/Development)

For local development or initial setup, use the bootstrap script:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
BOOTSTRAP_ADMIN_PASSWORD=SecurePass123! \
BOOTSTRAP_ADMIN_NAME="Admin User" \
npx tsx scripts/bootstrap-admin.ts
```

The script will:
- Create or update the auth user
- Create or update the profile
- Set role to ADMIN
- Set status to ACTIVE
- Be idempotent (safe to run multiple times)

## Invite-managed note

QA Hub is intended to be invite/admin-managed. The frontend does not expose signup. If the hosted Supabase Auth project still allows open email signup at the provider level, disable it in the Dashboard before production use.

## Environment Setup

Ensure these environment variables are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-service-role-key
```

## Verification

After bootstrapping, verify:

```bash
# Check auth users
node -e "
const {createClient} = require('@supabase/supabase-js');
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
c.auth.admin.listUsers().then(r => console.log(r.data.users.map(u => u.email)));
"

# Check profiles
node -e "
const {createClient} = require('@supabase/supabase-js');
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
c.from('profiles').select('*').then(r => console.log(r.data));
"
```
