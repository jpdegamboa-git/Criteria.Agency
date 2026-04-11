# criteria.agency — Hono API Backend (pnpm monorepo)
# Build: docker build -t criteria-api .
# Run:   docker run -p 3000:3000 --env-file .env criteria-api

FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.9
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy workspace packages needed by api
COPY packages/db/ ./packages/db/
COPY packages/shared/ ./packages/shared/

# Copy api app
COPY apps/api/ ./apps/api/

# Install all dependencies from monorepo root
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "--import", "tsx", "src/server.ts"]
