export interface LegalDocumentSection {
  heading: string
  body: string
}

export interface LegalDocument {
  slug: string
  title: string
  shortTitle: string
  version: string
  effectiveDate: string
  lastUpdated: string
  summary: string
  requiresCounselNotice: boolean
  sections: LegalDocumentSection[]
  changeHistory: { version: string; date: string; summary: string }[]
}

export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
  terms: {
    slug: "terms",
    title: "Terms and Conditions",
    shortTitle: "Terms",
    version: "2.1",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Governs account eligibility, peer-to-peer book transactions, Vidya Daan donations, and platform usage across AksharSetu.",
    requiresCounselNotice: true,
    sections: [
      {
        heading: "1. Nature of the Platform",
        body: "AksharSetu operates as an intermediary peer-to-peer book marketplace, community literacy network, and public-domain digital reading room. Unless explicitly stated in a verified NGO campaign, AksharSetu is not the owner, seller, or physical custodian of user-listed books.",
      },
      {
        heading: "2. Account Eligibility & Conduct",
        body: "Users must be at least 18 years old or use the platform under parental or guardian supervision. You are responsible for maintaining the confidentiality of your account credentials and for all activity conducted under your @username.",
      },
      {
        heading: "3. Honest Listing & Condition Grading",
        body: "Sellers and donors must accurately grade physical books using the 5-point condition grader (Cover, Pages, Highlighting, Margin Notes, and Binding). Listing pirated, photocopied, or counterfeit textbooks is strictly prohibited.",
      },
      {
        heading: "4. Limitation of Liability",
        body: "The platform is provided on an 'as-is' basis. While AksharSetu provides structured condition grading, verified seller ratings, and reporting tools, buyers and sellers are responsible for exercising standard precautions during in-person meetups and transactions.",
      },
    ],
    changeHistory: [
      {
        version: "2.1",
        date: "2026-11-16",
        summary: "Added structured price offer rules, progression integrity terms, and attachment policies.",
      },
      {
        version: "1.0",
        date: "2026-09-01",
        summary: "Initial Terms of Service published.",
      },
    ],
  },

  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    shortTitle: "Privacy",
    version: "2.0",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Explains what personal, reading, location, and messaging data AksharSetu collects and how you control visibility.",
    requiresCounselNotice: true,
    sections: [
      {
        heading: "1. Data We Collect",
        body: "We collect account profile details (name, email, @username, optional bio and avatar), book listings, reading room progress, Shanti session durations, XP/achievement records, and messages sent through our in-app messenger.",
      },
      {
        heading: "2. Location Privacy & Coordinate Jittering",
        body: "City or GPS coordinates are used only when you opt in to hyperlocal book discovery (/map). Public map pins apply deterministic privacy jittering so exact residential coordinates are never exposed.",
      },
      {
        heading: "3. Profile Visibility & Opt-Out Controls",
        body: "You can hide your online status, hide your reading showcase, hide your 365-day contribution heatmap, or opt out of public community leaderboards at any time in your Profile Settings.",
      },
      {
        heading: "4. Zero Third-Party Data Selling",
        body: "AksharSetu never sells personal data, private messages, or reading history to third-party advertisers or data brokers.",
      },
    ],
    changeHistory: [
      {
        version: "2.0",
        date: "2026-11-16",
        summary: "Added granular profile showcase privacy controls and private attachment access rules.",
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: "Cookie & Local Storage Policy",
    shortTitle: "Cookies",
    version: "1.2",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Details how AksharSetu uses essential authentication cookies and local browser storage for E-Reader preferences.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. Essential Authentication Cookies",
        body: "AksharSetu uses NextAuth encrypted HTTP-only session cookies to keep you securely signed in across pages and API requests.",
      },
      {
        heading: "2. E-Reader & UI Preferences",
        body: "We use browser localStorage to remember your E-Library reader theme (Paper, Sepia, Night), font size, and reading bookmark position.",
      },
      {
        heading: "3. No Cross-Site Advertising Trackers",
        body: "We do not load third-party behavioral advertising cookies or cross-site tracking pixels.",
      },
    ],
    changeHistory: [
      {
        version: "1.2",
        date: "2026-11-16",
        summary: "Documented NextAuth JWT cookies and E-Reader localStorage keys.",
      },
    ],
  },

  "community-guidelines": {
    slug: "community-guidelines",
    title: "Community & Safety Guidelines",
    shortTitle: "Community Guidelines",
    version: "2.0",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Standards for respectful communication, Sabha Book Clubs, honest reviews, and safe campus meetups.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. Respectful Communication",
        body: "Treat fellow students, buyers, sellers, and donors with respect in direct messages, Sabha Book Clubs, and reviews. Harassment, hate speech, or intimidation results in immediate account action.",
      },
      {
        heading: "2. Safe Campus & City Meetups",
        body: "When choosing local pickup, always meet during daylight hours in public campus spaces (libraries, student centers, cafes, or metro stations) and inspect the book before completing handoff.",
      },
      {
        heading: "3. Vidya Daan Donation Integrity",
        body: "Books pledged for free donation must be readable and free of hidden fees.",
      },
    ],
    changeHistory: [
      {
        version: "2.0",
        date: "2026-11-16",
        summary: "Expanded guidelines for Sabha Book Clubs and structured price offers.",
      },
    ],
  },

  "marketplace-policy": {
    slug: "marketplace-policy",
    title: "Marketplace Policy",
    shortTitle: "Marketplace Policy",
    version: "1.5",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Rules governing eligible book listings, prohibited items, price offers, and 1-for-1 swaps.",
    requiresCounselNotice: true,
    sections: [
      {
        heading: "1. Eligible Items",
        body: "Only legitimate physical books, academic textbooks, and verified semester textbook bundles may be listed in the AksharSetu catalog.",
      },
      {
        heading: "2. Prohibited Listings",
        body: "Pirated PDFs, unauthorized photocopies, exam leak materials, counterfeit books, and non-book items are strictly prohibited and subject to immediate removal.",
      },
      {
        heading: "3. Price Offers & Reservations",
        body: "Submitting a message or price offer does not automatically transfer ownership or complete payment. A listing's status changes only when the seller marks it Reserved/Sold or checkout completes.",
      },
    ],
    changeHistory: [
      {
        version: "1.5",
        date: "2026-11-16",
        summary: "Clarified offer expiration (48 hours) and reservation rules.",
      },
    ],
  },

  "buyer-protection": {
    slug: "buyer-protection",
    title: "Buyer Protection & Transaction Policy",
    shortTitle: "Buyer Protection",
    version: "1.4",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Explains how courier checkout, AWB tracking, and local meetup inspections work on AksharSetu.",
    requiresCounselNotice: true,
    sections: [
      {
        heading: "1. Transparent Condition Grading",
        body: "Every listing requires a 5-point condition breakdown (Cover, Pages, Highlighting, Notes, Binding). Buyers can also request additional photos directly inside the chat thread before purchasing.",
      },
      {
        heading: "2. Local Meetup Inspection vs. Courier Checkout",
        body: "For Campus/Local Meetups (₹0 shipping & ₹0 platform fee), buyers inspect the physical book in person at handoff before paying the seller. For courier orders placed via Razorpay checkout, an AWB shipment record is created and tracked under /orders.",
      },
      {
        heading: "3. Reporting Transaction Issues",
        body: "If a shipment is not dispatched or arrives materially different from its 5-point condition disclosure, buyers may submit a 'Payment / Order Issue' ticket via /support within 48 hours of delivery.",
      },
    ],
    changeHistory: [
      {
        version: "1.4",
        date: "2026-11-16",
        summary: "Detailed distinction between Local Meetup Reservations and Courier Checkout.",
      },
    ],
  },

  "seller-guidelines": {
    slug: "seller-guidelines",
    title: "Seller Guidelines",
    shortTitle: "Seller Guidelines",
    version: "1.3",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Best practices for accurate condition grading, responsive messaging, and timely order dispatch.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. Accurate 5-Point Grading",
        body: "Disclose any highlighting, margin notes, or spine wear honestly using the 1–5 condition sliders on /catalog/new.",
      },
      {
        heading: "2. Managing Availability & Offers",
        body: "Keep your listings up to date. Use the Seller Action bar in your chat header or the 'My Listings' tab in /orders to mark books as Reserved or Sold promptly.",
      },
    ],
    changeHistory: [
      {
        version: "1.3",
        date: "2026-11-16",
        summary: "Added in-chat Seller Action bar guidance.",
      },
    ],
  },

  refunds: {
    slug: "refunds",
    title: "Refund & Cancellation Policy",
    shortTitle: "Refunds & Cancellations",
    version: "1.2",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "How order cancellations, withdrawn offers, and dispute reviews are handled.",
    requiresCounselNotice: true,
    sections: [
      {
        heading: "1. Offer Withdrawals & Meetup Cancellations",
        body: "Pending price offers can be withdrawn at any time before seller acceptance. Local meetup reservations carry ₹0 upfront platform fee and can be cancelled by notifying the seller in chat.",
      },
      {
        heading: "2. Courier Orders & Dispute Resolution",
        body: "Because AksharSetu is a peer-to-peer marketplace, completed in-person handoffs are final once inspected. For courier orders where a seller fails to ship or a payment error occurs, submit a ticket at /support with your Order ID for administrative review.",
      },
    ],
    changeHistory: [
      {
        version: "1.2",
        date: "2026-11-16",
        summary: "Clarified peer-to-peer meetup finality and support ticket workflow.",
      },
    ],
  },

  "intellectual-property": {
    slug: "intellectual-property",
    title: "Intellectual Property & Copyright Policy",
    shortTitle: "Copyright & IP",
    version: "1.2",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Public-domain digital library sourcing, first-sale doctrine for physical books, and copyright takedown notices.",
    requiresCounselNotice: true,
    sections: [
      {
        heading: "1. Public-Domain Digital Library",
        body: "All digital books in the AksharSetu E-Library (/ebooks) are sourced from public-domain and open-access repositories (Project Gutenberg, Standard Ebooks, Open Library, Internet Archive).",
      },
      {
        heading: "2. Counterfeit & Pirated Physical Books",
        body: "Resale of lawfully acquired physical books is permitted, whereas unauthorized reprints or pirated copies are strictly prohibited.",
      },
      {
        heading: "3. Submitting a Copyright Notice",
        body: "Rights holders may report alleged copyright infringement through /support?category=COPYRIGHT_DMCA with the specific URL and proof of ownership.",
      },
    ],
    changeHistory: [
      {
        version: "1.2",
        date: "2026-11-16",
        summary: "Added direct copyright reporting link via Support Ticket workflow.",
      },
    ],
  },

  "acceptable-use": {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    shortTitle: "Acceptable Use",
    version: "1.3",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Prohibits spam, XP manipulation, automated scraping, and malicious uploads.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. Anti-Spam & Messaging Integrity",
        body: "Automated message flooding, duplicate spam messages, and unsolicited commercial links are blocked by server-side rate limits.",
      },
      {
        heading: "2. Progression & XP Integrity",
        body: "Attempting to forge reading sessions, manipulate XP endpoints, or farm fake transactions is prohibited. Administrators audit the XP ledger and reverse invalid transactions.",
      },
    ],
    changeHistory: [
      {
        version: "1.3",
        date: "2026-11-16",
        summary: "Added XP anti-abuse and attachment validation rules.",
      },
    ],
  },

  moderation: {
    slug: "moderation",
    title: "Content Moderation Policy",
    shortTitle: "Moderation",
    version: "1.2",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "How user reports, listing removals, and XP audit reversals are reviewed by platform administrators.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. How Reports Are Reviewed",
        body: "Reports submitted from conversations, profiles, or /support are queued in the Admin Console (/admin) and categorized by reason (Spam, Scam, Harassment, Inappropriate Content, Copyright).",
      },
      {
        heading: "2. Enforcement Actions",
        body: "Moderators may unlist non-compliant books, reverse fraudulent XP transactions, or restrict accounts that repeatedly violate community safety rules.",
      },
    ],
    changeHistory: [
      {
        version: "1.2",
        date: "2026-11-16",
        summary: "Integrated user report categories and admin XP reversal audit logs.",
      },
    ],
  },

  "account-appeals": {
    slug: "account-appeals",
    title: "Account Suspension & Appeals Policy",
    shortTitle: "Account Appeals",
    version: "1.1",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "How to appeal a listing removal, XP reversal, or account restriction.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. Grounds for Restriction",
        body: "Accounts may be restricted for counterfeit book sales, payment fraud, harassment in messages, or severe XP/progression abuse.",
      },
      {
        heading: "2. Submitting an Appeal",
        body: "If you believe a moderation action was taken in error, submit an 'Account Access Assistance' ticket at /support with your account email and relevant context.",
      },
    ],
    changeHistory: [
      {
        version: "1.1",
        date: "2026-11-16",
        summary: "Published formal appeal ticket procedure.",
      },
    ],
  },

  accessibility: {
    slug: "accessibility",
    title: "Accessibility Statement",
    shortTitle: "Accessibility",
    version: "1.1",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Our commitment to keyboard navigation, high-contrast typography, and customizable E-Reader legibility.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. High-Contrast Minimalist Design",
        body: "AksharSetu uses high-contrast typography, semantic HTML landmarks, keyboard-accessible message composers, and clear focus rings across desktop and mobile viewports.",
      },
      {
        heading: "2. Customizable Reading Experience",
        body: "The E-Library reader supports adjustable font sizes, line spacing, and contrast themes (Paper, Sepia, Night) to reduce visual fatigue.",
      },
    ],
    changeHistory: [
      {
        version: "1.1",
        date: "2026-11-16",
        summary: "Documented E-Reader visual controls and keyboard shortcuts.",
      },
    ],
  },

  "contact-policy": {
    slug: "contact-policy",
    title: "Contact & Support Policy",
    shortTitle: "Contact Policy",
    version: "1.1",
    effectiveDate: "September 1, 2026",
    lastUpdated: "November 16, 2026",
    summary:
      "Official channels for submitting support tickets, bug reports, and legal notices.",
    requiresCounselNotice: false,
    sections: [
      {
        heading: "1. Official Support Ticket Portal",
        body: "All support inquiries, bug reports, and safety escalations are tracked through /support, which assigns a unique Ticket ID (TKT-...) and tracks status updates (Open, In Progress, Waiting for User, Resolved, Closed).",
      },
    ],
    changeHistory: [
      {
        version: "1.1",
        date: "2026-11-16",
        summary: "Added ticket status lifecycle definitions.",
      },
    ],
  },
}

export const LEGAL_DOCUMENT_LIST = Object.values(LEGAL_DOCUMENTS)

export function getLegalDocumentBySlug(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS[slug]
}

