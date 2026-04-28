# Daily Finance Bot

A personal monthly finance tracking application with dual interfaces:
- **WhatsApp Bot** — Log expenses via chat messages
- **Web Dashboard** — Calendar view, monthly breakdown, budget planning, and settings

---

## Features

### WhatsApp Bot
- Add expenses with simple text format: `category-amount` or `category-amount-day-month-year`
- Commands: `/help`, `/format`, `/today`, `/date`, `/undo`, `/clear`
- Real-time expense logging synced with web dashboard

### Web Dashboard
- **Overview** — Monthly spending stats, budget performance, calendar heatmap
- **Expenses** — Full expense list with filters
- **Settings** — Monthly budget, category budgets, category management, WhatsApp verification
- **Admin Panel** — WhatsApp Bot QR connection, default category management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| WA Library | @whiskeysockets/baileys |
| Web | Next.js 14 (App Router) + Tailwind CSS |
| Auth | NextAuth.js v4 (Credentials + JWT) |
| ORM | Prisma |
| Database | Supabase PostgreSQL |
| Deploy | Railway (bot) + Vercel (web) |

---

## Project Structure

```
DailyFinanceBot/
├── packages/
│   ├── web/        # Next.js frontend + API routes
│   ├── bot/        # Baileys WA bot (Express server)
│   └── db/         # Prisma schema + shared client
├── package.json
└── README.md
```

---

## Prerequisites

- Node.js 18+
- pnpm
- Supabase PostgreSQL database
- WhatsApp number (different from bot number for testing)

---

## Environment Variables

### `packages/web/.env.local`

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_USERNAME="your-admin-username"
BOT_URL="http://localhost:3001"
```

### `packages/bot/.env`

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
PORT=3001
```

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Generate Prisma Client

```bash
pnpm db:generate
```

### 3. Run database migrations

Push schema via Supabase SQL Editor or use Prisma migration locally.

### 4. Start development servers

```bash
# Web dashboard
pnpm dev:web

# WhatsApp bot
pnpm dev:bot
```

---

## WhatsApp Bot Usage

### Input Formats

| Format | Example | Description |
|---|---|---|
| `category-amount` | `food-14000` | Save expense for today |
| `category-amount-day-month-year` | `food-14000-27-April-2026` | Save for specific date |

### Commands

| Command | Description |
|---|---|
| `/help` | Show all available commands |
| `/format` | Show input format guide |
| `/today` | Show today's expenses |
| `/date DD-Month-YYYY` | Show expenses for a date |
| `/undo` | Remove last recorded expense |
| `/clear` | Clear all expenses |

---

## Deployment

### Web (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Build command: `cd ../.. && pnpm --filter @finance/db build && pnpm --filter web build`

### Bot (Railway)

1. Connect GitHub repo to Railway
2. Set environment variables
3. Build command: `pnpm --filter db build && pnpm --filter bot build`
4. Start command: `node packages/bot/dist/index.js`

---

## License

MIT
