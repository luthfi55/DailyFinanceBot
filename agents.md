# Finance Bot — Agent Reference

## Project Overview
Aplikasi keuangan bulanan personal dengan 2 interface:
1. **WhatsApp Bot** — input pengeluaran via chat (Baileys)
2. **Web Dashboard** — kalender, breakdown bulanan, budget bulanan, input manual, settings

---

## Stack

| Layer | Pilihan |
|---|---|
| Monorepo | pnpm workspaces |
| WA Library | @whiskeysockets/baileys |
| Web | Next.js 14 (App Router) + Tailwind CSS |
| Auth | NextAuth.js v4 — credentials provider (username + password), JWT strategy |
| ORM | Prisma |
| Database | Supabase PostgreSQL (Session Pooler, port 5432) |
| Deploy | Railway (2 services: web + bot) |

---

## Struktur Monorepo

```
DailyFinanceBot/
├── packages/
│   ├── web/        → Next.js (pages, API routes, NextAuth, komponen UI)
│   ├── bot/        → Baileys WA bot (handler, parser, verify)
│   └── db/         → Prisma schema + shared client (@finance/db)
├── package.json    → pnpm workspaces root
└── agents.md
```

---

## Prisma Schema (aktual)

```
User             — id, username, email, password, phoneNumber, isVerified, role (ADMIN|USER), createdAt
Category         — id, userId, name, color, icon, isDefault; @@unique([userId, name])
Expense          — id, userId, categoryId, amount (Int), date, note, createdAt
VerificationCode — id, userId, code, expiresAt, used, createdAt
DefaultCategory  — id, name (unique), color, icon, order  ← dikelola admin
MonthlyBudget    — id, userId, year, month, startingBalance (Int); @@unique([userId, year, month])
BudgetAllocation — id, budgetId, label, amount (Int), order
CategoryBudget   — id, userId, categoryId, year, month, amount (Int); @@unique([userId, categoryId, year, month])
```

---

## Arsitektur

- **Admin** — username `luthfi`, role `ADMIN`, auto-assigned saat register jika username cocok (`ADMIN_USERNAME` env)
- **DefaultCategory** — admin set kategori default; saat user baru register, kategori default di-copy ke `Category` milik user
- **Role-based routing** — middleware protects `/dashboard/*`, `/settings/*`, `/admin/*`; non-admin diblok dari `/admin`
- **Session Pooler** — koneksi Supabase via `aws-1-ap-northeast-1.pooler.supabase.com:5432` (IPv4-compatible, free tier)
- **Bot server** — Express di port 3001; web poll `/api/bot/status` untuk QR code dan status koneksi
- **Verifikasi WA** — web simpan kode ke DB lalu call `POST http://localhost:3001/send-code`; bot kirim langsung ke WA user
- **MonthlyBudget** — saldo awal + alokasi tetap (tabungan, kos, dll) → sisa = saldo − alokasi − pengeluaran
- **CategoryBudget** — limit budget per kategori per bulan; di-track di MonthlyBreakdown (progress bar, over budget alert)
- **BOT_URL** — env var di web (`packages/web/.env.local`) untuk address bot Express server

---

## Halaman & API Routes (web)

### Pages
| Path | Deskripsi |
|---|---|
| `/` | Redirect ke `/dashboard` atau `/login` |
| `/login` | Form login (username + password) |
| `/register` | Form register (username, email, password) |
| `/dashboard` | Stat cards, Budget summary, kalender bulanan, breakdown bulanan, Add Expense |
| `/settings` | Monthly Budget + Category Budgets + kategori user + verifikasi/ganti nomor WA |
| `/admin` | QR Code panel bot WA + manajemen DefaultCategory |

