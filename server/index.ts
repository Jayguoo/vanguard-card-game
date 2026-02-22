import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomResponse,
  DeckId,
  CustomDeckComposition,
  GameAction,
  ActionResult,
  AuthResponse,
  FriendInfo,
} from '../shared/types';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomByPlayerId,
  getPlayer,
  toPublicRoom,
  getPublicRoomList,
  setPlayerDeck,
  setPlayerCustomDeck,
  setPlayerReady,
  areAllPlayersReady,
} from './roomManager';
import { validateCustomDeck } from './game/deckBuilder';
import { GameEngine } from './game/GameEngine';
import {
  loadAccounts,
  register,
  login,
  verifyToken,
  getUser,
  toAuthUser,
  updateFighterName,
  addFriend,
  removeFriend,
  getFriendsList,
  setOnline,
  setOffline,
  getSocketIdsForUser,
} from './accountManager';
import { RateLimiter } from './rateLimiter';
import { validateDeckShape, sanitizePlayerName } from './inputValidation';

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  process.env.RENDER_EXTERNAL_URL,
].filter(Boolean) as string[];

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, cb) => {
      // Allow same-origin requests (no origin header) and whitelisted origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, true); // Allow all in production since client is same-origin
      }
    },
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve client static files in production
const clientBuildPath = path.join(__dirname, '..', 'client-dist');
app.use(express.static(clientBuildPath));
app.get('*', (_req, res, next) => {
  // Only serve index.html for non-API/non-socket routes
  if (_req.path.startsWith('/socket.io') || _req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Store game engines per room
const gameEngines = new Map<string, GameEngine>();

// Rate limiter
const rateLimiter = new RateLimiter();
rateLimiter.addRule('game:action', 30, 1000);
rateLimiter.addRule('room:create', 3, 60000);
rateLimiter.addRule('room:join', 5, 60000);
rateLimiter.addRule('room:list', 10, 10000);
rateLimiter.addRule('auth:register', 3, 60000);
rateLimiter.addRule('auth:login', 5, 60000);
rateLimiter.addRule('friends:add', 10, 60000);
rateLimiter.addRule('deck:submitCustom', 5, 10000);
rateLimiter.addRule('latency:ping', 5, 1000);
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

// Load accounts from disk
loadAccounts();

// Optional auth middleware — doesn't block unauthenticated connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      socket.data.userId = payload.userId;
    }
  }
  next();
});

