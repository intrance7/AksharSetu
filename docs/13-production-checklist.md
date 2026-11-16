# Production Checklist & Secrets Tracker

> **Purpose:** Single source of truth for everything built, configured, and remaining before public launch.

## 1. Core Application Modules (100% Built & Verified Locally)
- [x] **Authentication & Security**: NextAuth v5 (Credentials + Google OAuth), Password Reset (`/forgot-password`), Role-based Admin guard (`USER` / `ADMIN`).
- [x] **Book Marketplace & Catalog (`/catalog`, `/catalog/new`)**: ISBN Barcode Scanner, 5-Point Condition Grader, AI Smart Price Estimator, AI Description Generator, Semester Bundles, 1-for-1 Swaps, and Wishlist Alerts (`/wishlist`).
- [x] **Campus & Hyperlocal Discovery (`/campus`, `/map`, `/requests`)**: University & Semester Textbook Hub, Interactive GPS "Books Near Me" Map, and Community Request Board.
- [x] **Real-Time Marketplace Messaging (`/messages`)**: 3-Column Messenger, Book Context Cards, Structured Price Negotiation Offers (`BookOffer`), Private Validated Attachments (`sharp` WebP + PDF/DOCX), Reactions, Replies, Read Receipts, and Block/Report Safety.
- [x] **Identity, XP, 6-Rarity Badges, Heatmap & Quests (`/profile/[id]`, `/badges`, `/leaderboard`)**: Server-authoritative XP & nonlinear levels, 29 SVG vector badges across 6 rarities, 365-day GitHub-style contribution heatmap, streaks, Daily Check-In, Quests, Cosmetics (`AP`), and Social Follow.
- [x] **Digital E-Library, Shanti Mode & Sabha Clubs (`/ebooks`, `/library`, `/clubs`)**: Multi-source public-domain E-Reader (Flipbook + Classic Scroll), Literary Highlights (`BookNote`), Shanti Focus Timer, and Sabha Reading Circles.
- [x] **Checkout, Orders, Vidya Daan & Admin (`/checkout`, `/orders`, `/donations`, `/admin`)**: Courier Shipping + Local Meetup Reservation, 6-Stage NGO Donation Pipeline, Printable Verifiable Certificates, and Admin Operations + Gamification Audit Console.
- [x] **SEO & PWA**: Dynamic OpenGraph metadata, `sitemap.xml`, `robots.txt`, and `manifest.webmanifest`.

## 2. Environment Variables & Secrets (For Fresh Vercel Deployment)
- [x] `DATABASE_URL` (Cloud PostgreSQL connection string — Prisma Postgres)
- [x] `AUTH_SECRET` & `NEXTAUTH_SECRET`
- [x] `AUTH_URL` (Production URL)
- [x] `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET` (Add `<AUTH_URL>/api/auth/callback/google` in Google Cloud Console)
- [x] `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_CLUSTER`
- [x] `GEMINI_API_KEY`
- [x] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

## 3. Optional Polish / Final Launch Steps
- [ ] **Fresh Vercel Deployment**: Link clean Vercel project with Root Directory set to `web` and deploy latest `main`.
- [ ] **Global `Ctrl+K` Omnisearch Palette**: Instant search modal across physical books, e-books, `@username` profiles, and book clubs.
- [ ] **Donor Dedication Note ("Story Attached")**: Optional personal note from donors explaining why they loved a donated book (displayed on listing & Vidya Daan certificate).
- [ ] **Custom Domain (Optional)**: Connect custom domain in Vercel Domains.
