# Oliver-OS Production Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy bmad-global first (local dependency)
COPY bmad-global ./bmad-global/

# Copy package files
COPY oliver-os/package.json ./package.json
COPY oliver-os/pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm@9

# Copy TypeScript config files
COPY tsconfig.base.json ./tsconfig.base.json
COPY oliver-os/tsconfig.json ./tsconfig.json

# Copy source code
COPY oliver-os/src ./src
COPY oliver-os/prisma ./prisma

# Fix bmad-global path in package.json before installing
RUN sed -i 's|file:../bmad-global|file:./bmad-global|' package.json

# Fix tsconfig.json path to reference tsconfig.base.json at the same level
RUN sed -i 's|"extends": "../tsconfig.base.json"|"extends": "./tsconfig.base.json"|' tsconfig.json

# Install dependencies
RUN pnpm install

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S oliver -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=oliver:nodejs /app/dist ./dist
COPY --from=builder --chown=oliver:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=oliver:nodejs /app/package.json ./package.json
COPY --from=builder --chown=oliver:nodejs /app/prisma ./prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER oliver

# Expose port
EXPOSE 3000

# Health check using curl (more reliable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
