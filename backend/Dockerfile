# ─────────────────────────────────────────
# Stage 1 — Build
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────
# Stage 2 — Production image
# ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install prod dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output + Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client inside the image
RUN npx prisma generate

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
