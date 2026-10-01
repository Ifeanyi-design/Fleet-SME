# DESIGN SYSTEM & UI STYLE GUIDE (`style.md`)

> Reverse-engineered from 14 logistics / fleet / courier dashboard references
> (Cargo, Quick Courier, Courier, NexaFleet, Driver Stats, Smile Food, Fleetory,
> FastTrack, LoadLogic, ArgoLogics, Shipmate, CargoCast, Fleet kanban ×2).
>
> **This file is the single source of truth.** Every component, page, and layout
> built in this project MUST conform to the tokens, rules, and patterns below.
> Do not invent new colors, radii, shadows, or spacing values without adding them here first.

---

## 1. Visual Theme & Philosophy

- **Aesthetic Direction:** **Clean Light SaaS** — flat white surfaces floating on a
  soft cool-neutral canvas, soft-rounded geometry, one vivid accent color, and
  restrained depth. Reads as a serious *operational tool*, not a consumer app.
- **Overall Mood & Tone:**
  - Calm, precise, trustworthy. The UI gets out of the way of the data.
  - **Contrast:** medium-high for text (never pure black on pure white — use slate-900),
    deliberately **low for surfaces** — cards separate from the canvas through a
    1px hairline border + a soft shadow, *not* through heavy contrast or dark fills.
  - **Color warmth:** cool-neutral canvas (slate-tinted gray `#F4F5F7`); warm accents
    (amber/orange) are reserved for **status only**.
  - **Density:** medium-dense. 3–5 stat cards per row on desktop; 8–10 table rows per
    viewport. Density is tamed by generous *inside-card* padding and a strict 4/8pt rhythm.
- **Primary accent = Green.** Rationale: logistics semantics (active, on-time, delivered)
  map naturally onto green, it is the dominant accent across the reference set
  (Smile Food, ArgoLogics, NexaFleet, Fleetory), and it doubles cleanly as the
  `success` token. Red/amber/blue are reserved for semantic states.
- **Depth philosophy:** *soft, not flat, not glassy.* Elevation = hairline border +
  two-layer shadow. Glassmorphism (`backdrop-blur`) is reserved **exclusively** for
  floating overlays, map control panels, and modals — never for static cards.
- **Sidebar:** white by default (icon rail or full rail). Dark navy sidebar is an
  approved alternate variant only (§2, `--sidebar-dark`).

---

## 2. Color Palette & Tokens

### 2.1 Canvas & Surfaces

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--bg-canvas` | `#F4F5F7` | `bg-[#F4F5F7]` / `slate-100`-ish | App background behind everything |
| `--bg-canvas-alt` | `#F7F8FA` | `bg-slate-50` | Softer canvas for marketing/auth |
| `--bg-surface` | `#FFFFFF` | `bg-white` | Cards, panels, tables, sidebar |
| `--bg-surface-sunken` | `#F9FAFB` | `bg-slate-50` | Table headers, inset rows, wells |
| `--bg-overlay` | `rgba(15,23,42,0.45)` | `bg-slate-900/45` | Modal / drawer scrim |
| `--bg-hover` | `#F3F4F6` | `bg-gray-100` | Row hover, ghost-button hover |
| `--bg-sidebar-dark` | `#111827` | `bg-gray-900` | *Alternate* dark sidebar variant |

### 2.2 Borders & Dividers

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--border-subtle` | `#EDEEF2` | `border-[#EDEEF2]` | Card border (default) |
| `--border-default` | `#E5E7EB` | `border-gray-200` | Inputs, dividers, table rules |
| `--border-strong` | `#D1D5DB` | `border-gray-300` | Focused inputs, emphasized edges |
| `--border-hover` | `#CBD5E1` | `border-slate-300` | Card border on hover |
| `--divider` | `#F1F2F4` | `border-[#F1F2F4]` | Table row separators (lighter than border) |

### 2.3 Text Hierarchy

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--text-primary` | `#0F172A` | `text-slate-900` | Headings, key numbers, table primary |
| `--text-body` | `#334155` | `text-slate-700` | Body copy, table cells |
| `--text-secondary` | `#64748B` | `text-slate-500` | Labels, subtitles, meta |
| `--text-muted` | `#94A3B8` | `text-slate-400` | Placeholders, timestamps, helper |
| `--text-disabled` | `#CBD5E1` | `text-slate-300` | Disabled controls, empty state art |
| `--text-inverse` | `#FFFFFF` | `text-white` | On dark / on accent fills |

