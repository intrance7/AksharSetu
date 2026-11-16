export interface HelpCategory {
  id: string
  name: string
  description: string
  iconName: string
  featuredHref?: string
}

export interface HelpArticleSection {
  id: string
  heading: string
  body: string
  steps?: string[]
}

export interface HelpArticle {
  slug: string
  title: string
  category: string
  summary: string
  updatedAt: string
  popular?: boolean
  recentlyUpdated?: boolean
  sections: HelpArticleSection[]
  relatedSlugs: string[]
}

export interface FaqItem {
  id: string
  category:
    | "GENERAL"
    | "BUYING"
    | "SELLING"
    | "MESSAGING"
    | "GAMIFICATION"
    | "PRIVACY"
    | "PAYMENTS"
  question: string
  answer: string
  relatedLink?: { label: string; href: string }
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Creating your account, exploring the catalog, and navigating AksharSetu.",
    iconName: "Compass",
  },
  {
    id: "account-profiles",
    name: "Account & Profiles",
    description: "Customizing your @username, avatar frame, banner, quote, and privacy.",
    iconName: "User",
  },
  {
    id: "buying-books",
    name: "Buying Books",
    description: "Searching by ISBN or university, making offers, and choosing pickup vs. courier.",
    iconName: "ShoppingBag",
  },
  {
    id: "selling-books",
    name: "Selling Books",
    description: "Scanning barcodes, grading 5-point condition, AI price estimation, and bundles.",
    iconName: "Tag",
  },
  {
    id: "messaging",
    name: "Messaging & Communication",
    description: "Book context cards, price negotiation offers, attachments, and read receipts.",
    iconName: "MessageSquare",
  },
  {
    id: "reading-library",
    name: "Reading & Digital Library",
    description: "70,000+ free public-domain books, Flipbook mode, highlights, and Shanti Mode.",
    iconName: "BookOpen",
  },
  {
    id: "xp-levels",
    name: "XP, Levels & Progression",
    description: "How server-authoritative XP, nonlinear levels, and rank titles work.",
    iconName: "Zap",
    featuredHref: "/help/xp-and-levels",
  },
  {
    id: "badges-achievements",
    name: "Badges & Achievements",
    description: "Unlocking collectible vector badges across 6 rarity tiers and pinning showcases.",
    iconName: "Award",
    featuredHref: "/help/badges-and-achievements",
  },
  {
    id: "quests-streaks",
    name: "Quests, Streaks & Rewards",
    description: "Daily check-ins, daily/weekly quests, 365-day contribution heatmaps, and AP.",
    iconName: "Flame",
    featuredHref: "/help/reading-streaks",
  },
  {
    id: "community-social",
    name: "Community & Social Features",
    description: "Sabha Book Clubs, following readers, Community Request Board, and Vidya Daan.",
    iconName: "Users",
  },
  {
    id: "payments-transactions",
    name: "Payments & Transactions",
    description: "Razorpay checkout, campus meetup reservations, AWB tracking, and reviews.",
    iconName: "CreditCard",
  },
  {
    id: "safety-privacy",
    name: "Safety, Privacy & Security",
    description: "Safe campus meetups, blocking/reporting users, and profile visibility controls.",
    iconName: "ShieldCheck",
  },
  {
    id: "technical-support",
    name: "Technical Support",
    description: "Troubleshooting login, barcode scanner permissions, and submitting support tickets.",
    iconName: "LifeBuoy",
    featuredHref: "/support",
  },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "getting-started-with-aksharsetu",
    title: "Getting Started with AksharSetu",
    category: "getting-started",
    summary:
      "A complete walkthrough of how to buy, swap, donate, and read books across AksharSetu.",
    updatedAt: "2026-11-16",
    popular: true,
    recentlyUpdated: true,
    sections: [
      {
        id: "overview",
        heading: "What is AksharSetu?",
        body: "AksharSetu ('Bridge of Letters') connects students, readers, and verified Indian NGOs. You can buy and sell used textbooks, propose 1-for-1 book swaps, donate books through the 6-stage Vidya Daan pipeline, and read 70,000+ free public-domain classics in Shanti Mode.",
      },
      {
        id: "first-steps",
        heading: "Your First 4 Steps",
        body: "Follow these steps to set up your reader identity and start exploring:",
        steps: [
          "Create an account at /register using your email & password or Google Sign-In.",
          "Visit your Profile (/profile) and click 'Customize Profile' to choose your unique @username, city/campus location, and favorite literary quote.",
          "Browse the Physical Marketplace (/catalog), Campus Textbook Hub (/campus), or Books Near Me GPS Map (/map).",
          "Claim your Daily Check-In reward on your profile to start your reading streak and earn your first 25 XP + 15 Akshar Points.",
        ],
      },
    ],
    relatedSlugs: [
      "customizing-your-profile-and-privacy",
      "how-to-list-and-grade-a-book",
      "buying-and-negotiating-on-marketplace",
    ],
  },
  {
    slug: "customizing-your-profile-and-privacy",
    title: "Customizing Your Profile, Cosmetics & Privacy",
    category: "account-profiles",
    summary:
      "How to set your @username, equip avatar frames and banners, pin up to 5 achievements, and control public visibility.",
    updatedAt: "2026-11-16",
    popular: true,
    sections: [
      {
        id: "identity",
        heading: "Setting Your @Username, Bio & Literary Quote",
        body: "Your profile is accessible via both your user ID and your unique handle (/profile/yourusername). Open 'Customize Profile' on your profile header to edit your display name, @username, biography, annual reading goal, and signature literary quote.",
      },
      {
        id: "cosmetics",
        heading: "Avatar Frames, Banners & Pinned Badges",
        body: "You can unlock avatar frames (Minimalist Ring, Cobalt Pulse, Vidya Saffron, Shanti Emerald, Scholar's Gold, Mythic Luminary) and cover banners either by reaching the required Level or by spending Akshar Points (AP). You can also pin up to 5 unlocked achievements to your profile header.",
      },
      {
        id: "privacy",
        heading: "Privacy & Leaderboard Opt-Out Controls",
        body: "Inside the Customize Profile modal, you can toggle whether to show your online status, your reading showcase, and your 365-day contribution heatmap—or opt out of public leaderboards altogether.",
      },
    ],
    relatedSlugs: ["getting-started-with-aksharsetu"],
  },
  {
    slug: "buying-and-negotiating-on-marketplace",
    title: "Buying Books, Making Offers & Choosing Handoff",
    category: "buying-books",
    summary:
      "How to inspect 5-point condition scores, negotiate prices with structured offers, and choose between Courier Delivery and Campus Meetup.",
    updatedAt: "2026-11-16",
    popular: true,
    recentlyUpdated: true,
    sections: [
      {
        id: "condition",
        heading: "Inspecting the 5-Point Condition Breakdown",
        body: "Every listing on AksharSetu displays a 1–5 star breakdown across Cover & Spine, Pages, Highlighting, Margin Notes, and Binding so you know the exact physical state before purchasing.",
      },
      {
        id: "offers",
        heading: "Negotiating with Structured Price Offers",
        body: "Click 'Message' on any listing to open a conversation bound to that book. Click 'Make Offer' in the Book Context Card to propose a custom price (or use the -10%, -15%, -20% quick pills). Sellers can accept or decline your offer in real time.",
      },
      {
        id: "checkout",
        heading: "Courier Delivery vs. Campus / City Meetup",
        body: "At checkout (/checkout/[bookId]), you can choose Doorstep Courier (calculated by 6-digit pincode with AWB tracking) or Campus / City Meetup (₹0 shipping and ₹0 platform fee—inspect the book in person at handoff).",
      },
    ],
    relatedSlugs: [
      "how-to-list-and-grade-a-book",
      "using-real-time-marketplace-messaging",
    ],
  },
  {
    slug: "how-to-list-and-grade-a-book",
    title: "How to List, Grade & Price Your Books",
    category: "selling-books",
    summary:
      "Using the ISBN barcode scanner, 5-point condition grader, AI Smart Price Estimator, and semester bundle options.",
    updatedAt: "2026-11-16",
    popular: true,
    sections: [
      {
        id: "isbn",
        heading: "1. Scan ISBN Barcode or Auto-Fill",
        body: "On /catalog/new, enter the 10- or 13-digit ISBN or click the camera icon to scan the barcode. AksharSetu automatically fetches the book title, author, and cover image from Google Books and Open Library.",
      },
      {
        id: "grading",
        heading: "2. 5-Point Condition Grader & AI Smart Price Estimator",
        body: "Score your book from 1 to 5 across Cover, Pages, Highlighting, Notes, and Binding. Click 'Estimate Fair Price' to run our AI Smart Price Estimator, which computes a suggested ₹ price range based on condition and category.",
      },
      {
        id: "modes",
        heading: "3. Sell, 1-for-1 Swap, or Vidya Daan Donation",
        body: "Choose whether to sell for ₹, accept a 1-for-1 book swap (specifying what titles/genres you want in return), or donate for ₹0 to earn Vidya Daan XP and a verifiable donation certificate.",
      },
    ],
    relatedSlugs: [
      "buying-and-negotiating-on-marketplace",
      "vidya-daan-donations-and-certificates",
    ],
  },
  {
    slug: "using-real-time-marketplace-messaging",
    title: "Using Real-Time Marketplace Messaging",
    category: "messaging",
    summary:
      "How Book Context Cards, buyer/seller quick actions, private attachments, read receipts, and safety controls work.",
    updatedAt: "2026-11-16",
    recentlyUpdated: true,
    sections: [
      {
        id: "book-context",
        heading: "Contextual Book Conversations",
        body: "When you message a seller from a book page, the conversation automatically attaches a Book Context Card at the top of the thread. Buyers can use 1-click inquiry prompts or submit price offers; sellers can mark the book as Available, Reserved, or Sold directly from the chat header.",
      },
      {
        id: "features",
        heading: "Replies, Edit, Reactions & Validated Attachments",
        body: "Hover over any message to react with an emoji, reply to a specific message, copy text, or edit/delete your own messages (within 15 minutes). You can also attach photos (automatically optimized to WebP with EXIF stripped) or PDF/TXT/DOCX documents up to 4 MB.",
      },
      {
        id: "receipts",
        heading: "Sent, Delivered & Read Receipts",
        body: "Outgoing messages display a single gray check (✓) when sent, double gray checks (✓✓) when delivered, and double cobalt-blue checks (✓✓) once read by the recipient.",
      },
    ],
    relatedSlugs: [
      "buying-and-negotiating-on-marketplace",
      "safety-blocking-and-reporting",
    ],
  },
  {
    slug: "digital-elibrary-and-shanti-mode",
    title: "Free Digital E-Library & Shanti Focus Mode",
    category: "reading-library",
    summary:
      "Reading 70,000+ legal public-domain books in 2-page Flipbook or Classic Scroll mode with ambient focus audio.",
    updatedAt: "2026-11-16",
    sections: [
      {
        id: "sources",
        heading: "Multi-Source Legal Public-Domain Catalog",
        body: "Our E-Library (/ebooks) aggregates legal public-domain classics from Project Gutenberg, Standard Ebooks, Open Library, Internet Archive, and Google Books.",
      },
      {
        id: "reader",
        heading: "Book Spread (Flipbook) vs. Classic Scroll",
        body: "Inside the E-Reader (/ebooks/[id]), switch between realistic 2-page Book Spread and continuous Classic Scroll, customize typography and themes (Paper, Sepia, Night), and save color-coded literary highlights to your personal notebook.",
      },
      {
        id: "shanti",
        heading: "Shanti Mode Focus Timer",
        body: "Launch Shanti Mode (/library/shanti/[id]) for distraction-free reading with synthesized ambient soundscapes (Rain, Forest, Fireplace) and automatic reading session XP logging.",
      },
    ],
    relatedSlugs: ["getting-started-with-aksharsetu"],
  },
  {
    slug: "vidya-daan-donations-and-certificates",
    title: "Vidya Daan NGO Donations & Verifiable Certificates",
    category: "community-social",
    summary:
      "How the 6-stage NGO book donation chain of custody works and how to print your verifiable certificate.",
    updatedAt: "2026-11-16",
    sections: [
      {
        id: "pipeline",
        heading: "6-Stage Chain of Custody",
        body: "Every book donated on /donations receives a unique tracking ID that advances through 6 verified stages: Donated → Collected → Verified → Sent to NGO → Received → Distributed.",
      },
      {
        id: "certificate",
        heading: "Verifiable Vidya Daan Certificate",
        body: "Open /donations/track/[trackingId] at any time to view the live progress ledger and print or save your official Vidya Daan Literacy Impact Certificate.",
      },
    ],
    relatedSlugs: ["how-to-list-and-grade-a-book"],
  },
  {
    slug: "orders-awb-shipping-and-reviews",
    title: "Orders, AWB Shipment Tracking & Verified Reviews",
    category: "payments-transactions",
    summary:
      "Managing purchases, sales, incoming swaps, AWB shipment milestones, and post-delivery seller ratings.",
    updatedAt: "2026-11-16",
    sections: [
      {
        id: "dashboard",
        heading: "Your Unified Orders & Swaps Dashboard",
        body: "Visit /orders to manage 5 tabs: My Purchases, My Sales, Incoming Swaps & Requests, Outgoing Requests, and My Listings.",
      },
      {
        id: "reviews",
        heading: "Two-Way Trust & Verified Seller Reviews",
        body: "Once an order or swap reaches Delivered/Completed, buyers can submit a verified 1–5★ review rating Condition Accuracy and Meetup Reliability, which dynamically updates the seller's public trust score.",
      },
    ],
    relatedSlugs: ["buying-and-negotiating-on-marketplace"],
  },
  {
    slug: "safety-blocking-and-reporting",
    title: "Campus Meetup Safety, Blocking & Reporting",
    category: "safety-privacy",
    summary:
      "Best practices for safe in-person book handoffs and how to block or report abusive accounts.",
    updatedAt: "2026-11-16",
    sections: [
      {
        id: "meetup",
        heading: "In-Person Campus & City Meetup Safety",
        body: "Always schedule local handoffs during daylight hours in public, well-populated locations such as university libraries, student centers, or metro stations. Inspect the book's physical condition before completing payment.",
      },
      {
        id: "controls",
        heading: "Blocking & Reporting Users",
        body: "In any conversation's right-hand Info Panel, click 'Block User' to immediately stop all messages and offers from that user, or click 'Report Conversation' to alert our Trust & Safety moderators.",
      },
    ],
    relatedSlugs: ["using-real-time-marketplace-messaging"],
  },
]

