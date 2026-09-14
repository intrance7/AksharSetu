# AksharSetu - Profile Badges & Gamification System

The Profile Badges system is a core feature designed to build trust, encourage generosity (through book donations), and reward active community participation on AksharSetu.

## 1. Purpose of Badges
- **Trust Building**: Helps buyers/receivers quickly identify reliable and honest users.
- **Gamification**: Encourages users to donate more books and engage with the platform regularly to "level up".
- **Social Proof**: Public recognition for philanthropy ("Vidya Daan") and community contribution.

---

## 2. Badge Categories & Progression

### A. The "Vidya Daan" (Donation) Series
Rewards users who list books for free or donate directly to NGO requests. Progression is based on the number of completed donation transactions.

| Badge Name | Level | Requirement | Icon Idea |
| :--- | :--- | :--- | :--- |
| **Seed Planter** | Bronze | 1 Book Donated | 🌱 Sprout |
| **Knowledge Giver** | Silver | 5 Books Donated | 🌿 Growing Plant |
| **Community Pillar** | Gold | 15+ Books Donated | 🌳 Fully Grown Tree |
| **Philanthropist** | Diamond | Top 1% of Donors / 50+ Books | 💎 Diamond/Crown |

### B. Seller Reliability & Trust Series
Rewards users who sell books accurately, ship/deliver on time, and maintain high ratings.

| Badge Name | Level | Requirement | Icon Idea |
| :--- | :--- | :--- | :--- |
| **Honest Lister** | Standard | 5 transactions with "Condition matched description" | ✅ Green Checkmark |
| **5-Star Seller** | Standard | Maintain a 4.8+ rating over 10+ sales | ⭐ Golden Star |
| **Speedy Shipper** | Standard | Consistently dispatches/meets up within 24 hours | ⚡ Lightning Bolt |
| **Verified Student** | Special | Verified university/college email (`.edu` or similar) | 🎓 Graduation Cap |

### C. Community Engagement Series
Rewards platform loyalty and community growth.

| Badge Name | Level | Requirement | Icon Idea |
| :--- | :--- | :--- | :--- |
| **Early Adopter** | Special | Joined during the first 6 months of platform launch | 🚀 Rocket |
| **Connector** | Standard | Successfully invited 5 friends who made a transaction | 🔗 Chain Link |
| **Bookworm** | Standard | Purchased or received 10+ books | 📚 Stack of Books |
| **Bug Hunter** | Special | Reported a valid bug or gave valuable platform feedback | 🐛 Bug / 🛠️ Tool |

---

## 3. UI/UX Placement

1. **User Profile Page**: 
   - A dedicated "Trophy Cabinet" section displaying all unlocked badges.
   - Greyed-out badges showing what the user can unlock next (creates incentive).
2. **Book Listing Cards**: 
   - Show the user's top 1-2 most prestigious badges next to their name on the listing (e.g., [Name] 🌳 ⭐). This immediately establishes trust before a buyer even clicks the profile.
3. **Chat Interface**: 
   - Small badge icons next to the avatar during negotiations to reinforce trust.

---

## 4. Technical Implementation Outline

### Database Schema (Conceptual)

**Table: `Badges` (Master List of available badges)**
- `id` (UUID)
- `name` (String)
- `description` (String)
- `category` (Enum: DONATION, TRUST, COMMUNITY)
- `icon_url` (String)
- `requirement_threshold` (Int)

**Table: `UserBadges` (Mapping table)**
- `id` (UUID)
- `user_id` (FK to Users)
- `badge_id` (FK to Badges)
- `earned_at` (Timestamp)
- `is_pinned` (Boolean) - *Allows users to choose which 3 badges to highlight.*

### Backend Logic
- **Event-Driven Architecture**: When a transaction is marked as "Completed", an event is fired. A Badge Service listens to this event, checks the user's total stats (e.g., total donations = 5), and automatically awards the "Knowledge Giver" badge if the threshold is met, triggering an in-app notification.
