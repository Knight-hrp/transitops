# TransitOps App

Next.js application for the **Smart Transport Operations Platform**.

This README covers local setup, environment config, modules, RBAC, seeding, and the demo workflow.

---

## Features

- **Authentication** — register/login with JWT HttpOnly cookie; four roles
- **Vehicles & drivers** — CRUD, status tracking (`Available` / `On Trip` / `In Shop` / `Suspended`)
- **Trips** — create, list (status filters), dispatch / complete / cancel with atomic vehicle + driver updates
- **Smart Dispatch** — rule-based vehicle scoring (capacity, cost, mileage, maintenance risk)
- **Validations** — license expiry, suspension, capacity, conflicts, open maintenance
- **Maintenance, fuel, expenses** — operational logging tied to vehicles (and trips where relevant)
- **Dashboard / analytics / safety** — role-scoped views

---

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- A PostgreSQL database (Neon recommended)

---

## Setup

```bash
# from this directory (transitops/transitops in a nested clone, or the app root)
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require&pgbouncer=true&connection_limit=1"
JWT_SECRET="replace-with-a-long-random-string"
```

Use Neon’s **pooled** (`-pooler`) connection string with `pgbouncer=true` to avoid idle connection drops in serverless Postgres.

```bash
npx prisma generate
# Optional: push schema if your DB is empty / out of date
npx prisma db push

# Base seed (roles, sample fleet/drivers/maintenance) — safe-ish upserts for roles/vehicles/drivers
npm run db:seed

# Optional: bulk demo data (~35 rows per major table)
npm run db:seed:bulk

npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build & serve |
| `npm run lint` | ESLint |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Base seed |
| `npm run db:seed:bulk` | Idempotent bulk demo seed |

---

## Roles (RBAC)

Defined in `src/lib/permissions.js`. Nav and home CTAs follow these pages.

| Role | Typical pages | Notes |
|------|---------------|--------|
| **Fleet Manager** | Dashboard, vehicles, drivers, maintenance, analytics | Fleet ops |
| **Dispatcher** | Dashboard, trips, new trip, vehicles, drivers | Only role that can manage trips / Smart Dispatch |
| **Safety Officer** | Dashboard, drivers, safety | Compliance / scores |
| **Financial Analyst** | Dashboard, vehicles, fuel, expenses, analytics | Cost tracking |

Trip APIs (`/api/trips/*`, `/api/vehicles/available`, `/api/drivers/available`) require a signed-in **Dispatcher**.

### Demo logins (after `db:seed:bulk`)

| Email | Password | Role cycle |
|-------|----------|------------|
| `demo.user01@transitops.com` | `password123` | Fleet Manager |
| `demo.user02@transitops.com` | `password123` | **Dispatcher** |
| `demo.user03@transitops.com` | `password123` | Safety Officer |
| `demo.user04@transitops.com` | `password123` | Financial Analyst |

`demo.user05`…`demo.user35` continue the same role cycle. Existing team accounts (e.g. registered via `/register`) still work.

---

## App routes

| Path | Description |
|------|-------------|
| `/` | Home (role-aware CTAs) |
| `/login` `/register` | Auth |
| `/dashboard` | Role-scoped dashboard |
| `/trips` `/trips/new` `/trips/[id]` | Trip list, create + Smart Dispatch, detail actions |
| `/vehicles` `/drivers` | Fleet CRUD |
| `/maintenance` `/fuel` `/expenses` | Ops logs |
| `/analytics` `/safety` | Insights / compliance |

---

## Trip module (Teammate 2)

### Status flow

```
Draft → Dispatched / In Progress → Completed
                ↘ Cancelled
```

On **dispatch**: trip → `Dispatched`, vehicle + driver → `On Trip` (sets `startDate` if empty).  
On **complete**: trip → `Completed`, vehicle + driver → `Available` (sets `endDate` if empty).  
On **cancel**: trip → `Cancelled`; frees vehicle/driver if they were on an active trip.

### Validations (server + UI errors)

- Vehicle must be `Available` (not `On Trip` / `In Shop`)
- No open maintenance (`Pending` / `Urgent` — anything not `Completed`)
- Driver must be `Available`, license not expired, not suspended
- Cargo ≤ vehicle capacity
- No double-booking of vehicle/driver on active trips
- Completed / cancelled trips are not editable

### Smart Dispatch

`GET /api/trips/recommend?cargoWeight=450` ranks available vehicles. Create Trip shows the top pick with reasons and **Use Recommended**.

### Trip date fields

Optional: `scheduledDate`, `startDate`, `endDate` (date columns on `trips`).

---

## Project structure (high level)

```
src/
  app/                 # pages + API route handlers
  components/          # AppNav, RoleGuard, HomeCTAs, StatusBadge, …
  lib/                 # prisma, auth, api-auth, permissions, validations, scoring
prisma/
  schema.prisma
  seed.js              # base seed
  seed-bulk.js         # bulk demo data
```

---

## Demo script (Dispatcher)

1. Login as `demo.user02@transitops.com` / `password123`
2. **New Trip** → enter cargo weight → review Smart Dispatch → **Use Recommended**
3. Pick an available driver → **Create Trip**
4. Open the trip → **Dispatch** → confirm vehicle/driver **On Trip** (fleet pages)
5. **Complete Trip** → both return to **Available**

Edge cases to show: over-capacity cargo, suspended/expired driver, vehicle with open maintenance.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `prisma:error … terminating connection` | Use Neon **pooler** URL + `pgbouncer=true&connection_limit=1` |
| White / invisible form text | App is light-theme only; hard-refresh after pull |
| `PrismaClient` missing new fields | `npx prisma generate` after pull |
| 401/403 on trips | Must be logged in as **Dispatcher** |
| Empty available vehicles | Close open maintenance or free vehicles stuck `On Trip` |

---

## Contributing notes

- Prefer feature branches; merge to `main` often
- Do not commit `.env`
- After schema changes: `npx prisma generate` (and `db push` / SQL migration as agreed by the team)
- Keep Cursor / AI co-author trailers out of commits