export const FAQ_ITEMS: FaqItem[] = [
  // GENERAL
  {
    id: "faq-what-is-aksharsetu",
    category: "GENERAL",
    question: "What is AksharSetu?",
    answer:
      "AksharSetu is a community book marketplace and digital reading ecosystem where students and readers buy, sell, swap (1-for-1), and donate physical books (Vidya Daan), alongside reading 70,000+ free legal public-domain e-books in Shanti Mode.",
    relatedLink: { label: "About AksharSetu", href: "/about" },
  },
  {
    id: "faq-create-account",
    category: "GENERAL",
    question: "How do I create an account?",
    answer:
      "Visit /register to sign up with your full name, email address, and password, or click 'Continue with Google' on /login.",
    relatedLink: { label: "Register Page", href: "/register" },
  },
  {
    id: "faq-edit-profile",
    category: "GENERAL",
    question: "How do I edit my profile and change my @username?",
    answer:
      "Open your profile (/profile) and click 'Customize Profile'. You can update your display name, unique alphanumeric @username, avatar photo or frame, cover banner, bio, location, and signature literary quote.",
    relatedLink: { label: "My Profile", href: "/profile" },
  },
  {
    id: "faq-delete-account",
    category: "GENERAL",
    question: "How do I request account deletion?",
    answer:
      "Submit an 'Account Access Assistance' ticket on /support while signed in (or from your registered email), and our team will process your account and personal data deletion request.",
    relatedLink: { label: "Contact Support", href: "/support" },
  },

  // BUYING
  {
    id: "faq-purchase-book",
    category: "BUYING",
    question: "How do I purchase a book?",
    answer:
      "Open any available book in /catalog and click 'Buy Now'. On the checkout screen, choose either Doorstep Courier (enter your 6-digit pincode) or Campus / City Meetup (₹0 shipping & ₹0 platform fee).",
    relatedLink: { label: "Browse Catalog", href: "/catalog" },
  },
  {
    id: "faq-contact-seller",
    category: "BUYING",
    question: "How do I contact a seller?",
    answer:
      "Click the 'Message' button on any book listing page. This opens a direct conversation with the seller with the Book Context Card automatically attached at the top.",
    relatedLink: { label: "Messages", href: "/messages" },
  },
  {
    id: "faq-negotiate-price",
    category: "BUYING",
    question: "Can I negotiate a book's price?",
    answer:
      "Yes! Inside a book conversation, click 'Make Offer' on the Book Context Card to submit a structured price offer (or use the -10%, -15%, -20% quick buttons). The seller can accept or decline your offer in one click.",
    relatedLink: { label: "Buying Guide", href: "/help/buying-and-negotiating-on-marketplace" },
  },
  {
    id: "faq-report-listing",
    category: "BUYING",
    question: "How do I report a suspicious listing or unresponsive seller?",
    answer:
      "You can report a user or conversation directly from the chat Info Panel ('Report Conversation') or submit a 'Suspicious Listing' ticket at /support with the listing link.",
    relatedLink: { label: "Report Issue", href: "/support?category=SUSPICIOUS_LISTING" },
  },

  // SELLING
  {
    id: "faq-list-book",
    category: "SELLING",
    question: "How do I list a book for sale, swap, or donation?",
    answer:
      "Click 'List a Book' (/catalog/new) in the top navbar. Enter or scan the ISBN barcode to auto-fill details, score the 5-point condition grader, run the AI Smart Price Estimator, and publish.",
    relatedLink: { label: "List a Book", href: "/catalog/new" },
  },
  {
    id: "faq-book-conditions",
    category: "SELLING",
    question: "Which book conditions can I select?",
    answer:
      "AksharSetu uses 5 condition tiers—NEW, LIKE NEW, GOOD, FAIR, and POOR—automatically derived from your 1–5 scores on Cover & Spine, Pages, Highlighting, Margin Notes, and Binding.",
  },
  {
    id: "faq-edit-remove-listing",
    category: "SELLING",
    question: "How do I edit, remove, or mark a listing as sold?",
    answer:
      "Go to /orders and open the 'My Listings' tab to edit or delete your listings. You can also mark a listing as Available, Reserved, or Sold directly inside the buyer's chat thread.",
    relatedLink: { label: "Manage Listings", href: "/orders" },
  },

  // MESSAGING
  {
    id: "faq-read-receipts",
    category: "MESSAGING",
    question: "How do read receipts work in messaging?",
    answer:
      "A single gray check (✓) means sent, double gray checks (✓✓) mean delivered to the recipient's inbox, and double cobalt-blue checks (✓✓) mean the recipient has opened and read the conversation.",
  },
  {
    id: "faq-block-report-chat",
    category: "MESSAGING",
    question: "Can I block someone or report inappropriate messages?",
    answer:
      "Yes. Open the right-hand Conversation Info Panel in any chat and click 'Block User' (which immediately blocks them from sending messages or offers) or 'Report Conversation'.",
  },

  // GAMIFICATION
  {
    id: "faq-earn-xp",
    category: "GAMIFICATION",
    question: "How do I earn XP and how are levels calculated?",
    answer:
      "You earn server-verified XP by completing books (+100 XP), donating books (+100 XP), selling books (+40 XP), publishing reviews (+30 XP), listing books (+25 XP), claiming daily check-ins (+25 XP), and logging Shanti reading sessions (+2 XP/min). Levels follow a nonlinear curve: XP required for step L = round(100 × L^1.5).",
    relatedLink: { label: "XP & Levels Guide", href: "/help/xp-and-levels" },
  },
  {
    id: "faq-unlock-badges",
    category: "GAMIFICATION",
    question: "How do I unlock badges and can I lose achievements?",
    answer:
      "Badges unlock automatically when your verified platform metrics meet the threshold. Once legitimately unlocked, achievements are permanent unless an underlying fraudulent transaction is reversed by an administrator.",
    relatedLink: { label: "Badges & Achievements Guide", href: "/help/badges-and-achievements" },
  },
  {
    id: "faq-reading-streaks",
    category: "GAMIFICATION",
    question: "How do reading streaks and quests work?",
    answer:
      "Any day (UTC) where you log a Shanti reading session, claim your Daily Check-In, list/donate a book, or post a review/note extends your daily streak. Daily and Weekly Quests can be claimed on your Profile under the 'Quests, Check-In & Cosmetics' tab.",
    relatedLink: { label: "Streaks Guide", href: "/help/reading-streaks" },
  },

  // PRIVACY
  {
    id: "faq-privacy-controls",
    category: "PRIVACY",
    question: "Can I hide my reading activity or opt out of public leaderboards?",
    answer:
      "Yes! Open 'Customize Profile' on your profile page to toggle visibility for your online status, reading showcase, and 365-day contribution heatmap, or check 'Opt out of public community leaderboards'.",
  },

  // PAYMENTS
  {
    id: "faq-payment-methods",
    category: "PAYMENTS",
    question: "Which payment and checkout methods are supported?",
    answer:
      "AksharSetu supports online checkout via Razorpay (UPI, cards, netbanking) for courier orders, as well as Campus / City Meetup reservations where you inspect the book in person at handoff with ₹0 shipping and ₹0 platform fee.",
    relatedLink: { label: "Buyer Protection Policy", href: "/legal/buyer-protection" },
  },
]

export function getHelpArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}