// Helper: notify all of a user's friends about their online status change
function notifyFriendsOfStatus(userId: string, isOnline: boolean): void {
  const user = getUser(userId);
  if (!user) return;
  for (const friendId of user.friends) {
    const friendSockets = getSocketIdsForUser(friendId);
    if (friendSockets) {
      for (const sid of friendSockets) {
        io.to(sid).emit('friends:statusUpdate', userId, isOnline);
      }
    }
  }
}

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`Player connected: ${socket.id}`);

  // If authenticated via token, mark online and confirm to client
  const hadToken = !!socket.handshake.auth?.token;
  if (socket.data.userId) {
    const user = getUser(socket.data.userId);
    if (user) {
      setOnline(socket.data.userId, socket.id);
      notifyFriendsOfStatus(socket.data.userId, true);
      socket.emit('auth:verified', toAuthUser(user));
    } else {
      // User was deleted but token still valid
      socket.data.userId = undefined;
      if (hadToken) socket.emit('auth:expired');
    }
  } else if (hadToken) {
    // Token was provided but invalid/expired
    socket.emit('auth:expired');
  }

  // ----------------------------------------
  // ROOM MANAGEMENT
  // ----------------------------------------

  socket.on('room:create', (playerName, options, callback) => {
    if (!rateLimiter.check(socket.id, 'room:create')) {
      callback({ success: false, error: 'Too many requests' }); return;
    }
    try {
      // Use account fighter name if authenticated
      const uid = socket.data.userId as string | undefined;
      const accountUser = uid ? getUser(uid) : null;
      const name = accountUser ? accountUser.fighterName : sanitizePlayerName(playerName);
      const room = createRoom(socket.id, name, options.visibility, options.password ?? null);
      socket.join(room.id);

      callback({
        success: true,
        room: toPublicRoom(room),
        playerId: socket.id,
      });

      // Broadcast updated room list so browsers see the new public room
      io.emit('room:listUpdate', getPublicRoomList());

      console.log(`Room created: ${room.id} by ${playerName} (${options.visibility})`);
    } catch (error) {
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  socket.on('room:join', (roomId, playerName, password, callback) => {
    if (!rateLimiter.check(socket.id, 'room:join')) {
      callback({ success: false, error: 'Too many requests' }); return;
    }
    try {
      // Use account fighter name if authenticated
      const uid = socket.data.userId as string | undefined;
      const accountUser = uid ? getUser(uid) : null;
      const name = accountUser ? accountUser.fighterName : sanitizePlayerName(playerName);
      const result = joinRoom(roomId, socket.id, name, password);

      if ('error' in result) {
        callback({ success: false, error: result.error });
        return;
      }

      const { room, player } = result;
      socket.join(room.id);

      // Notify other players
      socket.to(room.id).emit('room:playerJoined', {
        id: player.id,
        name: player.name,
        deckId: null,
        customDeck: null,
        isHost: false,
        isConnected: true,
        isReady: false,
      });

      // Send updated room to all
      io.to(room.id).emit('room:update', toPublicRoom(room));

      // Broadcast updated room list (room may now be full)
      io.emit('room:listUpdate', getPublicRoomList());

      callback({
        success: true,
        room: toPublicRoom(room),
        playerId: socket.id,
      });
    } catch (error) {
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  socket.on('room:leave', () => {
    handlePlayerLeave(socket);
  });

  socket.on('room:list', (callback) => {
    if (!rateLimiter.check(socket.id, 'room:list')) { callback([]); return; }
    callback(getPublicRoomList());
  });

  // ----------------------------------------
  // AUTH
  // ----------------------------------------

  socket.on('auth:register', async (username, password, fighterName, callback) => {
    if (!rateLimiter.check(socket.id, 'auth:register')) {
      callback({ success: false, error: 'Too many requests' }); return;
    }
    const result = await register(username, password, fighterName);
    if (result.success && result.user) {
      socket.data.userId = result.user.userId;
      setOnline(result.user.userId, socket.id);
      notifyFriendsOfStatus(result.user.userId, true);
    }
    callback(result);
  });

  socket.on('auth:login', async (username, password, callback) => {
    if (!rateLimiter.check(socket.id, 'auth:login')) {
      callback({ success: false, error: 'Too many requests' }); return;
    }
    const result = await login(username, password);
    if (result.success && result.user) {
      socket.data.userId = result.user.userId;
      setOnline(result.user.userId, socket.id);
      notifyFriendsOfStatus(result.user.userId, true);
    }
    callback(result);
  });

  socket.on('auth:updateFighterName', (fighterName, callback) => {
    const uid = socket.data.userId as string | undefined;
    if (!uid) { callback({ success: false, error: 'Not authenticated' }); return; }
    const success = updateFighterName(uid, fighterName);
    callback({ success, error: success ? undefined : 'Failed to update' });
  });

  // ----------------------------------------
  // FRIENDS
  // ----------------------------------------

  socket.on('friends:list', (callback) => {
    const uid = socket.data.userId as string | undefined;
    if (!uid) { callback([]); return; }
    callback(getFriendsList(uid));
  });

  socket.on('friends:add', (username, callback) => {
    if (!rateLimiter.check(socket.id, 'friends:add')) {
      callback({ success: false, error: 'Too many requests' }); return;
    }
    const uid = socket.data.userId as string | undefined;
    if (!uid) { callback({ success: false, error: 'Not authenticated' }); return; }
    callback(addFriend(uid, username));
  });

  socket.on('friends:remove', (friendUserId, callback) => {
    const uid = socket.data.userId as string | undefined;
    if (!uid) { callback({ success: false, error: 'Not authenticated' }); return; }
    callback(removeFriend(uid, friendUserId));
  });

  // ----------------------------------------
  // DECK SELECTION
  // ----------------------------------------

  socket.on('deck:select', (deckId: DeckId) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.roomState !== 'deck-select') {
      socket.emit('error', 'Cannot select deck now');
      return;
    }

    const success = setPlayerDeck(room, socket.id, deckId);
    if (!success) {
      socket.emit('error', 'Deck already selected by another player');
      return;
    }

    io.to(room.id).emit('deck:playerSelected', socket.id, deckId);
    io.to(room.id).emit('room:update', toPublicRoom(room));
  });

  socket.on('deck:submitCustom', (deck: CustomDeckComposition, callback: (response: { success: boolean; error?: string }) => void) => {
    if (!rateLimiter.check(socket.id, 'deck:submitCustom')) {
      callback({ success: false, error: 'Too many requests' }); return;
    }

    // Type/shape validation before game rules
    const shapeError = validateDeckShape(deck);
    if (shapeError) {
      callback({ success: false, error: shapeError }); return;
    }

    const room = getRoomByPlayerId(socket.id);
    if (!room || room.roomState !== 'deck-select') {
      callback({ success: false, error: 'Cannot submit deck now' });
      return;
    }

    const validationError = validateCustomDeck(deck);
    if (validationError) {
      callback({ success: false, error: validationError });
      return;
    }

    const success = setPlayerCustomDeck(room, socket.id, deck);
    if (!success) {
      callback({ success: false, error: 'Failed to set custom deck' });
      return;
    }

    io.to(room.id).emit('deck:playerSelected', socket.id, 'custom');
    io.to(room.id).emit('room:update', toPublicRoom(room));
    callback({ success: true });
  });

  socket.on('deck:ready', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.roomState !== 'deck-select') {
      socket.emit('error', 'Cannot ready up now');
      return;
    }

    const success = setPlayerReady(room, socket.id);
    if (!success) {
      socket.emit('error', 'Select a deck first');
      return;
    }

    io.to(room.id).emit('deck:playerReady', socket.id);
    io.to(room.id).emit('room:update', toPublicRoom(room));

    // Check if both players are ready
    if (areAllPlayersReady(room)) {
      io.to(room.id).emit('deck:allReady');
    }
  });

  // ----------------------------------------
  // GAME START
  // ----------------------------------------

  socket.on('game:start', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) {
      socket.emit('error', 'Not in a room');
      return;
    }

    const player = getPlayer(room, socket.id);
    if (!player?.isHost) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }

    if (!areAllPlayersReady(room)) {
      socket.emit('error', 'Not all players are ready');
      return;
    }

    if (room.roomState !== 'deck-select') {
      socket.emit('error', 'Cannot start game now');
      return;
    }

    // Create the game engine
    const p1 = room.players[0];
    const p2 = room.players[1];

    try {
      const p1Deck = p1.customDeck ?? p1.deckId!;
      const p2Deck = p2.customDeck ?? p2.deckId!;
      const engine = new GameEngine(
        p1.id, p1.name, p1Deck,
        p2.id, p2.name, p2Deck,
      );

      gameEngines.set(room.id, engine);
      room.roomState = 'playing';

      // Notify clients that room state changed to 'playing'
      io.to(room.id).emit('room:update', toPublicRoom(room));

      // Send initial state to each player (game starts at RPS phase)
      broadcastGameState(room.id, engine);

      console.log(`Game started in room ${room.id}`);
    } catch (err: any) {
      console.error('Failed to create game:', err);
      socket.emit('error', 'Failed to start game');
    }
  });

  // ----------------------------------------
  // GAME ACTIONS
  // ----------------------------------------

  socket.on('game:action', (action: GameAction, callback: (result: ActionResult) => void) => {
    if (!rateLimiter.check(socket.id, 'game:action')) {
      callback({ success: false, error: 'Too many requests' }); return;
    }
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.roomState !== 'playing') {
      callback({ success: false, error: 'Game not in progress' });
      return;
    }

    const engine = gameEngines.get(room.id);
    if (!engine) {
      callback({ success: false, error: 'Game engine not found' });
      return;
    }

    const result = engine.handleAction(socket.id, action);
    callback(result);

    if (result.success) {
      broadcastGameState(room.id, engine);

      // Auto-advance from RPS result after a brief delay
      if (engine.getPhase() === 'setup-rps-result') {
        const roomId = room.id;
        setTimeout(() => {
          const eng = gameEngines.get(roomId);
          if (eng && eng.getPhase() === 'setup-rps-result') {
            eng.advanceFromRPSResult();
            broadcastGameState(roomId, eng);
          }
        }, 2500);
      }

      // Auto-resolve non-trigger drive/damage check after a reveal pause
      scheduleRevealResolve(room.id, engine);

      // Check for game over
      if (engine.isGameOver()) {
        room.roomState = 'finished';
        io.to(room.id).emit('room:update', toPublicRoom(room));
        gameEngines.delete(room.id);
      }
    }
  });

  // ----------------------------------------
  // LATENCY PING
  // ----------------------------------------

  socket.on('latency:ping', (timestamp, callback) => {
    if (!rateLimiter.check(socket.id, 'latency:ping')) return;
    callback(timestamp);
  });

  // ----------------------------------------
  // DISCONNECTION
  // ----------------------------------------

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    rateLimiter.clearSocket(socket.id);

    // Track offline status for authenticated users
    const uid = socket.data.userId as string | undefined;
    if (uid) {
      const fullyOffline = setOffline(socket.id);
      if (fullyOffline) {
        notifyFriendsOfStatus(uid, false);
      }
    }

    handlePlayerLeave(socket);
  });
});

