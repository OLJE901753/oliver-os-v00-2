FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm@9 && pnpm install --frozen-lockfile; elif [ -f package-lock.json ]; then npm ci; else npm i; fi

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SKIP_DB_INIT=true
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm@9 && pnpm run build; else npm run build; fi

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_DB_INIT=true
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
# If start script uses dist/index.js
CMD ["node", "dist/index.js"]
