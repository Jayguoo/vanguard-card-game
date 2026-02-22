import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { AuthUser, AuthResponse, FriendInfo } from '../shared/types';

const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const JWT_SECRET = process.env.JWT_SECRET || 'vanguard-dev-secret-key';
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set, using default dev key. Set JWT_SECRET env var for production.');
}
const SALT_ROUNDS = 10;

// ============================================
// DATA TYPES (server-only, never sent to client)
// ============================================

interface StoredUser {
  userId: string;
  username: string;
  passwordHash: string;
  fighterName: string;
  friends: string[];
  createdAt: number;
}

interface AccountsData {
  users: Record<string, StoredUser>;
  usernameLookup: Record<string, string>; // lowercase username -> userId
}

// ============================================
// IN-MEMORY STATE
// ============================================

let accounts: AccountsData = { users: {}, usernameLookup: {} };

// Track online users: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();
// Reverse lookup: socketId -> userId
const socketToUser = new Map<string, string>();

// ============================================
// FILE I/O
// ============================================

export function loadAccounts(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(ACCOUNTS_FILE)) {
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    accounts = JSON.parse(raw);
    console.log(`Loaded ${Object.keys(accounts.users).length} accounts`);
  } else {
    accounts = { users: {}, usernameLookup: {} };
    saveAccounts();
    console.log('Created new accounts file');
  }
}

function saveAccounts(): void {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
}

// ============================================
// AUTH
// ============================================

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload;
  } catch {
    return null;
  }
}

export async function register(
  username: string,
  password: string,
  fighterName: string,
): Promise<AuthResponse> {
  const trimUser = username.trim();
  const trimName = fighterName.trim().replace(/[<>&"'\/\\]/g, '');

  if (!trimUser || trimUser.length < 3 || trimUser.length > 20) {
    return { success: false, error: 'Username must be 3-20 characters' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  if (!trimName || trimName.length > 20) {
    return { success: false, error: 'Fighter name must be 1-20 characters' };
  }

  const lowerUser = trimUser.toLowerCase();
  if (accounts.usernameLookup[lowerUser]) {
    return { success: false, error: 'Username already taken' };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = nanoid(12);

  const user: StoredUser = {
    userId,
    username: trimUser,
    passwordHash,
    fighterName: trimName,
    friends: [],
    createdAt: Date.now(),
  };

  accounts.users[userId] = user;
  accounts.usernameLookup[lowerUser] = userId;
  saveAccounts();

  const token = generateToken(userId);
  return { success: true, token, user: toAuthUser(user) };
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const lowerUser = username.trim().toLowerCase();
  const userId = accounts.usernameLookup[lowerUser];
  if (!userId) {
    return { success: false, error: 'Invalid username or password' };
  }

  const user = accounts.users[userId];
  if (!user) {
    return { success: false, error: 'Invalid username or password' };
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return { success: false, error: 'Invalid username or password' };
  }

  const token = generateToken(userId);
  return { success: true, token, user: toAuthUser(user) };
}

// ============================================
// USER QUERIES
// ============================================

export function getUser(userId: string): StoredUser | null {
  return accounts.users[userId] || null;
}

export function toAuthUser(user: StoredUser): AuthUser {
  return {
    userId: user.userId,
    username: user.username,
    fighterName: user.fighterName,
    friends: user.friends,
  };
}

export function updateFighterName(userId: string, fighterName: string): boolean {
  const user = accounts.users[userId];
  if (!user) return false;
  const trimmed = fighterName.trim().replace(/[<>&"'\/\\]/g, '');
  if (!trimmed || trimmed.length > 20) return false;
  user.fighterName = trimmed;
  saveAccounts();
  return true;
}

// ============================================
// FRIENDS
// ============================================

export function addFriend(
  userId: string,
  friendUsername: string,
): { success: boolean; error?: string } {
  const user = accounts.users[userId];
  if (!user) return { success: false, error: 'Not authenticated' };

  const lowerFriend = friendUsername.trim().toLowerCase();
  const friendId = accounts.usernameLookup[lowerFriend];
  if (!friendId) return { success: false, error: 'User not found' };
  if (friendId === userId) return { success: false, error: 'Cannot add yourself' };

  const friend = accounts.users[friendId];
  if (!friend) return { success: false, error: 'User not found' };

  if (user.friends.includes(friendId)) {
    return { success: false, error: 'Already friends' };
  }

  // Bidirectional add
  user.friends.push(friendId);
  friend.friends.push(userId);
  saveAccounts();

  return { success: true };
}

export function removeFriend(
  userId: string,
  friendUserId: string,
): { success: boolean; error?: string } {
  const user = accounts.users[userId];
  if (!user) return { success: false, error: 'Not authenticated' };

  const friend = accounts.users[friendUserId];
  if (!friend) return { success: false, error: 'User not found' };

  // Bidirectional remove
  user.friends = user.friends.filter(id => id !== friendUserId);
  friend.friends = friend.friends.filter(id => id !== userId);
  saveAccounts();

  return { success: true };
}

export function getFriendsList(userId: string): FriendInfo[] {
  const user = accounts.users[userId];
  if (!user) return [];

  return user.friends.map(friendId => {
    const friend = accounts.users[friendId];
    if (!friend) return null;
    return {
      userId: friend.userId,
      username: friend.username,
      fighterName: friend.fighterName,
      isOnline: isUserOnline(friend.userId),
    };
  }).filter((f): f is FriendInfo => f !== null);
}

// ============================================
// ONLINE TRACKING
// ============================================

export function setOnline(userId: string, socketId: string): void {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
  socketToUser.set(socketId, userId);
}

/** Returns the userId if the user is now fully offline, null otherwise */
export function setOffline(socketId: string): string | null {
  const userId = socketToUser.get(socketId);
  if (!userId) return null;

  socketToUser.delete(socketId);
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
      return userId; // fully offline
    }
  }
  return null;
}

export function isUserOnline(userId: string): boolean {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
}

export function getSocketIdsForUser(userId: string): Set<string> | undefined {
  return onlineUsers.get(userId);
}

export function getUserIdForSocket(socketId: string): string | null {
  return socketToUser.get(socketId) || null;
}