/**
 * Broadcast game state to each player with their personalized view.
 */
function broadcastGameState(roomId: string, engine: GameEngine): void {
  for (const playerId of engine.getPlayerIds()) {
    const state = engine.getStateForPlayer(playerId);
    io.to(playerId).emit('game:stateUpdate', state);
  }
}

/** Pending reveal timers per room (to prevent duplicates). */
const pendingRevealTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * If the engine has a non-trigger card in triggerZone during a check phase,
 * schedule a delayed resolution so the client can display the card reveal.
 */
function scheduleRevealResolve(roomId: string, engine: GameEngine): void {
  // Clear any existing timer for this room
  const existing = pendingRevealTimers.get(roomId);
  if (existing) clearTimeout(existing);
  pendingRevealTimers.delete(roomId);

  if (!engine.hasPendingReveal()) return;

  const timer = setTimeout(() => {
    pendingRevealTimers.delete(roomId);
    const eng = gameEngines.get(roomId);
    if (!eng || !eng.hasPendingReveal()) return;

    eng.resolveNonTriggerReveal();
    broadcastGameState(roomId, eng);

    // If the resolve led to another reveal (e.g. twin drive, multi-damage), chain it
    scheduleRevealResolve(roomId, eng);

    // Check for game over after resolution
    if (eng.isGameOver()) {
      const room = getRoom(roomId);
      if (room) {
        room.roomState = 'finished';
        io.to(room.id).emit('room:update', toPublicRoom(room));
        gameEngines.delete(room.id);
      }
    }
  }, 1500);

  pendingRevealTimers.set(roomId, timer);
}


