# AksharSetu Development Guidelines & Design Rules

## UI / UX Design System: Modern High-Contrast Minimalist Aesthetic

All frontend pages, components, and layouts in this project MUST strictly follow the design guidelines below:

### 1. Typography & Hierarchy
- **Font Stack**: System fonts (`system-ui, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, sans-serif`).
- **Headlines**: Large, bold, tight-tracking headlines with punchy copywriting (e.g. `tracking-tighter font-bold leading-none`).
- **Body Text**: Clean, medium-weight neutral text (`text-[#86868b]` on dark/light, `#1d1d1f` on light backgrounds).

### 2. Color Palette
- **Hero & High-Impact Sections**: Deep black background (`#000000`) with crisp white/light gray typography (`#f5f5f7`).
- **Content & Bento Sections**: Clean off-white/light gray (`#f5f5f7`) with pure white cards (`#ffffff`) and soft shadows (`shadow-sm`).
- **Primary Accent / Interactive**: Cobalt Blue (`#0066cc`, hover `#0071e3`).
- **Secondary Pill Buttons**: Soft light gray (`#e8e8ed`, hover `#d2d2d7`) or frosted glass.

### 3. Navigation & Layout Elements
- **Navbar**: Compact (height ~48px/12), dark translucent background (`bg-[rgba(0,0,0,0.8)]`), `backdrop-blur-md`, subtle bottom border (`border-b border-white/10`).
- **Buttons**: Pill-shaped (`rounded-full`), clean padding, no unnecessary bulky borders.
- **Grids & Cards**: Bento-box layouts with modern rounded corners (`rounded-2xl`).
- **Animations**: Subtle, smooth Framer Motion fades (`ease: [0.16, 1, 0.3, 1]`) and scroll-driven revelations. Avoid bouncy or playful cartoon animations.