### API Routes
| Route | Method | Deskripsi |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/auth/register` | POST | Register user baru, copy default categories |
| `/api/expenses` | GET, POST | List & tambah expense |
| `/api/categories` | GET, POST | List & tambah kategori user |
| `/api/categories/[id]` | PUT, DELETE | Edit & hapus kategori |
| `/api/verify/send` | POST | Simpan kode ke DB + call bot `/send-code` untuk kirim ke WA |
| `/api/verify/confirm` | POST | Konfirmasi kode verifikasi |
| `/api/bot/status` | GET | Proxy ke bot Express: status + QR code |
| `/api/admin/default-categories` | GET, POST | List & tambah DefaultCategory |
| `/api/admin/default-categories/[id]` | PUT, DELETE | Edit & hapus DefaultCategory |
| `/api/budget` | GET, POST | Get/upsert MonthlyBudget (saldo awal) |
| `/api/budget/allocations` | POST | Tambah BudgetAllocation |
| `/api/budget/allocations/[id]` | PUT, DELETE | Edit & hapus BudgetAllocation |
| `/api/budget/categories` | GET, POST | Get/upsert CategoryBudget per kategori |

### Bot Express Endpoints (port 3001)
| Route | Method | Deskripsi |
|---|---|---|
| `/status` | GET | Status bot + QR code string |
| `/send-code` | POST | Kirim kode verifikasi ke nomor WA |

---

## Komponen UI

| Komponen | Deskripsi |
|---|---|
| `Sidebar` | Nav: Overview, Expenses, Settings, Admin (jika ADMIN) + Sign out |
| `AddExpenseForm` | Form inline: category, amount, date, note |
| `MonthlyCalendar` | Grid kalender sebulan, total pengeluaran per hari dengan intensitas warna |
| `MonthlyBreakdown` | By Category (progress bar + % of budget/total, over-budget alert) + daftar transaksi (tanggal, jam, hover effect) |
| `BudgetSummary` | Dashboard: saldo awal → alokasi tetap → pengeluaran → sisa (merah/hijau + progress bar) |
| `BudgetForm` | Settings: set saldo awal + CRUD alokasi tetap per bulan |
| `CategoryBudgetForm` | Settings: set limit budget per kategori per bulan (upsert, kosong = no limit) |
| `CategoryManager` | CRUD kategori user di Settings |
| `PhoneVerification` | Input nomor WA + flow verifikasi + tombol Change (dengan Cancel) |
| `QRCodePanel` | Poll bot status, tampilkan QR atau status connected |
| `DefaultCategoryManager` | Admin: CRUD DefaultCategory |

---

## Bot WA — Kapabilitas

### Commands
- `/format` → balas panduan format input (2 format + daftar nama bulan)

### Parser (`parser.ts`)
- Format 1: `kategori-jumlah` → simpan hari ini
- Format 2: `kategori-jumlah-tanggal-NamaBulanIndonesia-tahun` → simpan ke tanggal spesifik
- Bulan: Januari–Desember (case-insensitive)
- Validasi: amount harus angka positif, tanggal harus valid

### Handler (`handler.ts`)
1. Identifikasi pengirim dari nomor WA (normalisasi `0xxx` → `62xxx`)
2. Cek user terdaftar → jika tidak, balas instruksi registrasi
3. Cek `isVerified` → jika tidak, minta selesaikan verifikasi di web
4. Cek pending `VerificationCode` → jika ada, balas dengan kode
5. Cek command `/format` → balas panduan format
6. Parse pesan → jika gagal, balas format contoh
7. Cari kategori user (case-insensitive) → jika tidak ada, balas daftar kategori tersedia
8. Simpan expense → balas konfirmasi (nama kategori + nominal + tanggal)

---

## Keputusan Arsitektur

- Supabase Session Pooler dipakai karena free tier tidak support IPv4 direct connection
- Schema di-push manual via Supabase SQL Editor (bukan `prisma db push`) karena IPv4 block
- `prisma migrate diff --from-empty` dipakai untuk generate SQL migrasi
- Setelah schema diubah: jalankan `prisma generate` di `packages/db` (matikan web server dulu)
- Bahasa UI web: **English**; bot reply: **Indonesian**
- WA session Baileys disimpan lokal di bot service (Railway)
- `pnpm.onlyBuiltDependencies` di root `package.json` agar Prisma client build saat `pnpm install`
- Bot tidak bisa dipakai oleh nomor yang sama (fromMe filter) — perlu nomor WA berbeda untuk testing
- Bot tsconfig: `CommonJS` + `tsconfig-paths` untuk resolve `@finance/db` workspace package

---

## Pending / Next Steps

- [ ] Halaman `/dashboard/expenses` (list + filter semua expense) belum dibuat
- [ ] Navigasi antar bulan di kalender & dashboard (sekarang hanya bulan berjalan)
- [ ] Delete expense dari web
- [ ] Bot: command `hapus` atau edit expense
- [ ] Deploy ke Railway (environment variables, volume untuk WA session, BOT_URL antar service)
- [ ] Notifikasi / ringkasan otomatis via WA (cron bulanan)
