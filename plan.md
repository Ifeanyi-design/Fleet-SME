# PRODUCT BUILD PLAN & ARCHITECTURE (`plan.md`)

**Project:** Fleet Management System for a Delivery Company — *Case Organisation A (SME baseline)*
**Source PRD:** `prd/CSC302_Fleet_Management_System_Project_FINAL (1).docx` (CSC 302 — System Analysis & Design, UI DLC)
**Design contract:** `style.md` (Clean Light SaaS, green-primary) — **binding**
**Companion log:** `progress.md` (append-only build journal)

---

## 0. Scope Note & Assumptions (read first)

- **What we are building:** the *software system the PRD specifies* — a web Fleet Management
  System that centralises vehicles, drivers, deliveries, and maintenance for a lean courier SME.
  The PRD is the requirements/analysis artefact; this plan turns its **Table 3.6 screens**,
  **FR1–FR9**, **NFR1–NFR7**, and **3NF schema (Table 3.4)** into a shippable frontend build.
- **Interview/requirements data is replaceable.** PRD §3.3.1 ("Case Organisation A") is an
  explicitly *constructed* scenario. The app will consume this data through a **seed layer**
  (`src/data/seed/*` + backend fixtures) so that when Ifeanyi runs the **real interviews**, only
  seed content and the written narrative change — **no architectural change**. Every screen is
  driven by typed domain models, never hard-coded strings.
- **Deliberate stack deviation from the PRD.** PRD Table 4.1 specifies *Bootstrap 5*. This build
  uses **Tailwind CSS governed by `style.md`** instead, because the design system is already
  Tailwind-native and Bootstrap cannot express its tokens cleanly. Backend stays **Flask +
  SQLAlchemy + PostgreSQL** exactly as the PRD requires. *(Log this deviation in the report's
  implementation section — it is defensible: "presentation-tier framework upgraded for design-system fidelity.")*
- **Hardware reality (dev machine: i5-2520M / 8 GB / no GPU):** use **SQLite for local dev**
  (`DATABASE_URL=sqlite:///fms.db`) and PostgreSQL/Supabase free tier only in deployment. Vite
  (not Next.js) keeps the toolchain light. No Docker required.
- **Constraint respected:** no Next.js/Express. Plain React SPA + Flask API.

---

## 1. System & Tech Stack Blueprint

### 1.1 Framework & Router Setup

| Concern | Choice | Rationale |
|---|---|---|
| UI framework | **React 18 + TypeScript (strict)** | Matches existing skill; `strict: true`, `noImplicitAny`, no `any`. |
| Build tool | **Vite 5** | Instant HMR on weak hardware; no SSR overhead. |
| Router | **React Router v6 (data router)** | Nested routes, loaders, role-guarded layouts. |
| Package mgr | npm (lockfile committed) | Zero-cost, ubiquitous. |

**Routing topology (role-gated):**

```
/login                         → AuthLayout        (public)
/track/:trackingCode           → PublicLayout      (public, FR9 customer tracking — extends "Request Delivery")
── AppShell (protected, requires auth) ──────────────────────────────────────
  /dashboard                   → Operations Dashboard        (admin)
  /vehicles                    → Vehicle Asset Console       (admin)
  /vehicles/:vehicleId         → Vehicle detail + service history
  /drivers                     → Driver Management Console   (admin)
  /drivers/:driverId           → Driver detail + delivery history
  /dispatch                    → Dispatch Allocation Screen  (admin)
  /dispatch/new                → New delivery order + allocation
  /maintenance                 → Maintenance Logging Screen  (admin)
  /reports                     → Filterable reports / exports (FR8 output design)
── DriverShell (protected, requires role=driver, MOBILE-FIRST) ───────────────
  /driver                      → Today's assignments          (driver)
  /driver/trips/:deliveryId    → Waybill + one-touch status advance
```

Route guards: `<RequireAuth role="admin|driver">` wrapping layout routes; unauthenticated →
redirect `/login` preserving `from`. Driver hitting an admin route → `/driver`.

### 1.2 UI Libraries

| Library | Purpose | Notes |
|---|---|---|
| **Tailwind CSS v3** | All styling | Configured with `style.md` §2.7 `theme.extend`. Utility-first; no CSS-in-JS. |
| **Lucide React** | Iconography | Stroke 1.75–2px, `size-4`/`size-5`. One icon language only. |
| **shadcn/ui patterns** | Headless component *source* | Copy-in Radix primitives (Dialog, Select, DropdownMenu, Tabs, Toast, Tooltip, Switch, Popover) — restyled to `style.md`. **Not** a dependency; components live in our repo. |
| **Radix UI** | Behaviour primitives under shadcn | Accessibility (focus trap, ARIA) for free. |
| **Framer Motion** | Micro-interactions only | Page/list enter, modal spring, status transitions. Wrapped to honour `prefers-reduced-motion`. |
| **Recharts** | Charts (SVG, lightweight) | Trend line, status donut, maintenance cost bars. Themed via `style.md` §6.6. |
| **React Hook Form + Zod** | Forms & validation | Zod schema = single source of truth for FR1/FR2/FR3/FR6 inputs; typed inference. |
| **TanStack Query v5** | Server-state | Caching, optimistic updates, invalidation after mutations. |
| **clsx + tailwind-merge** | Class composition | Standard shadcn `cn()` helper. |

