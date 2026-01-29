import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomResponse,
} from '../shared/types';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomByPlayerId,
  getPlayer,
  toPublicRoom,
  setPlayerConnected,
} from './roomManager';
import {
  dealCards,
  drawCard,
  playCard,
  canPlayCard,
  getTopCard,
  nextTurn,
  checkWinner,
  getCurrentPlayer,
} from './gameLogic';

const app = express();
const httpServer = createServer(app);

// Configure CORS for React dev server AND production
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL, // Production client URL
].filter(Boolean) as string[];

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`Player connected: ${socket.id}`);

  // ----------------------------------------
  // ROOM MANAGEMENT
  // ----------------------------------------

  socket.on('room:create', (playerName, callback) => {
    try {
      const room = createRoom(socket.id, playerName);

      // Join the socket room for broadcasting
      socket.join(room.id);

      const response: RoomResponse = {
        success: true,
        room: toPublicRoom(room),
        playerId: socket.id,
      };

      callback(response);
      console.log(`Room created: ${room.id} by ${playerName}`);
    } catch (error) {
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  socket.on('room:join', (roomId, playerName, callback) => {
    try {
      const result = joinRoom(roomId, socket.id, playerName);

      if ('error' in result) {
        callback({ success: false, error: result.error });
        return;
      }

      const { room, player } = result;

      // Join the socket room
      socket.join(room.id);

      // Notify other players
      socket.to(room.id).emit('room:playerJoined', {
        id: player.id,
        name: player.name,
        cardCount: 0,
        isHost: false,
        isConnected: true,
      });

      // Send updated room state to all players
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
  // GAME ACTIONS
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

    if (room.players.length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }

    if (room.gameState !== 'waiting') {
      socket.emit('error', 'Game already started');
      return;
    }

    // Deal cards and start the game
    dealCards(room);
    room.gameState = 'playing';

    // Send game state to all players
    io.to(room.id).emit('game:started', toPublicRoom(room));

    // Send each player their hand privately
    for (const p of room.players) {
      io.to(p.id).emit('game:yourHand', p.hand);
    }

    // Announce whose turn it is
    const currentPlayer = getCurrentPlayer(room);
    io.to(room.id).emit('game:turnChanged', currentPlayer.id);

    console.log(`Game started in room ${room.id}`);
  });

  socket.on('game:playCard', (cardId) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.gameState !== 'playing') {
      socket.emit('error', 'Game not in progress');
      return;
    }

    const player = getPlayer(room, socket.id);
    if (!player) {
      socket.emit('error', 'Player not found');
      return;
    }

    // Check if it's this player's turn
    const currentPlayer = getCurrentPlayer(room);
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', "Not your turn");
      return;
    }

    // Find the card in player's hand
    const card = player.hand.find((c) => c.id === cardId);
    if (!card) {
      socket.emit('error', 'Card not in hand');
      return;
    }

    // Check if the card can be played
    const topCard = getTopCard(room);
    if (!canPlayCard(card, topCard)) {
      socket.emit('error', 'Cannot play this card');
      return;
    }

    // Play the card
    const playedCard = playCard(room, player, cardId);
    if (!playedCard) {
      socket.emit('error', 'Failed to play card');
      return;
    }

    // Broadcast the play
    io.to(room.id).emit('game:cardPlayed', socket.id, playedCard);

    // Send updated hand to the player
    socket.emit('game:yourHand', player.hand);

    // Check for winner
    const winner = checkWinner(room);
    if (winner) {
      room.gameState = 'finished';
      io.to(room.id).emit('game:ended', winner.id);
      io.to(room.id).emit('room:update', toPublicRoom(room));
      return;
    }

    // Move to next turn
    const nextPlayerId = nextTurn(room);
    io.to(room.id).emit('game:turnChanged', nextPlayerId);
    io.to(room.id).emit('room:update', toPublicRoom(room));
  });

  socket.on('game:drawCard', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.gameState !== 'playing') {
      socket.emit('error', 'Game not in progress');
      return;
    }

    const player = getPlayer(room, socket.id);
    if (!player) {
      socket.emit('error', 'Player not found');
      return;
    }

    // Check if it's this player's turn
    const currentPlayer = getCurrentPlayer(room);
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', "Not your turn");
      return;
    }

    // Draw a card
    const card = drawCard(room, player);
    if (!card) {
      socket.emit('error', 'No cards left to draw');
      return;
    }

    // Broadcast that player drew (without revealing the card)
    io.to(room.id).emit('game:cardDrawn', socket.id, player.hand.length);

    // Send the new hand to the player privately
    socket.emit('game:yourHand', player.hand);

    // Update room state for card counts
    io.to(room.id).emit('room:update', toPublicRoom(room));
  });

  socket.on('game:endTurn', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.gameState !== 'playing') {
      socket.emit('error', 'Game not in progress');
      return;
    }

    const currentPlayer = getCurrentPlayer(room);
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', "Not your turn");
      return;
    }

    const nextPlayerId = nextTurn(room);
    io.to(room.id).emit('game:turnChanged', nextPlayerId);
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
 * Handle player leaving (either voluntarily or disconnect)
 */
function handlePlayerLeave(socket: Socket) {
  const result = leaveRoom(socket.id);

  if (result) {
    const { room, wasHost } = result;

    // Leave the socket room
    socket.leave(room.id);

    // Notify remaining players
    io.to(room.id).emit('room:playerLeft', socket.id);
    io.to(room.id).emit('room:update', toPublicRoom(room));

    // If game was in progress and not enough players, end it
    if (room.gameState === 'playing' && room.players.length < 2) {
      room.gameState = 'finished';
      if (room.players.length === 1) {
        io.to(room.id).emit('game:ended', room.players[0].id);
      }
    }
  }
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🃏 Card Game Server Running          ║
║   Port: ${PORT}                           ║
║   Health: http://localhost:${PORT}/health  ║
╚════════════════════════════════════════╝
  `);
});
