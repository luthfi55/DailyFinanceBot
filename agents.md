# DailyFinanceBot — Monorepo Index

> Personal daily-expense tracker with dual interface: WhatsApp Bot (Baileys) and Web Dashboard (Next.js).
> All documentation, code comments, variable names, UI text, and bot WA replies MUST be in **English**.

---

## Stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces |
| WA Library | @whiskeysockets/baileys |
| Web | Next.js 14 (App Router) + Tailwind CSS |
| Auth | NextAuth.js v4 — credentials provider (username + password), JWT strategy |
| ORM | Prisma |
| Database | Supabase PostgreSQL (Session Pooler, port 5432) |
| Deploy | Railway (2 services: web + bot) |

---

## Folder Structure

```
DailyFinanceBot/
├── packages/
│   ├── web/        → Next.js frontend + API routes (see packages/web/AGENTS.md)
│   ├── bot/        → Baileys WA bot + Express server (see packages/bot/AGENTS.md)
│   └── db/         → Prisma schema + shared client (see packages/db/AGENTS.md)
├── package.json    → pnpm workspaces root
├── pnpm-workspace.yaml
├── Dockerfile
├── .gitattributes  → LF consistency
└── AGENTS.md       ← this file
```

---

## Quick Start (Dev)

```bash
# Install dependencies
pnpm install

# Generate Prisma client (stop web dev server first)
pnpm --filter @finance/db generate

# Run web (port 3000)
pnpm --filter web dev

# Run bot (port 3001)
pnpm --filter bot dev
```

---

## Environment Variables Checklist

| Variable | Package | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | `db`, `web`, `bot` | Yes | Supabase Session Pooler connection string |
| `DIRECT_URL` | `db`, `web`, `bot` | Yes | Supabase direct connection string |
| `NEXTAUTH_SECRET` | `web` | Yes | NextAuth JWT secret |
| `NEXTAUTH_URL` | `web` | Yes | Public URL of the web app |
| `ADMIN_USERNAME` | `web` | Yes | Username that auto-gets ADMIN role on register |
| `BOT_URL` | `web` | Yes | Base URL of bot Express server (e.g. `http://localhost:3001`) |
| `AUTH_INFO_PATH` | `bot` | No | Baileys auth state directory (set `/app/auth_info` for Railway Volume) |

---

## Cross-Package References

- **Web ↔ Bot integration**: Web calls `POST {BOT_URL}/send-code` to send WA verification codes. Web polls `GET {BOT_URL}/status` for QR code display.
- **Shared DB package**: Both `web` and `bot` import `@finance/db` workspace package.

---

## Common Gotchas

1. **Prisma client generation** must happen with the web dev server **stopped** (lock file conflict).
2. **Supabase Session Pooler** is used because free-tier direct IPv4 is blocked. Always use port `5432`.
3. **Bot `fromMe` filter** is active: the bot ignores messages sent by its own WhatsApp number to prevent loops.
4. **Silent ignore policy**: unregistered numbers and invalid-format messages receive **no reply**.
5. **Language rule**: All code, UI, and bot replies MUST be in English.

---