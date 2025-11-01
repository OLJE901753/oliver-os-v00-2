FROM node:20-alpine AS deps
WORKDIR /app

# Install curl (needed for potential fallbacks)
RUN apk add --no-cache curl

# Install pnpm using npm
RUN npm install -g pnpm@9

# Ensure pnpm is in PATH and verify installation
ENV PATH="/usr/local/bin:$PATH"
RUN which pnpm || npm list -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install dependencies - try pnpm first, fallback to npm
RUN if [ -f pnpm-lock.yaml ]; then \
      echo "Found pnpm-lock.yaml, using pnpm..." && \
      (pnpm install --frozen-lockfile || npm install); \
    elif [ -f package-lock.json ]; then \
      echo "Found package-lock.json, using npm ci..." && \
      npm ci; \
    else \
      echo "No lockfile found, using npm install..." && \
      npm install; \
    fi

FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Ensure pnpm is in PATH
ENV PATH="/usr/local/bin:$PATH"

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to skip database init during build
ENV SKIP_DB_INIT=true
ENV NODE_ENV=production

# Build TypeScript - use pnpm if lockfile exists, otherwise npm
RUN if [ -f pnpm-lock.yaml ]; then \
      echo "Building with pnpm..." && \
      (pnpm run build || npm run build); \
    else \
      echo "Building with npm..." && \
      npm run build; \
    fi

FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Set production environment
ENV NODE_ENV=production
ENV SKIP_DB_INIT=true
ENV PORT=3000

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
