# OutsideAtl Website

OutsideAtl is a TanStack Start / React landing page backed by Supabase for auth, events, RSVPs, signups, contact messages, and applications.

## Windows Setup

1. Install Bun if it is not already available:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Close and reopen PowerShell, then verify:

```powershell
bun --version
```

2. Install dependencies:

```powershell
bun install
```

3. Create your local environment file:

```powershell
Copy-Item .env.example .env
```

4. Edit `.env`:

```powershell
notepad .env
```

Set these values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not put the service role key in frontend JavaScript. It is only used by server functions.

5. Run the app:

```powershell
bun run dev
```

The dev server is usually `http://localhost:5173`.

## Lovable Front-End

This workbase is connected to the Lovable project:

- Project ID: `eb9cfecc-d4dc-404c-8f1b-ffe641f007a6`
- Lovable editor: https://lovable.dev/projects/eb9cfecc-d4dc-404c-8f1b-ffe641f007a6
- Local connection metadata: `.lovable/connection.json`

Check the connection from the repository root:

```powershell
bun run lovable:status
```

The production front-end entrypoints are `src/routes/__root.tsx`, `src/routes/index.tsx`, and
`src/router.tsx`. The project uses `@lovable.dev/vite-tanstack-config` in `vite.config.ts`, so the
local Vite/TanStack setup stays aligned with Lovable's front-end runtime.

## RSC Workspace

`OutsideAtlVite/` is an integrated Bun workspace for future React Server Components experiments. It is not a throwaway starter anymore; it is branded and isolated from the production TanStack Start app.

Run it from the repository root:

```powershell
bun run dev:rsc
bun run build:rsc
bun run preview:rsc
```

## Supabase

The app expects these tables/functions from `supabase/migrations`:

- `events`
- `rsvps`
- `newsletter_subscribers`
- `applications`
- `contact_messages`
- `user_roles`
- `has_role(_user_id, _role)`

Admin access uses Supabase Auth. Sign up at `/auth`, then use the admin page to claim the first admin account. Later admin users should be added through the `user_roles` table.

## Features

- Public event listing from Supabase
- RSVP submissions stored in Supabase
- Newsletter signup stored in Supabase
- Contact messages stored in Supabase
- Intern, freelancer, vendor, artist, and sponsor applications stored in Supabase
- Admin event CRUD
- Admin submission review statuses

## Notes

- `.env` is ignored and should not be committed.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- This project uses Bun. Prefer `bun install`, `bun run dev`, `bun run build`, and `bun run lint`.
- Before deployment, run `bun run build` for the main app and `bun run build:rsc` if you are shipping the RSC workspace.
