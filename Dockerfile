# Stage 1: Dependency resolution and production prune
FROM node:20-alpine AS deps
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=8080

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "src/server.js"]
