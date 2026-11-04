# AgriMarket

AgriMarket is a South African agricultural marketplace built with Next.js, React, TypeScript, Tailwind CSS, PostgreSQL and Drizzle ORM. Backend services, database schema and migrations live in the workspace-level [`backend/`](../backend/).

## Local setup

1. Install Node.js and npm.
2. Create a Neon PostgreSQL database and copy its connection string from the Neon dashboard. Keep it private.
3. Configure `backend/.env.local` from `backend/.env.example`:

   ```powershell
   Copy-Item backend\.env.example backend\.env.local
   ```

   Set `DATABASE_URL` to the Neon connection string, including SSL parameters. Set `APP_URL` to `http://localhost:3000`. Add comma-separated administrator email addresses to `ADMIN_EMAILS`.
4. Configure email verification with a Resend API key and a sender address on a domain verified with Resend. Set `RESEND_API_KEY` and `EMAIL_FROM`.
5. Configure a private S3-compatible bucket for dispute evidence. Set `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. Set `S3_REGION` for the bucket region, and set `S3_ENDPOINT` for providers such as Cloudflare R2 (leave it blank for AWS S3).
   - Keep the bucket private and use credentials scoped to this bucket.
   - Configure bucket CORS to allow `POST` requests from your local app origins (`http://localhost:3000` and `http://localhost:3001`) and production app origin, with the `Content-Type` and `x-amz-*` headers allowed. Do not make evidence objects public.
   - Evidence uploads allow JPEG, PNG, WebP, MP4, MOV and WebM, at 25 MB per file and up to 5 files per complaint. Downloads use short-lived, authenticated links.
6. From the AgriMarket workspace root, install dependencies, apply the migrations, then start the app:

   ```powershell
   npm install
   npm run db:migrate
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Next.js API entry points remain in `frontend/app/api/`; environment files and backend services are organized in the workspace-level `backend/` folder. Do not commit `backend/.env.local` or share database or email credentials.

## Useful commands

- From the workspace root, `npm run db:generate` generates a migration and `npm run db:migrate` applies pending migrations.
- From `frontend`, `npm run lint` runs ESLint and `npx tsc --noEmit` checks TypeScript.
- From the workspace root, `npm run build` creates a production build.

## Current backend scope and limitations

- Registration uses email and password. Email verification is required; verification email delivery requires the Resend settings above.
- Administrator role assignment is controlled by `ADMIN_EMAILS`; public registration cannot grant administrator access.
- Sessions use HTTP-only cookies and are stored in the database.
- Product browsing, seller profiles and verification submissions, addresses, enquiries, notifications and order flows use the backend.
- Buyer and seller complaints are linked to an order and counterparty, with a case conversation, private evidence files and an administrator review queue. The administrator can record a resolution and refund recommendation; this does not execute a payment.
- Sellers must be verified before products appear publicly. Approval remains disabled until secure storage and review of KYC documents are implemented. The current seller application records business details but does not upload documents.
- Payment processing, courier booking, password reset and rate limiting are not implemented. Payment and delivery choices must not be treated as completed external transactions. Refund recommendations are not processed refunds.

Configure Neon, Resend and private object-storage credentials in `backend/.env.local` before testing registration, database-backed marketplace features or evidence uploads. Never commit secrets or use a public bucket for complaints evidence.
