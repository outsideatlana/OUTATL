# OutsideAtl Website

OutsideAtl is a Vite + React landing page with a small Express API backed by Supabase for events, RSVPs, signups, contact messages, applications, and admin tools.

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
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`

Do not put the service role key in frontend JavaScript. It is only used by server functions.
Do not prefix admin credentials with `VITE_`; they must remain server-only.

5. Run the app:

```powershell
bun run dev
```

The dev server is usually `http://localhost:5173`.

## Supabase

The app expects these tables/functions from `supabase/migrations`:

- `events`
- `rsvps`
- `newsletter_subscribers`
- `applications`
- `contact_messages`
- `deal_private_event_signups`

Public event reads use the Supabase publishable key and degrade to an empty event list if Supabase is unavailable during local development, so the homepage can still boot.

Admin access uses a private username and password from `.env` or `.env.local`. The `/auth` page does not expose signup. Admin tokens are signed server-side with `ADMIN_AUTH_SECRET`; event CRUD and submission review routes validate that token before using server-only Supabase access.

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
- `bun run dev` starts the Express API and Vite middleware together at `http://localhost:5173`.
- `bun run build` creates the static React build in `dist`; `bun start` serves that build through Express.
