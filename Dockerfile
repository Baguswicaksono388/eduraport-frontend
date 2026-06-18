FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace and config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json of workspaces to cache dependencies install
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy codebase
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web

# Build frontend packages and the Nuxt app
RUN pnpm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy the self-contained Nuxt build output from builder
COPY --from=builder /app/apps/web/.output ./.output

# Expose Nuxt port
EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Run Nuxt server
CMD ["node", ".output/server/index.mjs"]
