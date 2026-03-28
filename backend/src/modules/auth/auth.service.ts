// =============================================================================
// Auth Service — Business Logic Layer
// =============================================================================
// Encapsulates all authentication-related business logic:
//   - User registration (bcrypt hashing + JWT signing)
//   - User login (credential verification + JWT signing)
//   - Profile retrieval (with Redis caching)
//
// Architecture note: This service layer is independent of Express (no req/res).
// It receives plain objects and returns plain objects, making it testable
// without HTTP mocking.
//
// Security:
//   - bcrypt with 12 salt rounds ≈ ~250ms per hash (good balance of security
//     vs latency; OWASP recommends 10+ rounds)
//   - JWT signed with HMAC-SHA256 (symmetric; if multi-service verification
//     is needed later, switch to RS256 asymmetric keys)
// =============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import {
  cacheUserProfile,
  getCachedUserProfile,
  invalidateUserProfile,
} from '../../lib/redis';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../lib/errors';
import { RegisterInput, LoginInput } from './auth.schema';

// Number of bcrypt salt rounds — 2^12 = 4096 iterations
// Time complexity: O(2^saltRounds) — deliberately slow to resist brute-force
const SALT_ROUNDS = 12;

// =============================================================================
// Types
// =============================================================================

/** Safe user object returned to the client (no passwordHash) */
interface UserResponse {
  id: string;
  email: string;
  username: string;
  rating: number;
  streak: number;
  lastActiveAt: Date | null;
  createdAt: Date;
}

/** Auth response containing both user data and JWT */
interface AuthResponse {
  user: UserResponse;
  token: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Signs a JWT with the user's ID as the payload.
 * @param userId - UUID of the authenticated user
 * @returns Signed JWT string
 *
 * Time complexity: O(1) — HMAC-SHA256 signing
 */
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId }, secret, { expiresIn });
}

/**
 * Strips sensitive fields from the user object before sending to client.
 * @param user - Full user row from Prisma
 * @returns User object without passwordHash
 */
function sanitizeUser(user: {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  rating: number;
  streak: number;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
  const { passwordHash, updatedAt, ...safeUser } = user;
  return safeUser;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Registers a new user.
 *
 * Flow:
 *   1. Check if email or username already exists (Prisma unique constraint
 *      will also catch this, but we provide a friendlier error message)
 *   2. Hash the password with bcrypt
 *   3. Create the user in PostgreSQL
 *   4. Generate a JWT
 *   5. Return sanitized user + token
 *
 * @param data - Validated register input (email, username, password)
 * @returns AuthResponse with user and JWT
 * @throws ConflictError if email or username already exists
 *
 * Time complexity: O(2^SALT_ROUNDS) dominated by bcrypt hashing
 */
export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
  // Check for existing user with same email
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw ConflictError('A user with this email already exists');
  }

  // Check for existing user with same username
  const existingUsername = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existingUsername) {
    throw ConflictError('This username is already taken');
  }

  // Hash password — O(2^12) iterations ≈ 250ms
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user in PostgreSQL
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
    },
  });

  // Generate JWT
  const token = generateToken(user.id);

  return {
    user: sanitizeUser(user),
    token,
  };
}

/**
 * Authenticates a user with email and password.
 *
 * Flow:
 *   1. Find user by email
 *   2. Compare provided password against stored bcrypt hash
 *   3. Generate a JWT on success
 *
 * Security: We return the same error message for "user not found" and
 * "wrong password" to prevent user enumeration attacks.
 *
 * @param data - Validated login input (email, password)
 * @returns AuthResponse with user and JWT
 * @throws UnauthorizedError if credentials are invalid
 *
 * Time complexity: O(2^SALT_ROUNDS) dominated by bcrypt.compare()
 */
export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  // Find user by email — O(log n) via unique index
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // Constant-time-ish check: even if user doesn't exist, we still hash
  // to prevent timing-based user enumeration
  if (!user) {
    throw UnauthorizedError('Invalid email or password');
  }

  // Compare password against stored hash — O(2^SALT_ROUNDS)
  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw UnauthorizedError('Invalid email or password');
  }

  // Generate JWT
  const token = generateToken(user.id);

  return {
    user: sanitizeUser(user),
    token,
  };
}

/**
 * Retrieves the authenticated user's profile.
 *
 * Caching strategy (read-aside):
 *   1. Check Redis cache first (O(1))
 *   2. On cache miss, query PostgreSQL (O(log n) via primary key)
 *   3. Store result in Redis with 5-minute TTL
 *
 * This reduces PostgreSQL load for the common case (profile fetched on
 * every page load by the frontend).
 *
 * @param userId - UUID from the JWT payload
 * @returns UserResponse without passwordHash
 * @throws NotFoundError if user doesn't exist (e.g., deleted after JWT issued)
 */
export async function getUserProfile(userId: string): Promise<UserResponse> {
  // Step 1: Check Redis cache — O(1)
  const cached = await getCachedUserProfile(userId);
  if (cached) {
    return cached as unknown as UserResponse;
  }

  // Step 2: Cache miss — query PostgreSQL — O(log n) via PK index
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  const sanitized = sanitizeUser(user);

  // Step 3: Cache the result — O(1)
  await cacheUserProfile(userId, sanitized as unknown as Record<string, unknown>);

  return sanitized;
}
