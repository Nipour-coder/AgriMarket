# Backend

This folder contains AgriMarket's server-side authentication, database connection and schema, email delivery, private S3-compatible evidence storage, API error handling, Drizzle configuration, and SQL migrations.

The application uses Next.js, so HTTP route entry points remain in [`frontend/app/api/`](../frontend/app/api/) and call into this backend code. Run database commands from the AgriMarket workspace root:

```powershell
npm run db:generate
npm run db:migrate
```

Both commands use `DATABASE_URL` from `backend/.env.local`. Copy `.env.example` to `.env.local` in this folder and fill in the credentials locally. Migration `0002_greedy_scrambler.sql` creates dispute cases, messages and evidence metadata; `0003_pretty_morlun.sql` links each case to its exact order item. See the frontend [setup guide](../frontend/README.md) for environment variables, private bucket CORS setup and service limitations.
