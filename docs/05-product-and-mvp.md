# AksharSetu - Product Definition and MVP

AksharSetu is a platform connecting people who have books they no longer need with those who need them. We are building a production-grade application, starting with a focused Minimum Viable Product (MVP).

## 1. Core Idea & Primary Actions
The platform facilitates three main actions:
1. **Buy**
2. **Sell**
3. **Donate** (and subsequently Receive)

Future iterations may include book exchanges, rentals, institutional donations, and college-specific marketplaces, but the V1 focus is strictly on buying, selling, and donating.

## 2. Target Users
- **Student**: The primary user. Can register, search, buy, sell, donate, message, and track orders.
- **Organization / NGO**: Can request donations, create campaigns, and receive verified donations.
- **Admin**: Verifies users/NGOs, moderates listings, handles disputes, and monitors platform health.

## 3. The Minimum Viable Product (MVP)
The V1 scope is intentionally restricted to avoid over-engineering.

### User Journeys
**Buyer Loop**: Register -> Search -> View Listing -> Contact/Buy -> Payment -> Delivery/Pickup -> Review
**Seller Loop**: Register -> Create Listing -> Upload Photos -> Set Price -> Receive Order -> Handover -> Receive Money
**Donor Loop**: Create Donation -> Select Books -> Choose Recipient/Campaign -> Schedule Pickup -> Donation Completed

## 4. Search: A First-Class Feature
Robust search is critical for a marketplace. Users must be able to search by:
- Title & Author
- ISBN
- Publisher
- Subject, Class, Course, or College
- Edition & Language

*Example*: Searching for "DBMS B.Tech 3rd semester" or an exact ISBN like "9780133591620" should yield accurate results.
