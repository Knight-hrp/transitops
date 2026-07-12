# TransitOps

**Smart Transport Operations Platform** — hackathon project for fleet, driver, trip, maintenance, fuel, expense, and analytics workflows with role-based access.

## Repository layout

```
.
├── README.md              ← you are here
└── transitops/            ← Next.js application (run commands from here)
    ├── README.md          ← setup, modules, RBAC, demo guide
    ├── prisma/            ← schema + seed scripts
    └── src/               ← App Router pages, APIs, components
```

The GitHub repo root contains the Nestable app under `transitops/`. All development happens inside that folder.

## Quick start

```bash
cd transitops
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Full setup, roles, seeding, and demo flow: **[transitops/README.md](./transitops/README.md)**

## Team ownership

| Area | Owner |
|------|--------|
| Auth, vehicles, drivers | Teammate 1 |
| Trips, validations, Smart Dispatch | Teammate 2 |
| Maintenance, fuel, expenses, dashboard/analytics | Teammate 3 |

## Tech stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL (Neon) · Prisma 5 · JWT (`jose`) + bcrypt

## License

Private hackathon project — not licensed for redistribution.