### 1.3 Global State & Data Flow Strategy

**Principle: server state ≠ client state. Keep them separate; add the smallest tool for each.**

```
┌── Server state (TanStack Query) ─────────────────────────────────────────┐
│  vehicles, drivers, deliveries, maintenance logs, dashboard metrics      │
│  • useVehicles() · useDrivers() · useDeliveries() · useMaintenance()     │
│  • Mutations invalidate the affected query keys → auto-refetch.          │
│  • Optimistic updates for status toggles & dispatch (FR7).               │
└──────────────────────────────────────────────────────────────────────────┘
┌── Auth / session (React Context — AuthProvider) ─────────────────────────┐
│  { user, role, token } · login() · logout() · persist to localStorage.   │
│  Attached to every API call via a typed fetch wrapper (apiClient).       │
└──────────────────────────────────────────────────────────────────────────┘
┌── UI state (Zustand — uiStore, tiny) ────────────────────────────────────┐
│  sidebarCollapsed, activeModal, toastQueue, tableFilters (per screen).   │
│  Local component state (useState) for anything not shared.               │
└──────────────────────────────────────────────────────────────────────────┘
```

- **No Redux.** Server data lives in Query cache; UI flags in Zustand; auth in Context.
- **API layer:** `src/lib/apiClient.ts` — typed wrapper over `fetch` (base URL from `VITE_API_URL`),
  injects `Authorization: Bearer`, normalises errors into a discriminated `ApiResult<T>`.
- **Data hooks:** `src/hooks/use*.ts` wrap Query; components never call `fetch` directly.
- **Domain types:** `src/types/domain.ts` mirrors the 3NF schema exactly
  (`Vehicle`, `Driver`, `Customer`, `Delivery`, `DeliveryItem`, `Product`, `MaintenanceLog`) plus
  status union types (`VehicleStatus`, `DriverStatus`, `DeliveryStatus`) so illegal states are
  unrepresentable at compile time.
- **Optimistic + atomic behaviour (FR7):** dispatch assignment optimistically sets vehicle+driver
  to `On Delivery`; on server error, roll back and surface a toast (matches PRD negative test TC03).

### 1.4 Backend Contract (Flask, per PRD §4.1)

**Status: IMPLEMENTED.** The full contract below is built in `fms/backend/` (Flask +
SQLAlchemy + JWT) and passes **63/63 assertions** in `fms/backend/test_api.py`, which mirrors
the PRD's Table 4.4 test suite. The frontend implements the same contract in
`src/lib/api.ts`; the mock (`src/lib/mockDb.ts`) enforces identical rules, so switching
between them changes nothing above the data layer.

**Running it:**
```
cd fms/backend
.venv/Scripts/python app.py          # Windows   → http://127.0.0.1:5000
.venv/bin/python app.py              # macOS/Linux
.venv/Scripts/python test_api.py     # 63-assertion suite (in-memory DB, no server needed)
```
Then set `VITE_USE_MOCK=false` in `fms/.env.local`. The Vite dev proxy already forwards
`/api` to port 5000. Demo accounts are identical in both modes:
`admin@fms.local / admin123` and `driver@fms.local / driver123`.

**Stack (PRD Table 4.1):** Python 3 + Flask + SQLAlchemy + PostgreSQL, JWT auth, PBKDF2
password hashing. Dev runs SQLite (`backend/fms.db`) with zero setup; set `DATABASE_URL`
to a PostgreSQL DSN for deployment. `backend/seed.py` loads the Case Organisation A
baseline idempotently on first start.

**Layout:** `app.py` (factory) · `config.py` · `extensions.py` · `models.py` (3NF schema)
· `services.py` (allocation + state machine) · `errors.py` (error contract) ·
`serializers.py` (camelCase JSON) · `seed.py` · `routes/` (9 blueprints) · `test_api.py`


```
POST   /api/auth/login                    { email, password }        → { token, user }

GET    /api/vehicles                      ?search&status&type
POST   /api/vehicles                      FR1 / TC01  (409 on duplicate registration)
GET    /api/vehicles/:id
PATCH  /api/vehicles/:id                  { status }                 FR7

GET    /api/drivers                       ?search&status&expiringOnly
POST   /api/drivers                       FR2         (409 on duplicate licence)
GET    /api/drivers/:id
PATCH  /api/drivers/:id                   { status }                 FR7

GET    /api/deliveries                    ?search&status&driverId&vehicleId&limit
POST   /api/deliveries                    FR3 (order + DELIVERY_ITEM rows)
GET    /api/deliveries/:id
POST   /api/deliveries/:id/assign         { driverId, vehicleId }    FR4/FR7 — ATOMIC
PATCH  /api/deliveries/:id/status         { status }                 FR5 — state machine

GET    /api/maintenance                   ?search&vehicleId
POST   /api/maintenance                   FR6 / TC05

GET    /api/customers                     reference data
GET    /api/products                      reference data
GET    /api/dashboard/metrics             ?range=7d|30d|90d          FR8 aggregate
GET    /api/reports                       ?from&to&vehicleId&driverId&status&search → { rows, summary }
GET    /api/track/:trackingCode           public, NO auth            FR9 — narrowed projection
GET    /api/track/examples                demo codes (may return [])
```

