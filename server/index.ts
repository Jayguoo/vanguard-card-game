import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomResponse,
  DeckId,
  GameAction,
  ActionResult,
} from '../shared/types';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomByPlayerId,
  getPlayer,
  toPublicRoom,
  setPlayerDeck,
  setPlayerReady,
  areAllPlayersReady,
} from './roomManager';
import { GameEngine } from './game/GameEngine';

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Store game engines per room
const gameEngines = new Map<string, GameEngine>();

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`Player connected: ${socket.id}`);

  // ----------------------------------------
  // ROOM MANAGEMENT
  // ----------------------------------------

  socket.on('room:create', (playerName: string, callback: (response: RoomResponse) => void) => {
    try {
      const room = createRoom(socket.id, playerName);
      socket.join(room.id);

      callback({
        success: true,
        room: toPublicRoom(room),
        playerId: socket.id,
      });
      console.log(`Room created: ${room.id} by ${playerName}`);
    } catch (error) {
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  socket.on('room:join', (roomId: string, playerName: string, callback: (response: RoomResponse) => void) => {
    try {
      const result = joinRoom(roomId, socket.id, playerName);

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
        isHost: false,
        isConnected: true,
        isReady: false,
      });

      // Send updated room to all
      io.to(room.id).emit('room:update', toPublicRoom(room));

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
      const engine = new GameEngine(
        p1.id, p1.name, p1.deckId!,
        p2.id, p2.name, p2.deckId!,
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
  // DISCONNECTION
  // ----------------------------------------

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
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
  } else if (room) {
    // Room was deleted (empty)
    gameEngines.delete(room.id);
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
