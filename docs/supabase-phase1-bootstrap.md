# Supabase Phase 1 Bootstrap

The hosted QA Hub project intentionally does not contain a permanent "first user becomes ADMIN" path.

## Create the first real administrator

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

## Invite-managed note

QA Hub is intended to be invite/admin-managed. The frontend does not expose signup. If the hosted Supabase Auth project still allows open email signup at the provider level, disable it in the Dashboard before production use.
