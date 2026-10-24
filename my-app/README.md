# Shadow Fight Arena Tournament Platform

A tournament management platform for Shadow Fight Arena (SFA): players discover, register
for, and compete in 1v1 and 3v3 tournaments; admins configure tournaments end-to-end, verify
UPI payments, generate brackets/groups, and record results.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · PostgreSQL ·
Prisma 7 · Auth.js v5 (Credentials, JWT sessions) · Zod · React Hook Form · Vitest · Playwright

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Database.** This project targets Neon Postgres (or any Postgres). Copy `.env.example` to
   `.env` and set `DATABASE_URL`. For local-only dev without Neon, `npx prisma dev` runs an
   ephemeral local Postgres — copy its printed **TCP** connection string (not the
   `prisma+postgres://` proxy URL) into `DATABASE_URL`.

3. **Apply migrations**

   ```bash
   npx prisma migrate deploy
   ```

4. **Generate an `AUTH_SECRET`** and set it in `.env`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"
   ```

5. **Create the first Super Admin** (see [Initial admin setup](#initial-admin-setup) below).

6. **(Optional) Seed sample data** — fictional tournaments, players, and a fighter catalog:

   ```bash
   npm run db:seed
   ```

7. **Run the dev server**

   ```bash
   npm run dev
   ```

## Initial admin setup

There is no hardcoded admin account. The first Super Admin is created via a one-time,
token-gated script:

```bash
# Set a one-time secret in .env first:
#   SUPER_ADMIN_SETUP_TOKEN="<some random string>"
npm run create-super-admin -- --email=you@example.com --username=you --token=<value of SUPER_ADMIN_SETUP_TOKEN>
```

The script:
- Refuses to run unless `--token` matches `SUPER_ADMIN_SETUP_TOKEN` in the environment.
- Refuses to run if a Super Admin already exists (grant further Super Admins from the admin
  UI instead, once that flow exists — see [Known limitations](#known-limitations)).
- Generates a random password and prints it **once**. It is never passed on the command line
  or hardcoded. Log in immediately and treat that password as sensitive.

Further **Tournament Admin** accounts are currently created by directly updating a user's
`role` in the database (`User.role = 'TOURNAMENT_ADMIN'`) — there's no admin-management UI yet
(see [Known limitations](#known-limitations)).

## Testing

```bash
npm run lint        # ESLint
npx tsc --noEmit     # Type check
npm test             # Vitest unit tests (bracket generation, standings)
npm run build        # Production build
npm run test:e2e     # Playwright E2E (requires `npm run dev` running separately)
```

**A note on E2E flakiness in dev mode:** the Next.js 16 Turbopack *dev* server intermittently
corrupts the HTTP response stream on the navigation immediately following a Server Action
`redirect()` or `router.refresh()` call. This has been confirmed, via direct database
inspection, to be a rendering/streaming issue only — the underlying mutation always completes
correctly. It does not reproduce against a production build (`next build && next start`).
`playwright.config.ts` sets `retries: 3` to absorb this dev-only noise without masking real
regressions, which fail consistently rather than intermittently.

## Email

**Email delivery is intentionally not implemented in this build**, per product decision —
there is no email verification, password reset email, or transactional notification system.
Registration, login, and all workflows function without it. If this is revisited:

- `EMAIL_PROVIDER_API_KEY` / `EMAIL_FROM_ADDRESS` are reserved in `.env.example` for a Resend
  integration.
- The `EmailDeliveryLog` table exists in the schema (idempotency key, status, retry count)
  for exactly this purpose, unused until a provider is wired up.

## Payment evidence (no file storage)

Per product decision, there is **no file upload / object storage subsystem**. Payment proof
works like this instead:
- Players submit a **transaction reference / UTR** (text field) through the app.
- If the admin configures a Discord link for a tournament, players are shown that link and
  asked to post their payment screenshot there directly.
- Admins cross-check the transaction reference against their UPI app / Discord manually
  before approving a payment.

QR codes, cover images, and fighter portraits are plain URL fields (paste a link to an image
hosted elsewhere) rather than an upload flow. This was a deliberate scope decision, not a
limitation to fix — see the conversation history for the reasoning (screenshot uploads add a
full object-storage subsystem for a step the organizer's Discord already handles).

## Architecture notes worth knowing

- **Cache Components disabled.** The scaffold had Next 16's `cacheComponents` flag on, which
  requires every session/request-dependent read to sit behind `Suspense` + `use cache: private`.
  Nearly every page here (auth, dashboards, payment queues, live brackets) is request-dependent,
  so the conventional rendering model is used instead.
- **Middleware is `proxy.ts`** in Next 16 (renamed from `middleware.ts`). It does *optimistic*
  role-based redirects only; every admin page and Server Action independently re-checks
  authorization server-side via `lib/auth/guards.ts` — the proxy is not the real security
  boundary, per the spec's explicit requirement.
- **Status is always derived, never stored for most states.** `lib/tournaments/status.ts`
  computes Draft/Upcoming/Registration Open/Full/Closed/Check-in Open/In Progress/
  Completed/Cancelled from persisted fields + current time + live registration counts.
  Only Draft and Cancelled are states an admin sets directly.
- **Standings are recomputed, never stored.** `lib/tournaments/standings.ts` derives group
  tables from official `Match`/`MatchResult` rows every time, so correcting a result can't
  leave a stale table behind.
- **Bracket generation is pure and unit-tested.** `lib/tournaments/bracket.ts` has no database
  dependency — see `bracket.test.ts` for seeding/bye coverage at 4/6/8/10 participants.
- **Money is stored in minor units** (paise) as `Int`, never floating point.
- **Registration capacity is concurrency-safe** via a Postgres advisory transaction lock
  (`pg_advisory_xact_lock`) rather than a naive read-then-write, so simultaneous registrations
  can't overrun `maxParticipants`.

## External integrations requiring credentials

| Integration | Required for | Status |
|---|---|---|
| Neon (or any) Postgres | Everything | **Required** — set `DATABASE_URL` |
| Resend (or any email provider) | Email verification, notifications | **Not implemented** — skipped per product decision |
| Object storage (S3/R2/etc.) | File upload for images/payment evidence | **Not implemented** — URL fields used instead, per product decision |

No other third-party credentials are required to run this app.

## Known limitations

These are explicit scope decisions or known gaps, not silently-faked functionality:

- **No email.** No verification, password reset, or notification emails. All flows work without
  email; there's simply no delivery channel.
- **No file uploads.** QR codes/images are URL fields; payment proof is a transaction
  reference, with an optional organizer Discord link for screenshots.
- **No prize payout recording.** The schema (`TournamentPrizePayout`) supports it, but there is
  no admin UI to mark a prize as actually paid — out of scope per product decision.
- **No announcements/notifications system.** Out of scope per product decision; the
  `Announcement` and `Notification` tables exist in the schema but are unused.
- **Player-submitted match results are not wired up.** Only admins can record official
  results today (`recordOfficialResultAction`). The `Dispute` model and open/resolve actions
  exist and work, but there's no UI yet for a player to submit a conflicting self-reported
  result that would trigger one automatically.
- **No admin-management UI.** Granting `TOURNAMENT_ADMIN`/`SUPER_ADMIN` roles beyond the first
  Super Admin currently requires a direct database update.
- **No waitlist promotion automation.** Waitlisted registrations are created correctly when a
  tournament fills up, but nothing currently promotes the next waitlisted player when a slot
  frees up (withdrawal, expiry, rejection).
- **No manual seeding UI.** `Tournament.seedingMethod = MANUAL` is supported in the schema and
  bracket generator (it reads each registration's `seed` field), but there's no admin UI to
  actually assign seed numbers — only `RANDOM` seeding is reachable through the UI today.
- **Bracket visualization is a simple grouped list**, not a graphical bracket tree. Functional
  on desktop and mobile, not visually polished.
- **"Completed" tournament status** currently derives only from the configured end time, not
  from "all matches finished" — a tournament with an end date in the future will show as
  "In Progress" even if every match is done.

## Project structure

```
app/                          Routes (App Router)
  (auth)/login, register      Public auth pages
  admin/                      Admin dashboard, tournament wizard, bracket/match/payment/
                               registration/dispute management, fighter catalog, audit log
  dashboard/                  Player dashboard, registration detail/payment
  tournaments/                Public discovery, detail, bracket/standings
