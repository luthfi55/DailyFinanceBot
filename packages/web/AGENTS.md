# Web — Agent Reference

> Next.js 14 App Router + Tailwind CSS frontend & API layer.
> All UI text, code comments, and variable names MUST be in **English**.

---

## Stack Detail

| Tech | Version | Purpose |
|---|---|---|
| Next.js | 14.2 | App Router, SSR/SSG, API routes |
| React | 18.3 | UI library |
| Tailwind CSS | 3.4 | Utility-first styling |
| NextAuth.js | 4.24 | Authentication (credentials + JWT) |
| Prisma Client | 5.14 | Database access (via `@finance/db`) |
| date-fns | 3.6 | Date formatting & manipulation |
| clsx + tailwind-merge | latest | Conditional class merging |
| qrcode.react | 3.1 | QR code display for admin panel |

---

## Pages & Routes

### App Router Pages

| Path | Description |
|---|---|
| `/` | Redirect to `/dashboard` or `/login` |
| `/login` | Sign-in form (Stitch MD3 themed) |
| `/register` | Account creation form (Stitch MD3 themed) |
| `/dashboard` | Stat cards, Budget summary, monthly calendar, monthly breakdown, Add Expense inline form |
| `/dashboard/expenses` | (Pending) Full expense list + filter page |
| `/settings` | Monthly Budget, Category Budgets, user categories, WA phone verification |
| `/admin` | QR Code panel for bot WA + DefaultCategory CRUD (ADMIN only) |

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth credentials handler |
| `/api/auth/register` | POST | Register new user + copy default categories |
| `/api/expenses` | GET, POST | List & create expense |
| `/api/expenses/[id]` | DELETE | (Pending) Delete expense |
| `/api/categories` | GET, POST | List & create user category |
| `/api/categories/[id]` | PUT, DELETE | Edit & delete category |
| `/api/verify/send` | POST | Store verification code in DB, then call bot `/send-code` |
| `/api/verify/confirm` | POST | Confirm verification code, set `isVerified=true` |
| `/api/bot/status` | GET | Proxy to bot Express: status + QR string |
| `/api/admin/default-categories` | GET, POST | List & create default category (ADMIN) |
| `/api/admin/default-categories/[id]` | PUT, DELETE | Edit & delete default category (ADMIN) |
| `/api/budget` | GET, POST | Get/upsert MonthlyBudget (starting balance) |
| `/api/budget/allocations` | POST | Add BudgetAllocation |
| `/api/budget/allocations/[id]` | PUT, DELETE | Edit & delete BudgetAllocation |
| `/api/budget/categories` | GET, POST | Get/upsert CategoryBudget per category per month |

---

## Authentication & Authorization

- **Provider**: NextAuth.js v4 Credentials (username + password)
- **Strategy**: JWT (session stored in cookie)
- **Middleware** (`src/middleware.ts`):
  - Protects `/dashboard/*`, `/settings/*`, `/admin/*`
  - Redirects unauthenticated users to `/login`
  - Redirects non-ADMIN from `/admin/*` to `/dashboard`
- **Admin auto-assignment**: On registration, if `username === ADMIN_USERNAME` env var → `role = ADMIN`

---

## Design System (Stitch MD3)

Custom Tailwind colors defined in `tailwind.config.ts`:

```
background: #f8f9ff
surface: #f8f9ff
surface-container-lowest: #ffffff
surface-container-low: #eff4ff
surface-container-high: #dce9ff
primary: #091426
on-primary: #ffffff
on-primary-fixed-variant: #3c475a
on-surface: #0b1c30
on-surface-variant: #45474c
outline: #75777d
outline-variant: #c5c6cd
on-tertiary-container: #4c8dff
error: #ba1a1a
```

- **Shadow token**: `shadow-login-card` used for auth cards.
- **Font**: Inter (Google Fonts) via `fontFamily: { sans: ['Inter', 'sans-serif'] }`

---

## Component Inventory

| Component | Location | Description |
|---|---|---|
| `Sidebar` | `src/components/` | Navigation: Overview, Expenses, Settings, Admin (ADMIN only), Sign out |
| `AddExpenseForm` | `src/components/` | Inline form: category, amount, date, note |
| `MonthlyCalendar` | `src/components/` | Monthly grid with daily expense totals (color intensity) |
| `MonthlyBreakdown` | `src/components/` | Category breakdown with progress bars, % of budget, over-budget alerts, transaction list |
| `BudgetSummary` | `src/components/` | Dashboard: starting balance → allocations → expenses → remaining |
| `BudgetForm` | `src/components/` | Settings: set starting balance + CRUD fixed allocations |
| `CategoryBudgetForm` | `src/components/` | Settings: set budget limit per category per month |
| `CategoryManager` | `src/components/` | Settings: CRUD user categories |
| `PhoneVerification` | `src/components/` | WA number input, verification flow, Change/Cancel buttons |
| `QRCodePanel` | `src/components/` | Poll bot status, display QR or connected status |
| `DefaultCategoryManager` | `src/components/` | Admin: CRUD DefaultCategory |

---

## Dev Commands

```bash
pnpm dev          # Start Next.js dev server (port 3000)
pnpm build        # Production build (also runs prisma generate)
pnpm lint         # Run ESLint
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `NEXTAUTH_URL` | Yes | Public URL (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | Yes | Supabase Session Pooler |
| `DIRECT_URL` | Yes | Supabase direct connection |
| `ADMIN_USERNAME` | Yes | Auto-admin username |
| `BOT_URL` | Yes | Bot Express base URL (e.g. `http://localhost:3001`) |

---

## Bot Integration

- **QR Code**: Admin page polls `/api/bot/status` → proxies to `GET {BOT_URL}/status`
- **Send verification code**: `POST /api/verify/send` stores code in DB, then calls `POST {BOT_URL}/send-code` with `{ phoneNumber, code }`

---

## Build Notes

- `next.config.js`: `transpilePackages: ["@finance/db"]` for workspace package resolution.
- `outputFileTracingRoot` points to monorepo root for proper Prisma binary resolution during builds.
- Prisma client generation happens **before** `next build` (see `build` script in `package.json`).
