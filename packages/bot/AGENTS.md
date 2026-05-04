# Bot — Agent Reference

> WhatsApp Bot built with @whiskeysockets/baileys and Express.
> All code comments, variable names, and bot replies MUST be in **English**.

---

## Stack Detail

| Tech | Version | Purpose |
|---|---|---|
| Baileys | 6.7 | WhatsApp WebSocket client (no Puppeteer) |
| Express | 4.19 | HTTP server for status QR & send-code endpoints |
| Pino | 9.3 | Logger (set to silent in production) |
| qrcode | 1.5 | Generate QR string for terminal display |
| ts-node | 10.9 | Dev runtime with TypeScript |
| tsconfig-paths | 4.2 | Resolve `@finance/db` workspace import |

---

## Folder Structure

```
packages/bot/
├── src/
│   ├── index.ts      → Express server setup + routes (/status, /send-code)
│   ├── bot.ts        → Baileys socket lifecycle, connection events, message listener
│   ├── handler.ts    → Main message handler: identify user → parse → execute
│   ├── parser.ts     → Parse text into commands or expense data
│   └── verify.ts     → Send verification code via WA message
├── auth_info/        → Baileys multi-file auth state (DO NOT commit)
├── lid-mapping.json  → Persistent LID → phone mapping (DO NOT commit)
└── dist/             → Compiled JS output
```

---

## Connection Lifecycle

1. `startBot()` loads `lid-mapping.json` from disk.
2. Baileys creates socket with `useMultiFileAuthState('auth_info')`.
3. On `connection.update`:
   - `qr` emitted → store QR string, expose via `/status`.
   - `open` → connected flag true, QR cleared.
   - `close` → reconnect unless logged out; on logout delete `auth_info` and restart.
4. On `contacts.upsert` → map `lid` → `id`, persist to `lid-mapping.json`.
5. On `messages.upsert` (type `notify`) → pass to `handleMessage()`.

---

## Message Flow

```
Incoming message
  └── fromMe? → YES → drop (prevent loop)
  └── group? (@g.us) → YES → drop
  └── @lid? → resolve via lidToPhone map
      └── map missing? → drop silently
  └── normalizePhone(rawPhone)
      └── strip non-digits → strip leading zeros → ensure 62 prefix
  └── find user by phoneNumber
      └── not found? → drop silently (no reply to random numbers)
      └── not verified? → reply "complete verification on web"
  └── parseInput(text)
      └── pending VerificationCode? → send code (unless /format command)
  └── execute command
```

---

## Parser Rules (`parser.ts`)

### Commands
| Input | Action |
|---|---|
| `/format` | Reply format guide |
| `/help` | Reply command list |
| `/today` | List today's expenses |
| `/week` | List this week's expenses grouped by category |
| `/month` | List this month's expenses grouped by category |
| `/summary` | Snapshot: today + week + month totals |
| `/date DD-Month-YYYY` | List expenses for specific date |
| `/categories` | List available categories for current month |
| `/budget` | Show starting balance, allocations, expenses, remaining |
| `/last` | View last recorded expense |
| `/undo` | Delete last expense |
| `/clear` | Delete all expenses |

### Expense Formats
| Format | Example | Result |
|---|---|---|
| `category-amount` | `food-14000` | Save expense for today |
| `category-amount-day-month-year` | `food-14000-27-April-2026` | Save for specific date |

- Months: English `January–December` or Indonesian `Januari–Desember` (case-insensitive).
- Amount must be positive integer.
- Date must be valid.

### Unknown input
→ `type: "unknown"` → handler drops silently (no reply).

---

## Phone Normalization (`handler.ts`)

```ts
function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");     // strip non-digits
  digits = digits.replace(/^0+/, "");         // strip leading zeros
  if (digits.startsWith("8") && !digits.startsWith("62")) digits = "62" + digits;
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits;
}
```

Result always starts with `62` (Indonesia format).

---

## Silent Ignore Policy

The bot does **not** reply in these cases:
1. **Unregistered phone number** — user not found in DB.
2. **Missing LID mapping** — cannot resolve privacy-mode JID.
3. **Invalid / unknown message format** — not a command and not a valid expense.

This prevents random people from interacting with the bot and keeps logs clean.

---

## Express Endpoints

| Route | Method | Body / Response |
|---|---|---|
| `/status` | GET | `{ status: "connected" }` or `{ status: "qr", qr: "..." }` or `{ status: "loading" }` |
| `/send-code` | POST | `{ phoneNumber: "6285...", code: "123456" }` → sends WA message with code |

---

## Dev Commands

```bash
pnpm dev          # ts-node with tsconfig-paths (port 3001)
pnpm build        # tsc compile to dist/
pnpm start        # node dist/index.js
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase Session Pooler |
| `DIRECT_URL` | Yes | Supabase direct connection |
| `AUTH_INFO_PATH` | No | Absolute path for Baileys auth state directory (default: `process.cwd()/auth_info`). Set to `/app/auth_info` when using Railway Volume.

---

## Important Notes

- **Do NOT run `fromMe` messages through the handler** — this prevents infinite self-reply loops.
- **Do NOT commit `auth_info/` or `lid-mapping.json`** — these contain WA session keys.
- **LID mapping is persisted** to `lid-mapping.json` and reloaded on restart so privacy-mode contacts remain resolvable.
- **Railway Volume**: On Railway deployments, create a Volume mounted at `/app/auth_info` and set `AUTH_INFO_PATH=/app/auth_info`. This prevents the bot from logging out on every redeploy.
- **Testing**: The bot cannot be tested using the same phone number as the bot itself. Use a separate WA number.
