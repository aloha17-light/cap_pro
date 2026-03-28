// =============================================================================
// Prisma Client Singleton (Layer 5: Data Access)
// =============================================================================
// Why a singleton?
//   In development, `tsx watch` performs hot reloads which would create a new
//   PrismaClient on every restart, quickly exhausting the PostgreSQL connection
//   pool (default: 5 connections). By attaching the client to `globalThis`, we
//   reuse the same instance across hot reloads.
//
// In production, Node.js doesn't hot-reload, so a module-level instance
// suffices. The globalThis pattern is harmless there.
//
// Time complexity: O(1) for client retrieval; connection pooling is managed
// internally by Prisma's query engine.
// =============================================================================

import { PrismaClient } from '@prisma/client';

// Extend globalThis to hold our Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance.
 * - Reuses existing instance on hot reload (development).
 * - Creates new instance only on first import.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Preserve the instance across hot reloads in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