### 2.4 Accents & Semantic States

| Role | Solid | Hover/Strong | Tint bg | Tint text | Tailwind |
|---|---|---|---|---|---|
| **Primary (brand)** | `#16A34A` | `#15803D` | `#DCFCE7` | `#15803D` | `green-600 / 700 / 100 / 700` |
| **Primary bright** | `#22C55E` | — | `#DCFCE7` | — | `green-500` |
| **Success** | `#16A34A` | `#15803D` | `#DCFCE7` | `#15803D` | `green-600` |
| **Warning** | `#F59E0B` | `#D97706` | `#FEF3C7` | `#B45309` | `amber-500 / 600 / 100 / 700` |
| **Error / Danger** | `#EF4444` | `#DC2626` | `#FEE2E2` | `#B91C1C` | `red-500 / 600 / 100 / 700` |
| **Info** | `#3B82F6` | `#2563EB` | `#DBEAFE` | `#1D4ED8` | `blue-500 / 600 / 100 / 700` |
| **Neutral / Cancelled** | `#6B7280` | — | `#F3F4F6` | `#6B7280` | `gray-500 / 100 / 500` |

**Secondary accent palette** (use sparingly — data viz categories, feature icons, one-off emphasis):

| Name | Hex | Tailwind | Where it appeared |
|---|---|---|---|
| Orange | `#F97316` | `orange-500` | CargoCast, Fleet kanban, Shipmate CTA |
| Violet | `#8B5CF6` | `violet-500` | Cargo dashboard |
| Pink | `#EC4899` | `pink-500` | NexaFleet status bar |
| Amber | `#F5B301` | `amber-400` | Shipmate brand |

### 2.5 Gradients

Use gradients **only** for: hero/stat feature cards, chart fills, and map overlays. Never on text.

```css
/* Revenue / highlight stat card (NexaFleet "Revenue Over Time") */
--grad-warm: linear-gradient(135deg, #FB923C 0%, #F97316 55%, #EA580C 100%);

/* Soft brand header wash (Courier banner) */
--grad-brand-wash: linear-gradient(135deg, #EAF2FF 0%, #F3ECFF 100%);

/* Primary CTA (subtle, optional) */
--grad-primary: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);

/* Chart area fills: solid accent at 12–20% opacity, fade to transparent */
--grad-area-green: linear-gradient(180deg, rgba(34,197,94,.20), rgba(34,197,94,0));
--grad-area-orange: linear-gradient(180deg, rgba(249,115,22,.20), rgba(249,115,22,0));
```

### 2.6 CSS Variables (drop into `:root`)

```css
:root {
  /* canvas & surfaces */
  --bg-canvas: #F4F5F7;
  --bg-surface: #FFFFFF;
  --bg-surface-sunken: #F9FAFB;
  --bg-hover: #F3F4F6;
  --bg-overlay: rgba(15, 23, 42, 0.45);

  /* borders */
  --border-subtle: #EDEEF2;
  --border-default: #E5E7EB;
  --border-strong: #D1D5DB;
  --border-hover: #CBD5E1;

  /* text */
  --text-primary: #0F172A;
  --text-body: #334155;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
  --text-disabled: #CBD5E1;
  --text-inverse: #FFFFFF;

  /* brand + semantic */
  --primary: #16A34A;
  --primary-hover: #15803D;
  --primary-bright: #22C55E;
  --primary-tint: #DCFCE7;
  --success: #16A34A;  --success-tint: #DCFCE7;
  --warning: #F59E0B;  --warning-tint: #FEF3C7;
  --error:   #EF4444;  --error-tint:   #FEE2E2;
  --info:    #3B82F6;  --info-tint:    #DBEAFE;
  --neutral: #6B7280;  --neutral-tint: #F3F4F6;

  /* radii */
  --r-card: 16px;
  --r-panel: 20px;
  --r-control: 12px;
  --r-chip: 10px;
  --r-pill: 999px;

  /* shadows */
  --shadow-xs: 0 1px 2px rgba(16, 24, 40, 0.04);
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.05), 0 1px 3px rgba(16, 24, 40, 0.04);
  --shadow-md: 0 2px 4px rgba(16, 24, 40, 0.04), 0 6px 16px rgba(16, 24, 40, 0.06);
  --shadow-lg: 0 8px 24px rgba(16, 24, 40, 0.08), 0 2px 6px rgba(16, 24, 40, 0.04);
  --shadow-pop: 0 12px 32px rgba(16, 24, 40, 0.14);

  /* motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 150ms;
  --dur-base: 200ms;
  --dur-slow: 300ms;
}
```

