FROM node:20-slim
WORKDIR /app

RUN npm install -g pnpm

# Install OpenSSL required by Prisma on Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/bot/package.json packages/bot/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db packages/db
COPY packages/bot packages/bot

# 1. Generate Prisma client
RUN pnpm --filter @finance/db generate

# 2. Compile @finance/db to JavaScript
RUN pnpm --filter @finance/db build

# 3. Patch @finance/db exports to use compiled JS (bot tsc uses tsconfig paths
#    for type-checking, but Node.js runtime resolves via package.json exports)
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('packages/db/package.json','utf8'));p.main='./dist/index.js';p.exports={'.':'./dist/index.js'};fs.writeFileSync('packages/db/package.json',JSON.stringify(p,null,2))"

# 4. Compile bot to JavaScript
RUN pnpm --filter bot build

EXPOSE 3001
CMD ["node", "packages/bot/dist/index.js"]
