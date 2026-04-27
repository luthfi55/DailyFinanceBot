# Update agents.md

Scan the current state of the project and rewrite `agents.md` to reflect it accurately.

## What to update

1. **Stack** — confirm packages and versions from `package.json` files
2. **Monorepo structure** — reflect actual folders and files in `packages/`
3. **Prisma schema** — sync model list from `packages/db/prisma/schema.prisma`
4. **Features built** — list pages and API routes that exist in `packages/web/src/app/`
5. **Bot capabilities** — summarise what `packages/bot/src/handler.ts` and `parser.ts` support
6. **Decisions made** — any architectural decisions recorded in this conversation or CLAUDE.md
7. **Pending / next steps** — any known gaps or TODO items

## Format

Keep the same markdown structure as the existing `agents.md`. Write in Indonesian (the original language of the document). Be concise — bullet points over paragraphs. Do not add fluff.

## Steps

1. Read `agents.md`
2. Read `packages/db/prisma/schema.prisma`
3. Glob `packages/web/src/app/**` to list all pages and API routes
4. Read `packages/bot/src/handler.ts` and `packages/bot/src/parser.ts`
5. Rewrite `agents.md` with accurate, up-to-date content