lib/
  actions/                    Server Actions (one file per domain)
  auth/                       Password hashing, session guards (server-side authorization)
  tournaments/                Pure domain logic: status derivation, bracket generation,
                               standings — all unit-tested, no DB dependency
  validations/                Zod schemas
  prisma.ts                   Prisma client (driver adapter, see note below)
prisma/
  schema.prisma                Full data model
  seed.ts                      Fictional sample data
e2e/                          Playwright specs
scripts/create-super-admin.ts Initial admin bootstrap
```

### Prisma 7 driver adapter note

This project uses Prisma 7's `prisma-client` generator (ESM output) with the `pg` driver
adapter (`@prisma/adapter-pg`), not the legacy `prisma-client-js`. The connection string lives
in `prisma.config.ts` (CLI/migrations) and is passed explicitly to `PrismaPg` in `lib/prisma.ts`
(app runtime) — Prisma 7 no longer reads `url` from the `datasource` block in `schema.prisma`.

## Deployment

1. Provision a Postgres database (Neon recommended) and a hosting target with Node.js runtime
   support (Vercel, Railway, Fly.io, etc.) — this app uses Server Actions and dynamic rendering
   throughout, so a fully static/serverless-only host won't work.
2. Set all variables from `.env.example` in the host's environment, especially `DATABASE_URL`,
   `AUTH_SECRET`, and `APP_BASE_URL` (your real deployed URL).
3. Run `npx prisma migrate deploy` against the production database before first boot.
4. Run the `create-super-admin` script once, against production, to bootstrap the first admin.
5. `npm run build && npm run start`.

Cookies are `Secure` in production, so the app must be served over HTTPS — testing a
production build locally over plain HTTP will appear to "log in" successfully but the session
cookie won't persist (this is correct behavior, not a bug).
