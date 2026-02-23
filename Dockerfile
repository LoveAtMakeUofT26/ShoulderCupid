# Multi-stage build for the backend in a monorepo
FROM node:20-slim AS base
WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

# Install all workspace dependencies
RUN npm install --workspaces --include-workspace-root

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/backend/ apps/backend/

# Build backend (tsc)
RUN cd apps/backend && npx tsc

# Production stage — smaller image
FROM node:20-slim AS production
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

RUN npm install --workspaces --include-workspace-root --omit=dev

# Copy shared source (imported at runtime via tsconfig paths)
COPY packages/shared/ packages/shared/

# Copy compiled backend
COPY --from=base /app/apps/backend/dist apps/backend/dist

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "apps/backend/dist/server.js"]