### 2.7 Tailwind Theme Extension

```js
// tailwind.config.(js|ts) → theme.extend
extend: {
  colors: {
    canvas: { DEFAULT: '#F4F5F7', sunken: '#F9FAFB' },
    brand: {
      50:'#F0FDF4', 100:'#DCFCE7', 500:'#22C55E',
      600:'#16A34A', 700:'#15803D', 800:'#166534',
    },
    surface: { DEFAULT: '#FFFFFF', hover: '#F3F4F6' },
    hairline: { DEFAULT: '#EDEEF2', strong: '#E5E7EB', hover: '#CBD5E1' },
    ink: { primary:'#0F172A', body:'#334155', secondary:'#64748B', muted:'#94A3B8', disabled:'#CBD5E1' },
    state: {
      success:'#16A34A', warning:'#F59E0B', error:'#EF4444', info:'#3B82F6', neutral:'#6B7280',
    },
  },
  borderRadius: { card:'16px', panel:'20px', control:'12px', chip:'10px' },
  boxShadow: {
    xs:'0 1px 2px rgba(16,24,40,.04)',
    card:'0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.04)',
    md:'0 2px 4px rgba(16,24,40,.04), 0 6px 16px rgba(16,24,40,.06)',
    pop:'0 12px 32px rgba(16,24,40,.14)',
  },
  fontFamily: {
    sans: ['Inter','system-ui','-apple-system','Segoe UI','sans-serif'],
    mono: ['JetBrains Mono','ui-monospace','SFMono-Regular','monospace'],
  },
}
```

---

## 3. Typography & Hierarchy

### 3.1 Font Families

