# AksharSetu - Design System & UI Guidelines

This document outlines the official design system for AksharSetu, featuring a modern, minimalist, high-contrast aesthetic.

---

## 1. Core Principles

- **Minimalist Elegance**: High negative space, uncluttered views, and clear visual hierarchy.
- **High Contrast**: Seamless transitions between immersive deep black hero sections and clean, modern off-white content areas.
- **Subtle Motion**: Smooth, cinematic scroll and fade transitions (Framer Motion) instead of playful/bouncy animations.
- **Bento Grids**: Modern rounded cards displaying features and book collections in structured bento boxes.

---

## 2. Color Palette

| Token | Hex Code | Usage |
| :--- | :--- | :--- |
| **Dark Background** | `#000000` | Hero section, media showcases, dark mode |
| **Dark Foreground** | `#f5f5f7` | Primary text on dark backgrounds |
| **Secondary Dark Text** | `#86868b` | Subtitles, captions on dark backgrounds |
| **Light Background** | `#f5f5f7` | Section backgrounds, bento grid containers |
| **Card Surface** | `#ffffff` | Bento cards, listing cards, modal dialogs |
| **Light Foreground** | `#1d1d1f` | Primary text on light backgrounds |
| **Cobalt Blue (Accent)**| `#0066cc` | CTAs, hyperlinks, active states (hover: `#0071e3`) |
| **Secondary Gray** | `#e8e8ed` | Pill badges, secondary button backgrounds |

---

## 3. Typography

- **Font Family**: `system-ui, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif`
- **Headings**: Extra bold / tight tracking (`tracking-tighter font-bold leading-none`)
- **Body**: Medium weight, high readability (`font-medium tracking-tight text-[#86868b]`)

---

## 4. Component Rules

- **Buttons**: Pill-shaped (`rounded-full`), smooth transitions (`transition-colors` or `transition-all`).
- **Navbar**: Translucent frosted glass (`bg-[rgba(0,0,0,0.8)] backdrop-blur-md`), compact height (`h-12`).
- **Cards**: Large corner radius (`rounded-[2rem]` to `rounded-[2.5rem]`), subtle border or light shadow (`shadow-sm`).
