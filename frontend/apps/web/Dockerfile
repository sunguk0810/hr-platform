# syntax=docker/dockerfile:1.4
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY frontend/apps/web/package.json ./frontend/apps/web/
COPY frontend/packages/ ./frontend/packages/

# Install dependencies (with BuildKit cache mount for 80% faster rebuilds)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source files
COPY frontend/ ./frontend/

# Build the application
WORKDIR /app/frontend/apps/web
RUN pnpm build

# Production stage
FROM nginx:alpine AS production

# Copy nginx configuration
COPY frontend/apps/web/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/frontend/apps/web/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