| Role | Family | Fallback stack |
|---|---|---|
| **Primary / body / display** | **Inter** | `Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| **Monospace** (IDs, tracking codes, currency-adjacent numerals) | **JetBrains Mono** | `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace` |

- Use `font-variant-numeric: tabular-nums` (`tabular-nums`) on **all** metric values,
  table amount columns, and chart axes so digits align in columns.
- Load Inter via `next/font` or a single `<link>`; never load more than 2 weights per family
  (400 + 600) plus 500 if needed. Keep the app light for the target hardware.

### 3.2 Heading Scale

| Element | Size / Line | Tailwind | Weight | Tracking |
|---|---|---|---|---|
| Page / hero title | 28–32px / 36px | `text-3xl` | 700 | `tracking-tight` |
| Section heading | 20px / 28px | `text-xl` | 600 | `tracking-tight` |
| Card title | 16px / 24px | `text-base` | 600 | `tracking-[-0.01em]` |
| Metric value (big number) | 24–30px / 32px | `text-2xl` / `text-3xl` | 700 | `tracking-tight tabular-nums` |
| Table header | 11–12px / 16px | `text-xs` | 600 | `uppercase tracking-wider` |
| Body | 14px / 20–22px | `text-sm` | 400 | normal |
| Label / meta | 12–13px / 18px | `text-xs` / `text-[13px]` | 500 | normal |
| Caption / timestamp | 11–12px / 16px | `text-xs` | 400–500 | normal |

Rules:
- **One `text-3xl` per view** (the primary metric or greeting). Everything else steps down.
- Section/card titles are `font-semibold` (600), **never** bold (700) — 700 is reserved
  for hero titles and big metric numbers only.
- Headings use `tracking-tight`; body never gets negative tracking.

### 3.3 Body & Captions

- Default body: `text-sm leading-relaxed text-slate-700`.
- Muted helper/meta: `text-xs text-slate-500`; timestamps `text-xs text-slate-400`.
- Uppercase micro-labels (table headers, section eyebrows): `text-[11px] font-semibold uppercase tracking-wider text-slate-500`.
- Links: `text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline`.

---

## 4. Spacing, Layout & Radius

### 4.1 Border Radius Rules

| Element | Radius | Tailwind |
|---|---|---|
| Cards / containers / stat tiles | **16px** | `rounded-2xl` → use `rounded-card` |
| Large panels / modals / drawers | **20px** | `rounded-panel` |
| Buttons / inputs / selects / tabs | **12px** | `rounded-xl` → `rounded-control` |
| Small chips / icon tiles / inner wells | **10px** | `rounded-chip` |
| Badges / pills / avatars / toggles | **full** | `rounded-full` |
| Nested inner cards | radius − 4px from parent | e.g. inner of a 16px card = `rounded-xl` |

**Golden rule:** child radius = parent radius − (padding gap). Never nest a `rounded-2xl`
directly inside another `rounded-2xl` with equal corner — step it down.

### 4.2 Container Padding & Gaps

| Context | Padding | Tailwind |
|---|---|---|
| Page shell (desktop) | 24–32px | `p-6 lg:p-8` |
| Card / panel inner | 20–24px | `p-5` / `p-6` |
| Compact stat tile | 16px | `p-4` |
| Table cell | `py-3 px-4` | `py-3 px-4` |
| Card grid gap | 16–24px | `gap-4` / `gap-6` |
| Section vertical rhythm | 24–32px | `space-y-6` / `space-y-8` |
| Icon-to-label gap | 8px | `gap-2` |

- **Base unit = 4px.** All spacing is a multiple of 4 (prefer 8/12/16/20/24/32).
- Sidebar width: **240px** expanded, **72px** icon-rail collapsed.
- Topbar height: **64px**.

### 4.3 Layout Density & Grid

- **Desktop dashboard grid:** 12-col, `gap-6`.
  - Stat row: 4–5 tiles → `grid-cols-2 lg:grid-cols-4 xl:grid-cols-5`.
  - Main content: `grid-cols-1 lg:grid-cols-3` (2/3 primary + 1/3 side rail).
  - Charts + tables: charts on top (`h-[260px]`–`h-[320px]`), tables full-width below.
- **Responsive breakpoints:** mobile 1-col → `md` 2-col → `lg` 3-col → `xl` 4/5-col.
- Tables collapse to **stacked cards** below `md` (never horizontal-scroll a data table on mobile).
- Max content width for marketing/auth pages: **1200px** (`max-w-6xl mx-auto`).

---

## 5. Depth, Elevation & Effects

### 5.1 Box Shadows (2-layer, low opacity)

```css
--shadow-xs: 0 1px 2px rgba(16,24,40,.04);                                   /* inputs, chips */
--shadow-sm: 0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.04);     /* default card */
--shadow-md: 0 2px 4px rgba(16,24,40,.04), 0 6px 16px rgba(16,24,40,.06);    /* hover card / popover */
--shadow-lg: 0 8px 24px rgba(16,24,40,.08), 0 2px 6px rgba(16,24,40,.04);    /* drawer, dropdown */
--shadow-pop: 0 12px 32px rgba(16,24,40,.14);                                /* modal */
```

- Cards rest at `shadow-sm`; on hover rise to `shadow-md` + `border-hover`. Never use a
  single heavy shadow — always two layers (a tight contact shadow + a soft ambient one).
- Colored glow is **not** part of this system (no neon/glow). The only exception is a
  subtle focus ring on inputs (below).

### 5.2 Borders & Rings

- Default card: `border border-[#EDEEF2]`.
- **Focus ring (inputs, buttons, links):** `focus-visible:ring-2 ring-brand-500/40 ring-offset-1 ring-offset-white outline-none`.
- Selected/active nav item: `bg-brand-50 text-brand-700` + a 3px left bar `bg-brand-600` (or a filled `bg-brand-600 text-white` pill).
- Never rely on color alone for state — pair every colored status with a text label and/or icon.

### 5.3 Blurs & Glassmorphism (restricted)

| Use case | Recipe |
|---|---|
| Modal / drawer scrim | `bg-slate-900/45 backdrop-blur-[2px]` |
| Floating map control panel | `bg-white/80 backdrop-blur-md border border-white/60 shadow-lg` |
| Sticky topbar over content | `bg-white/80 backdrop-blur-md border-b border-[#EDEEF2]` |
| Sticky table header | `bg-white/90 backdrop-blur-sm` |

**Do NOT** apply glass to standard content cards — they stay opaque white.

---

## 6. Component Specification Rules

> Copy these class strings directly. They are the canonical implementations.

### 6.1 Buttons

```tsx
// Primary — the single main action per view
"inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium
 text-white shadow-sm transition-all duration-200 ease-out
 hover:bg-brand-700 hover:shadow-md hover:-translate-y-px
 active:translate-y-0 active:scale-[0.99]
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1"

// Secondary (outline)
"inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5
 text-sm font-medium text-slate-700 shadow-xs transition-all duration-200
 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99]"

// Ghost (toolbar / icon)
"inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
 text-slate-600 transition-colors duration-150 hover:bg-gray-100 hover:text-slate-900"

// Destructive
"...same as primary but bg-red-500 hover:bg-red-600"

// Sizes: sm = px-3 py-2 text-[13px] | md = px-4 py-2.5 (default) | lg = px-5 py-3 text-base
// Icon button: size-9 rounded-xl grid place-items-center (use size-10 for touch)
```

### 6.2 Cards & Surfaces

```tsx
// Standard card
"rounded-2xl border border-[#EDEEF2] bg-white p-5 shadow-sm
 transition-all duration-200 ease-out hover:shadow-md hover:border-slate-300"

// Stat tile (compact)
"rounded-2xl border border-[#EDEEF2] bg-white p-4 shadow-sm"
//   → label:  text-[13px] text-slate-500 font-medium
//   → value:  text-2xl font-bold tracking-tight tabular-nums text-slate-900 mt-1

// Sunken well / inset section inside a card
"rounded-xl bg-slate-50 border border-gray-100 p-4"

// Highlight / feature card (gradient allowed)
"rounded-2xl p-5 text-white shadow-md bg-[linear-gradient(135deg,#FB923C,#EA580C)]"

// Table container
"rounded-2xl border border-[#EDEEF2] bg-white shadow-sm overflow-hidden"
//   → header row: bg-slate-50/70, cells text-[11px] font-semibold uppercase tracking-wider text-slate-500
//   → body rows: divide-y divide-[#F1F2F4], hover:bg-gray-50/70, cell py-3 px-4 text-sm
```

### 6.3 Input Fields & Forms

```tsx
// Text input / search
"h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-slate-900
 placeholder:text-slate-400 shadow-xs transition-colors duration-150
 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"

// With leading icon: add pl-10 to input, icon absolutely positioned
//   <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">

// Select / dropdown trigger — same as input, plus a chevron on the right (pr-9)
// Label:   text-[13px] font-medium text-slate-700 mb-1.5
// Helper:  text-xs text-slate-500 mt-1.5
// Error:   border-red-400 ring-2 ring-red-500/20 + text-xs text-red-600 helper
```

- Input height is a strict **40px** (`h-10`); large search bars in topbars use **44px** (`h-11`).
- Placeholder opacity is `text-slate-400` (≈ 55–60% perceived), never near-invisible.

### 6.4 Badges, Pills & Status Chips

```tsx
// Base pill
"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"

// Semantic variants (tint bg + tint text) — canonical status set
Delivered / Completed / Active : "bg-brand-100 text-brand-700"
Pending / Processing           : "bg-amber-100 text-amber-700"
In Transit / Info              : "bg-blue-100 text-blue-700"
Shorted / Failed / Delayed     : "bg-red-100 text-red-700"
Cancelled / Neutral            : "bg-gray-100 text-gray-500"
// optional status dot: <span className="size-1.5 rounded-full bg-current" />
```

- Pills are always `rounded-full`, always low-saturation tint background + darker same-hue text.
- Never use a saturated solid background for a status pill (reserve solid fills for the primary button).

### 6.5 Sidebar / Navigation

```tsx
// Rail: w-60 (240px) expanded / w-[72px] collapsed; bg-white border-r border-[#EDEEF2]
// Item (default): "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
//                  text-slate-500 transition-colors duration-150 hover:bg-gray-100 hover:text-slate-900"
// Item (active):  "bg-brand-50 text-brand-700 font-semibold"
//   + active indicator: absolute left-0 h-6 w-[3px] rounded-full bg-brand-600
// Section label:  "px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
```

### 6.6 Charts (data-viz tokens)

- Grid lines: `#F1F2F4` (1px, dashed allowed). Axis labels: `text-xs text-slate-400`.
- Bar/column: primary `#22C55E`; highlight/selected bar `#0F172A` (near-black) as seen in
  Driver Stats & LoadLogic; muted/context bars `#E5E7EB`.
- Donut/ring: stroke width ≈ 14–18px, track `#F1F2F4`, segments use the semantic palette.
- Line/area: `#22C55E` stroke 2px, area fill via `--grad-area-green`.
- Always show a value tooltip on hover (dark chip: `bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg`).

### 6.7 Tables

- Sticky header (`bg-white/90 backdrop-blur-sm`), uppercase micro-label headers (§3.2).
- Row height ≈ 52–56px; `divide-y divide-[#F1F2F4]`; hover `bg-gray-50/70`.
- First column often an **ID in mono** (`font-mono text-[13px] text-slate-700`).
- Last column = actions: text link (`text-brand-600 hover:text-brand-700 font-medium text-sm`)
  or a ghost icon button. Never more than 2 visible row actions.
- Amounts right-aligned, `tabular-nums`, `font-medium text-slate-900`.
- Empty state: centered icon in a `size-12 rounded-full bg-slate-100` circle + `text-sm text-slate-500` copy.

---

## 7. Motion & Micro-Interactions

### 7.1 Timing Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | `150ms` | Color/opacity changes, nav hover, pill swap |
| `--dur-base` | `200ms` | Card hover lift, button hover, dropdown open |
| `--dur-slow` | `300ms` | Modal/drawer enter, accordion expand |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for all entrances / lifts |

### 7.2 Interaction Rules

- **Card hover:** `shadow-sm → shadow-md`, `border → slate-300`, `translate-y-[-2px]`, `200ms ease-out`.
  (Subtle lift only — max 2px. No scale on cards.)
- **Primary button hover:** darken bg one step + `shadow-sm → shadow-md` + `-translate-y-px`;
  active: `translate-y-0 scale-[0.99]`.
- **Ghost/icon button hover:** background tint only (`bg-gray-100`), 150ms.
- **Table row hover:** background tint only (`bg-gray-50/70`), 150ms — no lift.
- **Image / thumbnail hover:** `scale-[1.03]` inside an `overflow-hidden` container, 300ms ease-out.
- **Modal / drawer:** enter `opacity-0 scale-[0.98] translate-y-1 → opacity-100 scale-100 translate-y-0`,
  `300ms ease-out`; scrim fades in at `200ms`.
- **Dropdown / popover:** `opacity-0 -translate-y-1 → opacity-100 translate-y-0`, `200ms ease-out`,
  origin top; chevron rotates `180deg` at `200ms`.
- **Tab / segmented control:** active pill background slides with a `200ms ease-out` transition;
  active = solid dark (`bg-slate-900 text-white`) or `bg-brand-600 text-white`.
- **Toast:** slide-in from bottom-right `translate-y-2 → 0` + fade, auto-dismiss ~4s, `300ms ease-out`.
- **Skeleton loaders:** `animate-pulse` on `bg-slate-100` blocks matching final geometry.
- **Chart draw-in:** bars grow from baseline / lines draw left→right, `600–800ms ease-out`,
  only on first mount (never re-animate on refetch).

### 7.3 Accessibility & Restraint

- Wrap all of the above in `@media (prefers-reduced-motion: reduce)` → disable transforms,
  keep only opacity fades.
- Motion is **functional, never decorative** — no auto-playing carousels, no looping glow,
  no parallax on data screens. One animation per interaction.
- Every interactive element has a visible `:focus-visible` ring (§5.2) and a ≥40px touch target.

---

## Appendix A — Do / Don't Quick Reference

**Do**
- White cards on `#F4F5F7`, hairline border + soft 2-layer shadow.
- One `text-3xl` metric per view; `font-semibold` for section titles, `font-bold` only for hero/metrics.
- Green (`#16A34A`) for the primary action and success; amber/red/blue strictly for state.
- `rounded-2xl` cards, `rounded-xl` controls, `rounded-full` pills — stepped nesting.
- `tabular-nums` on every number, table amount, and chart axis.

**Don't**
- No neon, no glow, no heavy drop shadows, no pure-black-on-pure-white.
- No glassmorphism on static cards (overlays/map panels only).
- No saturated solid backgrounds on status pills.
- No gradients on text; no more than one accent color per component.
- No horizontal-scrolling data tables on mobile — stack to cards.

## Appendix B — Token File Naming

When generating components, reference tokens by their **Tailwind aliases** (`bg-surface`,
`text-ink-secondary`, `border-hairline`, `shadow-card`, `rounded-card`, `text-brand-600`)
rather than raw hex, so the palette can be re-themed in one place.
