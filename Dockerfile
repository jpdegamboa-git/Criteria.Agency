# criteria.agency — Hono API Backend
# Build: docker build -t criteria-api .
# Run:   docker run -p 3000:3000 --env-file .env criteria-api

FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY src/ src/
COPY agents/ agents/
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install tsx for runtime TS execution
RUN npm install tsx

# Create storage directory
RUN mkdir -p storage

EXPOSE 3000

CMD ["node_modules/.bin/tsx", "src/api/server.ts"]
