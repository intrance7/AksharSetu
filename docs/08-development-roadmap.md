# AksharSetu - Development Roadmap & Architecture

To build AksharSetu for scale while maintaining operational simplicity in the early days, we will adopt a Modular Monolith architecture built in vertical slices.

## 1. Modular Monolith over Microservices
Microservices introduce immense operational complexity (service discovery, distributed tracing, networking, queues) that is unnecessary for V1.
Instead, we will build a single API Server structured internally into independent modules:
- `Auth`, `Marketplace`, `Orders`, `Donations`, `Messaging`, `Payments`
All pointing to a single PostgreSQL database and Redis instance.

## 2. Tech Stack Blueprint
| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router) + TypeScript |
| **UI** | Tailwind CSS |
| **Backend** | Node.js (Next.js API routes or separate Express/NestJS server) |
| **Database** | PostgreSQL |
| **ORM** | Prisma or Drizzle |
| **Cache / Queue** | Redis |
| **Storage** | AWS S3 / Cloudinary (Images) |
| **Auth** | NextAuth / JWT |
| **Payments** | Razorpay / Stripe |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel (Frontend), AWS/Render (Backend & DB) |

## 3. Project Structure (Backend Example)
```
src/
├── auth/
├── users/
├── books/
├── listings/
├── orders/
├── payments/
├── donations/
├── messaging/
└── admin/
```
*Each module should be self-contained with its own controllers, services, and repositories.*

## 4. API Design (RESTful Versioning)
Expose versioned endpoints:
- `POST /api/v1/auth/register`
- `GET /api/v1/listings`
- `POST /api/v1/payments/webhook`

## 5. Development Roadmap: Build in Vertical Slices
Do not build the entire backend, then the entire frontend. Build end-to-end features incrementally.

**Phase 0: Foundation**
- PRD, ER Diagram, Git repo, Docker, CI pipeline, Authentication (User can register/login securely).

**Phase 1: Catalog & Marketplace**
- Book Database -> Create Listing -> Search -> View Listing -> Filters.

**Phase 2: Transactions**
- Cart -> Checkout -> Reservation -> Payment Gateway Integration -> Webhooks.

**Phase 3: Donations & Messaging**
- Donation listings -> NGO Campaigns -> Tracking -> Real-time Buyer/Seller Messaging.

**Phase 4: Trust & Admin**
- Moderation queues, User verification, Reports, Dashboards, Audit logs.

**Phase 5: Scale (The Future)**
- Introduce Read Replicas, Elasticsearch, Microservices (extracting Search or Chat), Mobile Apps.