/**
 * Handle player leaving.
 */
function handlePlayerLeave(socket: Socket): void {
  const room = getRoomByPlayerId(socket.id);
  const result = leaveRoom(socket.id);

  if (result) {
    const { room: updatedRoom, wasHost } = result;
    socket.leave(updatedRoom.id);

    io.to(updatedRoom.id).emit('room:playerLeft', socket.id);
    io.to(updatedRoom.id).emit('room:update', toPublicRoom(updatedRoom));

    if (updatedRoom.roomState === 'playing' && updatedRoom.players.length < 2) {
      updatedRoom.roomState = 'finished';
      if (updatedRoom.players.length === 1) {
        // The remaining player wins by forfeit
        const engine = gameEngines.get(updatedRoom.id);
        if (engine) {
          const state = engine.getStateForPlayer(updatedRoom.players[0].id);
          io.to(updatedRoom.id).emit('game:stateUpdate', {
            ...state,
            winner: updatedRoom.players[0].id,
            phase: 'game-over',
          });
        }
      }
      gameEngines.delete(updatedRoom.id);
    }

    // Broadcast updated room list (room may now be available again)
    io.emit('room:listUpdate', getPublicRoomList());
  } else if (room) {
    // Room was deleted (empty)
    gameEngines.delete(room.id);
    io.emit('room:listUpdate', getPublicRoomList());
  }
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Cardfight!! Vanguard Server Running      ║
║   Port: ${PORT}                               ║
║   Health: http://localhost:${PORT}/health      ║
╚════════════════════════════════════════════╝
  `);
});