**Error contract** (the UI branches on `error`):

| Status | `error` | Meaning |
|---|---|---|
| 401 | `UNAUTHORIZED` | Bad/missing token → redirect to `/login` |
| 403 | `FORBIDDEN` | Role mismatch (NFR2) |
| 404 | `NOT_FOUND` | Unknown id / tracking code |
| 409 | `CONFLICT` | Duplicate registration or licence number |
| 409 | `VEHICLE_UNAVAILABLE` | TC03 — vehicle already committed |
| 409 | `DRIVER_UNAVAILABLE` | TC03 — driver already committed |
| 409 | `INVALID_STATE` | Illegal delivery transition / order not Pending |
| 422 | `VALIDATION_ERROR` | Field-level validation failure |

**Server-side rules that MUST NOT move to the client** (currently verified in `mockDb.ts`):
allocation validates order-is-Pending + driver-Available + vehicle-Available and commits delivery,
driver and vehicle **in one transaction**; completion stamps `DateDelivered` and releases both
resources; unique constraints on `RegistrationNumber` and `LicenseNumber`; the delivery state
machine (Pending → In Progress | Cancelled; In Progress → Delivered | Cancelled; terminal after).

**Public tracking privacy:** `/api/track/:code` must return only status, timestamps, item count
and a generalised area — never driver, vehicle, full address or customer identity.


---

## 2. Page & Layout Breakdown

Every screen below maps 1:1 to **PRD Table 3.6**. Each is broken into Layout Shell → Page Sections → Interactive Elements.

### 2.0 Shared Layout Shells

- **AppShell** (admin): `Sidebar (w-60, collapsible to w-[72px])` + `Topbar (h-16: search, notifications, avatar menu)` + `PageHeader (title + breadcrumbs + primary action)` + scrollable `<main class="p-6 lg:p-8 bg-canvas">`.
- **DriverShell** (driver, mobile-first): sticky compact `Topbar` + bottom `MobileNav` (Today · History · Profile); large touch targets (≥48px).
- **AuthLayout**: centered card on `--grad-brand-wash`; no sidebar.
- **PublicLayout**: minimal top bar + centered tracking card.

---

### 2.1 Login & Authentication — `/login`

- **Layout Shell:** `AuthLayout` (centered card, brand mark, gradient wash).
- **Page Sections:** Brand header → Email field → Password field (masked, show/hide toggle) → Role-aware submit → Inline validation alerts.
- **Interactive Elements:** show/hide password toggle, submit loading state, error banner on 401, "remember me" switch. Zod validates email + min password. On success → route by `role`.
- **Maps to:** PRD Table 3.6 row 1; NFR2 (bcrypt on server).

### 2.2 Operations Dashboard — `/dashboard`

