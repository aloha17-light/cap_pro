FROM node:20-alpine AS builder

# Install OpenSSL for Prisma Query Engine on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

# Install OpenSSL, Python, C++, and Java for local execution
RUN apk add --no-cache openssl python3 gcc g++ musl-dev openjdk11


WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000
CMD npx prisma db push --accept-data-loss && node dist/index.js
