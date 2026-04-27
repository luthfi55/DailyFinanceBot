FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/bot/package.json packages/bot/

# Install all deps (needed to resolve workspace links)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db packages/db
COPY packages/bot packages/bot

# Generate Prisma client then build bot (tsup bundles @finance/db inline)
RUN pnpm --filter @finance/db generate
RUN pnpm --filter bot build

# --- Runtime image ---
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/bot/package.json packages/bot/

# Only production deps
RUN pnpm install --frozen-lockfile --prod

# Copy compiled bot (single bundled file from tsup)
COPY --from=builder /app/packages/bot/dist packages/bot/dist

EXPOSE 3001
CMD ["node", "packages/bot/dist/index.js"]