- **Layout Shell:** `AppShell`.
- **Page Sections (top→bottom):**
  1. Greeting + date + `Active Merchant`-style status pill (brand-consistent, per reference #2).
  2. **KPI stat row** — Total vehicles, Available, On Delivery, In Maintenance, Active deliveries (FR8).
  3. **Charts row** — Delivery trend (7/30-day line, Recharts) · Delivery-status donut (Pending/In Progress/Delivered/Cancelled).
  4. **Critical alerts rail** — vehicles with `NextDueDate` approaching/overdue (amber/red), licences expiring (NFR/FR6).
  5. **Recent deliveries table** — last 8, with status pills + "View all".
- **Interactive Elements:** date-range SegmentedControl (7d/30d/90d), chart tooltips, alert row → deep-links to `/maintenance` or `/drivers`, refresh button, skeleton loaders while Query loads.
- **Maps to:** FR8, PRD Figure 3.11 (Output Design).

### 2.3 Vehicle Asset Console — `/vehicles`

- **Layout Shell:** `AppShell`.
- **Page Sections:** PageHeader (+ **Register New Vehicle** primary button) → FilterBar (search reg no, status filter chips, type filter) → Vehicles DataTable (RegNo · Make/Model · Type · Status pill · Odometer · Actions) → pagination.
- **Interactive Elements:** **Register New Vehicle** → `Dialog` form (RegNo, Make, Model, Type=Bike/Trike/Van, Odometer) → inline Zod validation → optimistic insert (PRD TC01). Row **status toggle** (Available / On Delivery / In Maintenance) → PATCH + optimistic update. Row actions: View (→ `/vehicles/:id`), Edit (Dialog), Retire (confirm `AlertDialog`).
- **Vehicle detail `/vehicles/:id`:** asset summary card + **service history table** (maintenance logs) + odometer log + "Log maintenance" CTA.
- **Maps to:** FR1, Table 3.6 row 3; input form Figure 3.9.

### 2.4 Driver Management Console — `/drivers`

- **Layout Shell:** `AppShell`.
- **Page Sections:** PageHeader (+ **Enroll Driver** button) → FilterBar (search, status filter, **"Licence expiring"** toggle) → Drivers DataTable (Name · Phone · Licence No · **Licence expiry badge** · Status pill · Actions).
- **Interactive Elements:** Enroll Driver → Dialog form (FullName, Phone, LicenseNumber, LicenseExpiryDate date-picker, Status) → FR2. **Licence expiry badge** computes state client-side: `expired` (red) / `≤30 days` (amber) / valid (green). Row status toggle (Available / On Delivery / Off Duty) → FR7. Click-to-call phone link (`tel:`).
- **Driver detail `/drivers/:id`:** profile card, licence compliance panel, assigned-delivery history table.
- **Maps to:** FR2, Table 3.6 row 4.

### 2.5 Dispatch Allocation Screen — `/dispatch`

- **Layout Shell:** `AppShell`.
- **Page Sections:**
  1. **Pending orders queue** (left, list of unassigned deliveries with pickup/dropoff + cargo).
  2. **Allocation panel** (right): selected order summary → **Available vehicle dropdown** + **Available driver dropdown** (only `status === 'Available'`) → assignment preview → **Confirm Dispatch** button.
  3. **Active dispatches table** below (order, driver, vehicle, stage pill, ETA/last update).
- **Interactive Elements:** order selection (highlight row), availability-aware Selects (unavailable resources excluded/disabled), **Confirm Dispatch** → POST `/assign`; on **409** show conflict banner ("Vehicle is currently committed to an active dispatch." — PRD TC03); optimistic status flip to `In Progress` (PRD TC02). "New order" → `/dispatch/new` (customer + addresses + line items via DELIVERY_ITEM rows).
- **Maps to:** FR3, FR4, FR7; Table 3.6 row 5; Figure 3.10; decision table Table 3.5.

### 2.6 Driver Execution Screen (Mobile) — `/driver`

- **Layout Shell:** `DriverShell` (mobile-first, big buttons, data-efficient — NFR7).
- **Page Sections:** Today's assignment cards (waybill: recipient, address, cargo, status) → trip detail view.
- **Interactive Elements:** **Start Trip** and **Confirm Delivery** one-touch buttons (FR5); **click-to-call** recipient (`tel:`); status advance constrained by the delivery state machine (Pending → In Progress → Delivered; Cancel allowed only pre-completion). Confirmation sheet before completing (PRD TC04). Offline-tolerant: queue action in `localStorage`, retry on reconnect (baseline stub for the PWA enhancement in PRD §5.3).
- **Maps to:** FR5, Table 3.6 row 6; state machine Figure 3.13.

### 2.7 Maintenance Logging Screen — `/maintenance`

- **Layout Shell:** `AppShell`.
- **Page Sections:** PageHeader (+ **Log Maintenance** button) → FilterBar (vehicle, date range, cost) → Maintenance DataTable (Vehicle · ServiceDate · Description · Cost · NextDueDate · Actions) → **maintenance expenditure summary** (total + per-vehicle chart).
- **Interactive Elements:** Log Maintenance → Dialog form (Vehicle selector, ServiceDate picker, Description textarea, Cost numeric, NextDueDate picker) → FR6, PRD TC05. **Service-due alerts** derived from `NextDueDate` vs today (matches Figure 3.14 flowchart). Edit/delete log (admin only, NFR2).
- **Maps to:** FR6, Table 3.6 row 7.

### 2.8 Reports — `/reports` (supports FR8 output design)

- **Page Sections:** filter bar (date range, vehicle, driver, status) → summary metrics → **Deliveries report table** → **CSV export** button.
- **Interactive Elements:** date-range picker, multi-filter, export (client-side CSV baseline; server export later).

### 2.9 Public Tracking — `/track/:trackingCode` (FR9 extend)

- **Layout Shell:** `PublicLayout`.
- **Page Sections:** tracking lookup input → delivery status timeline (Pending → In Progress → Delivered) + recipient-safe details (no internal data).
- **Maps to:** FR9, use-case `<<extend>>` "Track Delivery".

---

## 3. Component Hierarchy Tree

```
src/
├── components/
│   ├── ui/                      # Atomic, style.md-governed, zero domain knowledge
│   │   ├── Button.tsx           # variants: primary | secondary | ghost | destructive; sizes sm|md|lg
│   │   ├── IconButton.tsx       # size-9 rounded-xl grid place-items-center
│   │   ├── Input.tsx            # h-10 rounded-xl + focus ring (style.md §6.3)
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx           # Radix Select, restyled
│   │   ├── SearchInput.tsx      # leading Lucide icon, pl-10
│   │   ├── Checkbox.tsx / Switch.tsx
│   │   ├── DatePicker.tsx       # Radix Popover + calendar
│   │   ├── Card.tsx             # rounded-2xl border-hairline shadow-card
│   │   ├── StatCard.tsx         # label + big tabular-nums value + delta
│   │   ├── Badge.tsx            # tint pill (semantic variants)
│   │   ├── StatusPill.tsx       # maps domain status → Badge variant + optional dot
│   │   ├── Avatar.tsx
│   │   ├── Table.tsx            # Table, THead, TR, TH, TD, TableEmpty, TableSkeleton
│   │   ├── Tabs.tsx / SegmentedControl.tsx
│   │   ├── Dialog.tsx           # Radix Dialog + Framer Motion spring
│   │   ├── AlertDialog.tsx      # destructive confirm
│   │   ├── Drawer.tsx           # mobile side sheet
│   │   ├── DropdownMenu.tsx
│   │   ├── Popover.tsx / Tooltip.tsx
│   │   ├── Toast.tsx            # + useToast()
│   │   ├── Banner.tsx           # inline info/warning/error (dispatch conflict, PRD TC03)
│   │   ├── Skeleton.tsx / Spinner.tsx
│   │   ├── EmptyState.tsx       # size-12 circle icon + copy
│   │   ├── Pagination.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Field.tsx            # Label + control + helper + error wrapper
│   │
│   ├── modules/                 # Domain-aware, composed from ui/
│   │   ├── dashboard/
│   │   │   ├── KpiStatRow.tsx
│   │   │   ├── DeliveryTrendChart.tsx        (Recharts line/area)
│   │   │   ├── DeliveryStatusDonut.tsx       (Recharts pie, donut)
│   │   │   ├── MaintenanceCostChart.tsx      (Recharts bars)
│   │   │   └── CriticalAlertsRail.tsx        (service-due + licence-expiry)
│   │   ├── vehicles/
│   │   │   ├── VehicleTable.tsx
│   │   │   ├── VehicleFormDialog.tsx         (FR1, Figure 3.9)
│   │   │   ├── VehicleStatusToggle.tsx       (FR7)
│   │   │   └── VehicleServiceHistory.tsx
│   │   ├── drivers/
│   │   │   ├── DriverRosterTable.tsx
│   │   │   ├── DriverFormDialog.tsx          (FR2)
│   │   │   ├── LicenceExpiryBadge.tsx        (expired / ≤30d / valid)
│   │   │   └── DriverStatusToggle.tsx
│   │   ├── dispatch/
│   │   │   ├── PendingOrderQueue.tsx
│   │   │   ├── AllocationPanel.tsx           (FR4)
│   │   │   ├── ResourceSelector.tsx          (availability-aware Select)
│   │   │   ├── DeliveryFormDialog.tsx        (FR3, Figure 3.10)
│   │   │   ├── DeliveryLifecycleStepper.tsx  (Pending→In Progress→Delivered)
│   │   │   └── ActiveDispatchTable.tsx
│   │   ├── driver-app/
│   │   │   ├── AssignmentCard.tsx
│   │   │   ├── WaybillDetail.tsx
│   │   │   ├── StatusAdvanceButtons.tsx      (Start Trip / Confirm Delivery)
│   │   │   └── ClickToCallButton.tsx
│   │   ├── maintenance/
│   │   │   ├── MaintenanceLogTable.tsx
│   │   │   ├── MaintenanceFormDialog.tsx     (FR6, TC05)
│   │   │   └── ServiceDueAlert.tsx           (Figure 3.14 logic)
│   │   ├── reports/
│   │   │   ├── ReportFilterBar.tsx
│   │   │   └── DeliveriesReportTable.tsx
│   │   └── shared/
│   │       ├── FilterBar.tsx
│   │       ├── NotificationBell.tsx          (FR9 events)
│   │       ├── ExportButton.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   └── layouts/
│       ├── AppShell.tsx
│       ├── Sidebar.tsx              (nav config, active indicator §6.5)
│       ├── Topbar.tsx               (search, bell, avatar menu)
│       ├── MobileNav.tsx            (driver bottom nav)
│       ├── AuthLayout.tsx
│       ├── PublicLayout.tsx
│       ├── PageHeader.tsx
│       └── Breadcrumbs.tsx
│
├── hooks/          useVehicles · useDrivers · useDeliveries · useMaintenance
│                   useDashboardMetrics · useAuth · useMediaQuery · useDebounce
├── lib/            apiClient.ts · queryKeys.ts · cn.ts · formatters.ts (currency ₦, dates)
│                   csv.ts · validators/*.ts (Zod schemas per FR)
├── context/        AuthContext.tsx · ToastContext.tsx
├── store/          uiStore.ts (Zustand)
├── types/          domain.ts (Vehicle, Driver, Customer, Delivery, DeliveryItem, Product, MaintenanceLog + status unions)
├── pages/          Login · Dashboard · Vehicles · VehicleDetail · Drivers · DriverDetail
│                   · Dispatch · NewDelivery · Maintenance · Reports · DriverHome · DriverTrip · PublicTrack
├── routes/         router.tsx · RequireAuth.tsx
└── data/seed/      vehicles.json · drivers.json · deliveries.json · maintenance.json  ← swap for real interview data
```

---

## 4. Design System Mapping (`style.md` → PRD features)

### 4.1 Colour → Feature Map

| `style.md` token | Hex | Applied to (PRD) |
|---|---|---|
| `brand-600` (Primary) | `#16A34A` | Primary CTAs: **Register Vehicle**, **Confirm Dispatch**, **Log Maintenance**, **Confirm Delivery**; active nav item. |
| `brand-100/700` (Success tint) | `#DCFCE7` / `#15803D` | Status pill **Delivered**; vehicle/driver **Available**; **valid** licence badge. |
| `amber-500/100` (Warning) | `#F59E0B` / `#FEF3C7` | Status **Pending**; licence **expiring ≤30d**; **service due soon**; maintenance alert rail. |
| `blue-500/100` (Info) | `#3B82F6` / `#DBEAFE` | Status **In Progress** / **On Delivery**; "In Transit" pills. |
| `red-500/100` (Error) | `#EF4444` / `#FEE2E2` | Status **Cancelled**, **In Maintenance**; licence **expired**; dispatch **conflict banner** (TC03); overdue service. |
| `gray-500/100` (Neutral) | `#6B7280` / `#F3F4F6` | Status **Off Duty**, **Retired**; disabled controls. |
| `--grad-warm` | orange 135° | Dashboard highlight stat card (e.g. Total Revenue/Collections). |
| `--grad-area-green` | green fade | Delivery-trend area fill. |

**Status → variant contract (single source of truth in `StatusPill.tsx`):**

```ts
const DELIVERY: Record<DeliveryStatus, Variant> = {
  pending:    'warning',   // amber
  in_progress:'info',      // blue
  delivered:  'success',   // green
  cancelled:  'neutral',   // gray
};
const VEHICLE: Record<VehicleStatus, Variant> = {
  available:'success', on_delivery:'info', in_maintenance:'error', retired:'neutral',
};
const DRIVER: Record<DriverStatus, Variant> = {
  available:'success', on_delivery:'info', off_duty:'neutral',
};
```

### 4.2 Radius / Shadow / Border → Component Map

| Element | `style.md` rule |
|---|---|
| Dashboard stat cards, tables, panels | `rounded-2xl` (16px) + `border-[#EDEEF2]` + `shadow-sm` |
| Modals / drawers (vehicle, driver, maintenance forms) | `rounded-panel` (20px) + `shadow-pop` |
| Buttons, inputs, selects, tabs | `rounded-control` (12px) |
| Status pills, badges, avatars, toggles | `rounded-full` |
| Inner wells (form sections inside dialogs) | `rounded-xl bg-slate-50` |
| Table rows | `divide-y divide-[#F1F2F4]`, hover `bg-gray-50/70` |

### 4.3 Responsive Breakpoints → Data-Dense Views

| Breakpoint | Vehicles / Drivers / Maintenance tables | Dashboard grid | Dispatch screen | Driver app |
|---|---|---|---|---|
| **Mobile `<md`** | **Stack to cards** (label:value pairs). Never horizontal-scroll. | 1-col; KPIs 2-up; charts stacked | queue ↔ panel via **Tabs** (Orders / Allocate) | native target — large buttons |
| **Tablet `md–lg`** | Table with reduced columns (hide odometer/notes), actions in `DropdownMenu` | 2-col; KPIs 2–3-up | 2-col (queue + panel) | responsive web fallback |
| **Desktop `lg+`** | Full DataTable, all columns, inline row actions | 12-col: KPIs 4–5-up, 2/3 chart + 1/3 rail | 2-col (1/3 queue · 2/3 panel) | n/a (redirect to `/dashboard`) |

Implementation: Tailwind `hidden md:table-cell` for low-priority columns + a
`<DataTableCardList>` render for `<md`. FilterBar collapses to a **"Filters"** sheet button on mobile.

---

## 5. Step-by-Step Implementation Roadmap

Each phase ends with a **testable checkpoint** and a `progress.md` entry.

### Phase 1 — Layout Shell & Design System Setup
*Deliverable: the app runs, looks like `style.md`, routes work, auth is stubbed.*

1. `npm create vite@latest fms -- --template react-ts`; enable `strict` TS.
2. Install + configure Tailwind; paste `style.md` §2.7 `theme.extend` and §2.6 CSS variables into `index.css`.
3. Build `cn()` helper; add Inter + JetBrains Mono.
4. Implement `ui/` atoms: Button, IconButton, Input, Select, Card, StatCard, Badge, StatusPill, Avatar, Table, Skeleton, EmptyState.
5. Build layouts: `AppShell`, `Sidebar` (with nav config + active indicator), `Topbar`, `MobileNav`, `AuthLayout`, `PublicLayout`, `PageHeader`.
6. Wire `router.tsx` with all routes + `RequireAuth` guard; placeholder pages.
7. `AuthContext` + `apiClient` + mock login (accepts any credentials against seed) → route by role.
8. **Checkpoint:** log in as admin → see empty AppShell; log in as driver → see DriverShell; all nav links resolve; light/dark-neutral palette matches `style.md`.

### Phase 2 — Core Page Views & Atomic UI Components
*Deliverable: read-only data views render from seed/API.*

1. `types/domain.ts` (3NF entities + status unions); `lib/queryKeys.ts`; `data/seed/*`.
2. TanStack Query setup + `useVehicles` / `useDrivers` / `useDeliveries` / `useMaintenance`.
3. **Vehicle Asset Console** — DataTable + FilterBar + mobile card list (FR1 read).
4. **Driver Management Console** — roster table + `LicenceExpiryBadge` (FR2 read).
5. **Operations Dashboard** — `KpiStatRow`, `DeliveryTrendChart`, `DeliveryStatusDonut`, `CriticalAlertsRail`, `RecentDeliveriesTable` (FR8).
6. **Maintenance Logging** — log table + expenditure summary (FR6 read).
7. `StatusPill` mapping table wired end-to-end.
8. **Checkpoint:** all list/dashboard views populated from seed; responsive at 3 breakpoints; no layout shift; `tabular-nums` on all numbers.

### Phase 3 — Complex Interactive Modules, Forms & Modals
*Deliverable: full CRUD + dispatch + driver status flow.*

1. Zod schemas per FR (`vehicleSchema`, `driverSchema`, `deliverySchema`, `maintenanceSchema`).
2. `Field` + `Dialog`/`AlertDialog`/`Drawer` primitives (Radix + Framer Motion).
3. Forms: **VehicleFormDialog** (TC01), **DriverFormDialog** (FR2), **MaintenanceFormDialog** (TC05), **DeliveryFormDialog** (FR3, line items).
4. **Dispatch Allocation** — `PendingOrderQueue`, `AllocationPanel`, `ResourceSelector` (availability-aware), confirm flow, **409 conflict banner** (TC02/TC03), optimistic `FR7` state flip.
5. **Driver Execution** — assignment cards, `StatusAdvanceButtons` constrained by the state machine (Figure 3.13), confirm sheet (TC04).
6. Status toggles (vehicle/driver) with optimistic update + rollback.
7. `Toast` notifications for FR9 events (assignment / completion / conflict).
8. **Checkpoint:** run PRD test cases **TC01–TC05** manually; each produces the expected DB state + UI feedback.

### Phase 4 — Micro-interactions, Hover Effects & Mobile Responsiveness Audit
*Deliverable: polish + accessibility + performance pass.*

1. Apply `style.md` §7 motion: card lift, button press, table row tint, modal spring, status-pill transition, chart draw-in (first mount only).
2. Wrap all motion in `prefers-reduced-motion` guards.
3. Responsive audit at 360 / 768 / 1280 / 1536 px; table→card collapse; FilterBar→sheet; driver app touch targets ≥48px.
4. Accessibility: `:focus-visible` rings, ARIA on dialogs/menus/tables, keyboard nav, colour-contrast check (status never colour-only).
5. Performance: route-level `React.lazy` + Suspense, memoise tables, debounce search, skeleton loaders; verify NFR1 (<3s) and NFR7 (payload).
6. Empty / error / loading states for every screen.
7. **Checkpoint:** Lighthouse pass, keyboard-only walkthrough, mobile audit signed off.

### Phase 5 (stretch) — Reports & Public Tracking
- `/reports` filter bar + CSV export (FR8 output design); `/track/:code` public timeline (FR9 extend).

---

## Appendix — PRD Conformance Audit

**Audited 2026-10-01** against the PRD text (FR/NFR tables, Table 3.6 screen inventory,
Table 3.4 schema, Tables 4.1–4.4). Evidence: `backend/test_api.py` (**131 assertions**),
standalone CSV/mock suites, and live HTTP checks through the Vite proxy.

### Functional requirements

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR1 | Register, **modify**, view, retire vehicles (reg, make, model, category, odometer, status) | ✅ | `POST`/`PATCH /api/vehicles` (full modify incl. registration clash → 409); Vehicles table + dual-mode dialog; retire = `retired` status |
| FR2 | Create, **update**, query drivers (name, phone, licence, expiry, status) | ✅ | `POST`/`PATCH /api/drivers` (full update, licence clash → 409); roster table + dialog |
| FR3 | Order ingestion: **sender identity, recipient details**, pickup, drop-off, line items, timestamp | ✅ | `recipient_name`/`recipient_phone` added to DELIVERY; line items via DELIVERY_ITEM; `createdAt` |
| FR4 | Allocation workflow verifying availability before confirmation | ✅ | `POST /api/deliveries/:id/assign`; TC02/TC03 |
| FR5 | Driver mobile interface, Pending → In Progress → Delivered (or Cancelled) | ✅ | DriverShell (mobile-first); state machine guards illegal transitions |
| FR6 | Maintenance: service date, **odometer reading**, description, cost, next due date | ✅ | `odometer` added to MAINTENANCE_LOG (was missing); captured in the log form |
| FR7 | Auto-transition to On Delivery on assignment; restore to Available on completion | ✅ | `services.py` atomic allocation + release; asserted both ways |
| FR8 | Fleet counts, **asset utilisation rates**, **driver availability breakdowns**, delivery counts by stage, maintenance expenditure | ✅ | `assetUtilizationRate`, `driverAvailability`, `driverRoster` added to `/dashboard/metrics`; KPI row + donut + roster panel |
| FR9 | Notify on assignment / pickup / completion / delay | ✅ | Persistent notification table; events emitted on create/assign/deliver/cancel/service/vehicle-status; bell + `/notifications` + live toasts + public tracking |

### Non-functional requirements

| ID | Requirement | Status | Notes |
|---|---|---|---|
| NFR1 | Status queries < 3.0 s under < 20 concurrent sessions | ✅ | Measured: 20 concurrent sessions × 4 query paths, **0 errors, worst case 2.49 s**. `backend/load_test.py` |
| NFR2 | Admin actions restricted to authenticated admins; bcrypt/pbkdf2 hashes | ✅ | PBKDF2-SHA256 (Werkzeug); `admin_required`; drivers scoped to their own rows |
| NFR3 | High affordance, no manual required | ✅ | Labelled controls, inline validation, empty/error states, skip link |
| NFR4 | ACID, referential integrity, no orphans | ✅ | Transactional allocation with rollback; FK constraints; CHECK-constrained enums; unique keys |
| NFR5 | Scale 7 → 50 vehicles, 5,000 orders without schema change | ✅ | Measured on a 50-vehicle / 5,200-order database built with the **unmodified** schema; slowest path 828 ms. `backend/load_test.py` |
| NFR6 | Responsive on Safari/Chrome/Firefox, no native runtime | ⚠️ **Not device-tested** | Responsive built and code-audited (360/768/1280/1536); not verified on real devices |
| NFR7 | Minimise mobile payload | ✅ | Eager bundle 105 kB gzip (was 286 kB); charts + motion deferred; driver app is data-light |

### Measured performance (NFR1 / NFR5)

On the scaled database (50 vehicles · 5,200 orders · 6,261 line items), single-session:

| Query path | Latency |
|---|---|
| vehicles (status query) | 3.4 ms |
| drivers (status query) | 3.4 ms |
| single delivery | 3.5 ms |
| maintenance | 6.4 ms |
| deliveries by status | 19.4 ms |
| deliveries (500 rows) | 76.8 ms |
| dashboard metrics (30d) | 195.7 ms |
| reports (full window) | 828.0 ms |

Under **20 concurrent sessions** (0 errors): vehicles p50 76 ms / max 126 ms; drivers p50 85 ms /
max 129 ms; deliveries p50 645 ms / max 984 ms; **dashboard metrics p50 1,815 ms / max 2,487 ms**.

**Honest reading:** everything is inside the 3.0 s budget, but the dashboard-metrics endpoint has
the least headroom. It loads the window's deliveries and aggregates in Python — fine at this scale,
but it is the first thing to move to SQL aggregation, and the measurement is against Flask's
development server with SQLite, not a production WSGI server (gunicorn/waitress) with PostgreSQL.


### Table 3.6 — screen inventory

| Screen | Status |
|---|---|
| Login & Authentication | ✅ role-aware, validation alerts |
| Operations Dashboard | ✅ vehicle availability cards, **driver roster status badges**, delivery counts by stage, critical maintenance alerts |
| Vehicle Asset Console | ✅ filterable datatable, register/modify modal, status toggles, odometer |
| Driver Management Console | ✅ roster, licence-expiry badges, enrol/update, status toggles |
| Dispatch Allocation Screen | ✅ customer + recipient + addresses, available vehicle/driver dropdowns, confirmation |
| Driver Execution Screen (mobile) | ✅ waybill details, click-to-call, one-touch completion |
| Maintenance Logging Screen | ✅ vehicle selector, service date, odometer, cost, description, next due |

### Table 4.1 — technology stack

| PRD | Built | Note |
|---|---|---|
| Python 3 + Flask | ✅ | Flask 3.1 |
| SQLAlchemy ORM | ✅ | SQLAlchemy 2.1 / Flask-SQLAlchemy 3.1 |
| PostgreSQL | ⚠️ **SQLite in dev** | Portable schema; set `DATABASE_URL` for PostgreSQL |
| HTML5/CSS3/Bootstrap 5/JS | ⚠️ **Deviation** | React 18 + TypeScript + Tailwind instead (design-system fidelity) |
| Render / Supabase hosting | ❌ **Not done** | No deployment |
| Git & GitHub | ⚠️ **Local repo only** | Initialised on `main` with an initial commit (178 files); not yet pushed to GitHub |

### Table 4.4 — acceptance test cases

TC01–TC05 all ✅, asserted in `backend/test_api.py` and re-verified over live HTTP.

### Known gaps (honest list)

1. **Not deployed** (Render/Supabase) — named in PRD Table 4.1. The repository is initialised
   locally but has not been pushed to a remote.
2. **NFR6 is not device-tested.** Responsive behaviour is built and code-audited, but no physical
   Safari/Android verification has been done.
3. **FR9 customer notification is passive.** The customer is an external entity with no login, so
   they are informed by the public tracking page rather than being pushed to. Proactive SMS/WhatsApp
   is PRD §5.3 recommendation #2, explicitly post-baseline.
4. **"Cargo description" (Table 3.6)** is modelled as structured line items (DELIVERY_ITEM +
   PRODUCT) per the PRD's own ER model, rather than a free-text field.
5. **Single admin role**, as the PRD specifies. Multi-tier admin (Super Admin / Dispatcher / Fleet
   Manager) would diverge from the analysed design and is a documented enhancement.
6. **PRD internal inconsistency resolved:** FR6 requires an odometer reading but Table 3.4's
   MAINTENANCE_LOG relation omits it. The functional requirement was treated as authoritative and
   the column added.
7. **Performance measured on the development server**, not a production WSGI server. See the
   measured-performance table above for the honest headroom picture.


