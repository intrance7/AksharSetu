# Production Checklist & Secrets Tracker

> **Purpose:** We will keep adding to this document as we build AksharSetu. It serves as a single source of truth for everything we need to configure, switch out, or keep secret before launching the app to the real world!

## 1. Environment Variables & Secrets
*We will need to generate real production keys for these when deploying. Do **NOT** put the actual secret values in this file!*

- [ ] `DATABASE_URL` (The connection string to our production PostgreSQL database, e.g., Supabase or Vercel Postgres)
- [ ] Authentication Secrets (e.g., `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` if we use OAuth, or Clerk/Supabase keys)

## 2. Infrastructure & Services
*Services we need to provision before launch:*

- [ ] **Cloud Database**: A managed PostgreSQL database (Recommended: Supabase, Vercel Postgres, or Neon).
- [ ] **Image Storage**: A place to store uploaded book photos (Recommended: AWS S3, Cloudinary, or Supabase Storage).
- [ ] **Hosting**: The platform where the Next.js app will be deployed (Recommended: Vercel).

## 3. Pre-Launch Configuration
- [ ] **Domain Name**: Purchase and link the custom domain (e.g., `aksharsetu.com`).
- [ ] **Database Migration**: Run `npx prisma migrate deploy` on the production database.
- [ ] **Analytics**: Set up Vercel Analytics or Google Analytics to track user traffic.

## 4. Security & Compliance
- [ ] Verify Row Level Security (RLS) if using Supabase, or ensure Server Actions properly check user sessions before modifying data.
- [ ] Ensure all input forms are properly sanitized (we can use Zod validation).
- [ ] Ensure Terms of Service and Privacy Policy pages are accessible and finalized.

---
*Note: I will update this file automatically as we add new integrations and features to the project!*
