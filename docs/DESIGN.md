# ApplyChase — Design PRD

**Status:** v1.0 — design plan for review before implementation
**Purpose:** This is the visual/UX companion to `docs/PRD.md`. It does not change any functionality — every page, form, and action already built stays exactly as it works today. This document only governs how it looks and feels.

**Process note for Claude Code:** Read this whole document first. Before writing any CSS/component code, confirm the token system in §2 with the user if anything is ambiguous — don't guess and build. Once confirmed, apply consistently across all existing pages in one pass, then do a self-critique against §7 before calling it done.

---

## 1. Design Vision

ApplyChase's entire value proposition is a defensible paper trail — proof of what was collected, from whom, and when. The design should feel like **a well-run case-file system**, not a generic SaaS dashboard. Think: the calm, deliberate feeling of a well-organized filing office — manila folders, rubber stamps, timestamped ledgers — translated into a modern web interface, not literally skeuomorphic.

**Explicitly avoid the three AI-design defaults:** no warm cream background + serif headline + terracotta accent; no near-black background + neon-green/vermilion accent; no stark broadsheet/newspaper-column layout. None of those are wrong on principle, they're just not *this* product — a compliance/paperwork tool should feel trustworthy and calm, not trendy.

**One-sentence brief:** A landlord opens a case file the way they'd open a physical folder — see what's inside, see what's missing, see exactly when everything happened.

---

## 2. Token System

### Color (named, not generic Tailwind defaults)

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#ECEEE7` | Page background — cool, slightly green-grey off-white, not cream |
| `--card` | `#F7F6F0` | Card/panel surfaces, one step lighter than paper |
| `--ink` | `#1F2A33` | Primary text, headers, primary buttons |
| `--ink-soft` | `#5A6870` | Secondary text, captions, helper copy |
| `--stamp-red` | `#C4472B` | Primary action accent, "received" stamps, urgent/chase states — used deliberately, not everywhere |
| `--folder-tan` | `#B98A4E` | Secondary accent — badges, jurisdiction tags, warm highlights |
| `--verified` | `#3F6B4F` | Success/complete states |
| `--rule` | `#CFC9BA` | Borders, dividers, dashed placeholders |
| `--white` | `#FFFFFF` | Inputs, elevated surfaces |

This is the same palette from the original interactive prototype — carry it forward exactly, don't reinvent it.

### Typography

| Role | Face | Notes |
|---|---|---|
| Display (page titles, case-file names) | **Spectral** (serif, 600/700 weight) | Used with restraint — page titles and section headers only, never body copy |
| Body / UI (buttons, labels, forms, nav) | **Inter** (400/500/600) | Everything functional |
| Utility / data (timestamps, case IDs, confidence scores, audit log entries) | **IBM Plex Mono** (400/500) | Anything that reads as a "record" or "data," to visually distinguish fact from prose |

### Spacing & Shape

- Base unit: 4px grid
- Border radius: 6px for cards/buttons (soft, not sharp — this is a trust-building tool, not an edgy brand), 2px for small tags/badges
- Shadows: minimal — a single soft shadow on hover states only (`0 2px 8px rgba(31,42,51,0.10)`), never decorative drop shadows at rest

### Motion

- Library: **Framer Motion** (already React/Next.js, integrates directly)
- Principle per the design skill: **one orchestrated moment beats scattered effects.** Spend motion budget on the signature element (§4), keep everything else quiet.
- Standard transition: 150–200ms ease-out for hover/state changes — nothing longer, this isn't a marketing site
- Respect `prefers-reduced-motion` — disable the stamp animation and any page-load sequences for users who've set that preference; state changes should still happen, just instantly

---

## 3. Signature Element

**The stamp.** This is the one memorable thing the whole design hangs on — already prototyped, now made real:

- A **missing** requirement item shows as a dashed, empty oval outline in `--rule` grey — quiet, waiting.
- The moment an item is marked received (whether by rule match, embedding match, or manual override), it **stamps in**: a brief (250ms) scale-and-rotate-in animation, landing at a slight -3° rotation, solid `--stamp-red` border, text "RECEIVED," like a rubber stamp coming down. This is the one place motion is allowed to be a little theatrical.
- Everywhere else in the product stays calm and still.

---

## 4. Component Library

Build these as shared components once, used everywhere — don't restyle per-page.

**Buttons**
- Primary: `--ink` background, white text, `--stamp-red` on hover (not a lighter shade of the same color — a real accent shift, signals "this is the important action")
- Secondary/ghost: transparent, `--rule` border, `--ink` text, border darkens to `--ink` on hover
- Destructive (if ever needed): `--stamp-red` border and text on transparent, filled `--stamp-red` on hover
- All buttons: 6px radius, Inter 500, 150ms transition

**Inputs**
- White background, `--rule` border, `--ink` text, focus state: border becomes `--ink` with a subtle 2px focus ring in a lighter tint of `--ink` — must be visible for keyboard navigation, non-negotiable per accessibility floor

**Cards**
- `--card` background, `--rule` 1px border, 6px radius, no shadow at rest

**Badges/Tags** (jurisdiction, status)
- Small, `--folder-tan` filled for jurisdiction tags, outlined for neutral status tags, 2px radius (sharper than cards — reads as a "stamped label," not a soft UI chip)

