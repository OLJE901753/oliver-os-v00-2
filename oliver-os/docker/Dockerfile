# Oliver-OS Production Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S oliver -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=oliver:nodejs /app/dist ./dist
COPY --from=builder --chown=oliver:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=oliver:nodejs /app/package.json ./package.json
COPY --from=builder --chown=oliver:nodejs /app/prisma ./prisma

# Switch to non-root user
USER oliver

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
