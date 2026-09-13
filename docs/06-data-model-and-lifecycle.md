# AksharSetu - Data Model and Lifecycle

A robust, production-level data model is essential to prevent duplicate data and handle complex marketplace transactions safely.

## 1. Book vs. Listing Separation
A common anti-pattern is storing book metadata directly on the listing. Since multiple users might sell the exact same book (e.g., "NCERT Physics Class 12"), we separate the core book data from the individual marketplace listings.

**BOOK** (The immutable product)
- ISBN, Title, Author, Publisher, Edition, Language, Category

**LISTING** (The user's specific item for sale/donation)
- Listing ID, Book ID (Foreign Key), Seller ID, Condition, Price, Photos, Location, Status, Timestamps

*Result*: One Book record can have multiple Listing records associated with it.

## 2. Listing State Management
A boolean `is_available` flag is insufficient. Listings follow a strict state machine:
`DRAFT` -> `PUBLISHED` -> `RESERVED` -> `SOLD` (or `EXPIRED` -> `PUBLISHED`, `REMOVED`)

Donations follow a similar track:
`DRAFT` -> `SUBMITTED` -> `VERIFIED` -> `PICKUP_SCHEDULED` -> `COLLECTED` -> `DELIVERED` -> `COMPLETED`

## 3. Payment Architecture and Source of Truth
The client browser can never be trusted as the source of truth for payments. 
- **Flow**: User clicks Buy -> Order Created -> Redirect to Payment Gateway -> Payment Made -> **Gateway Webhook triggers Backend** -> Backend verifies and updates Order to `PAID`.

## 4. Preventing Double-Selling (Concurrency)
To prevent two users from buying the exact same book listing simultaneously, the database must enforce transactional locking or reservation semantics.
- Transitioning a listing from `AVAILABLE` to `RESERVED` must be an atomic operation. Only one transaction can successfully secure the reservation before payment processing begins.

## 5. High-Level Database Schema (PostgreSQL)
Core tables for V1:
- `users`, `books`, `listings`, `listing_images`, `categories`
- `orders`, `order_items`, `payments`, `addresses`
- `messages`, `reviews`, `donations`, `donation_campaigns`, `notifications`, `reports`