**The stamp component** (§3) — build as its own reusable component since it appears on every case-item card and the audit packet

**Empty states**
- Never just grey placeholder text — always the explanatory copy already written in the last session, paired with a simple line-art icon (folder, stamp outline, or similar) in `--rule` grey, and a clear single next action button

---

## 5. Page-by-Page Plan

### Login
- Centered card on `--paper` background, generous whitespace — this is the calmest page in the product, first impression matters
- "ApplyChase" in Spectral, page subtitle in Inter, single "Continue with Google" button
- No stamp motif here — save it for after login, so it lands as a reveal, not overused

### Dashboard (Case Files list)
- Header: "Case Files" in Spectral, "+ New Applicant" as primary button, top-right
- Each case-file row: applicant name (Inter 600), property address (Inter 400, `--ink-soft`), and a **completeness ring** (already built as an SVG in the earlier component work) — small stamp-red/verified-green ring showing X/5, not a percentage number, since the ring itself is the case-file's "at a glance" state
- Empty state: existing copy, plus a simple folder-outline icon

### Properties
- Simple list, same list-row pattern as case files, minus the ring
- "+ New Property" primary button

### New Property / New Applicant forms
- Single-column, generous field spacing (not cramped) — these are infrequent, low-volume actions, no need to optimize for speed over clarity
- Jurisdiction field: styled as a `--folder-tan` badge-select, reinforcing that jurisdiction determines the whole requirement set

### Case File Detail — the core page
This is where the product's whole value lives, so it gets the most design attention:

- **Header:** applicant name (Spectral), property + jurisdiction badge below it
- **Compliance note banner:** keep the existing "no automated decisioning" disclaimer, styled as a quiet `--folder-tan`-bordered notice, not an alarming red warning — it's a reassurance, not an error
- **Requirement grid:** the 5 stamp cards (§3), laid out in a responsive grid, each showing label + stamp + (if received) matched-by source and confidence, in IBM Plex Mono for the data bits specifically
- **Intake box:** "Log what the applicant sent you" — textarea + "Check with AI" — keep it visually secondary to the requirement grid (this is an input tool, not the main event)
- **Chase message panel:** template output in a card styled like a **draft letter** — Plex Mono, a subtle folded-paper visual treatment (a single soft inset shadow at the top edge is enough, don't overdo it) — reinforces "this is a real message about to go out"
- **Audit packet section:** the most "official document" feeling page in the product — tighter typographic rhythm, dotted leader lines between item and status (already in the prototype's CSS), IBM Plex Mono throughout, styled like a printed manifest. This is the page a landlord might actually screenshot or print, so it should look complete and dignified on its own.

### Settings (BYOK)
- Plain, quiet, form-like — this is a configuration page, not a feature showcase. No stamp motif here.

---

## 6. Motion Inventory (Framer Motion specifics)

Keep this list short on purpose — per the design skill, restraint matters more than coverage:

1. **Stamp-in animation** (§3) — the one signature moment, used every time an item is marked received
2. **List item entrance** — case-file rows and requirement cards fade+slide in (8px, 150ms, staggered 30ms apart) on page load only, not on every re-render
3. **Button/input hover and focus states** — instant enough to feel responsive (150ms), not a design centerpiece
4. **Page transitions** — none. Don't add route-change animations; this is a workflow tool used repeatedly all day, animated page transitions become friction, not delight, on the 50th visit.

---

## 7. Restraint Checklist (self-critique before calling this done)

Before marking the design pass complete, verify:
- [ ] The stamp is the only place motion is "theatrical" — everything else is calm
- [ ] No numbered markers (01/02/03) added anywhere unless the content is a genuine sequence
- [ ] Copy wasn't touched beyond what's needed to fit the new visual containers — the copy pass already happened, don't redo it
- [ ] Keyboard focus is visible on every interactive element
- [ ] `prefers-reduced-motion` disables the stamp animation and list entrance, without breaking functionality
- [ ] Mobile: the requirement grid collapses to a single column, nav collapses sensibly — test at 375px width
- [ ] Nothing looks like the three AI-design defaults called out in §1

---

## 8. Non-Goals

- No marketing/landing page in this pass — this spec covers the authenticated app only. A public marketing homepage (if wanted later) is a separate, later brief.
- No dark mode in v1 — a single well-executed light theme first.
- No icon library sprawl — use a small, consistent set (lucide-react, already available in this environment) rather than mixing icon styles.

---

## 9. Implementation Notes for Claude Code

- Add the token system as CSS variables in the global stylesheet (or Tailwind theme extension) — don't hardcode hex values inline across components.
- Install Framer Motion: `npm install framer-motion`.
- Build the stamp as one shared component (`components/Stamp.tsx` or similar) — it's used in at least two places (case-item cards, audit packet) and should never be reimplemented twice.
- Fonts: Google Fonts (`Spectral`, `Inter`, `IBM Plex Mono`) via `next/font/google` for proper Next.js font loading, not a runtime `@import`.
- Apply in this order: tokens/global styles first, then shared components (buttons, inputs, cards, stamp), then page-by-page — verify each page visually before moving to the next, don't batch all pages then discover a systemic issue at the end.
