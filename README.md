# QA Hub

Mock-driven frontend for KBVS manual QA and release-readiness workflows.

## Frontend demo mode

Supabase integration is intentionally deferred. Run the application and its
production build explicitly in demo mode:

```bash
bun run dev:demo
bun run build:demo
```

Copy `.env.example` to `.env.local` if you prefer to keep demo mode enabled for
all local commands. Leave the Supabase variables unset while working on the
mock frontend.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```
