import { GameRoom, Player, PublicGameRoom, PublicPlayer } from '../shared/types';
import { nanoid } from 'nanoid';

// In-memory room storage (use Redis/DB for production)
const rooms = new Map<string, GameRoom>();

// Map socket IDs to room IDs for quick lookup
const playerRooms = new Map<string, string>();

/**
 * Generate a short, readable room code
 */
function generateRoomCode(): string {
  return nanoid(6).toUpperCase();
}

/**
 * Create a new game room
 */
export function createRoom(hostId: string, hostName: string): GameRoom {
  const roomId = generateRoomCode();

  const host: Player = {
    id: hostId,
    name: hostName,
    hand: [],
    isHost: true,
    isConnected: true,
  };

  const room: GameRoom = {
    id: roomId,
    players: [host],
    gameState: 'waiting',
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    maxPlayers: 4,
  };

  rooms.set(roomId, room);
  playerRooms.set(hostId, roomId);

  console.log(`Room ${roomId} created by ${hostName}`);
  return room;
}

/**
 * Join an existing room
 */
export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string
): { room: GameRoom; player: Player } | { error: string } {
  const room = rooms.get(roomId.toUpperCase());

  if (!room) {
    return { error: 'Room not found' };
  }

  if (room.gameState !== 'waiting') {
    return { error: 'Game already in progress' };
  }

  if (room.players.length >= room.maxPlayers) {
    return { error: 'Room is full' };
  }

  // Check if player name is already taken
  if (room.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
    return { error: 'Name already taken in this room' };
  }

  const player: Player = {
    id: playerId,
    name: playerName,
    hand: [],
    isHost: false,
    isConnected: true,
  };

  room.players.push(player);
  playerRooms.set(playerId, roomId);

  console.log(`${playerName} joined room ${roomId}`);
  return { room, player };
}

/**
 * Remove a player from their room
 */
export function leaveRoom(playerId: string): { room: GameRoom; wasHost: boolean } | null {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  if (!room) return null;

  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return null;

  const player = room.players[playerIndex];
  const wasHost = player.isHost;

  // Remove player
  room.players.splice(playerIndex, 1);
  playerRooms.delete(playerId);

  console.log(`${player.name} left room ${roomId}`);

  // If room is empty, delete it
  if (room.players.length === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted (empty)`);
    return null;
  }

  // If host left, assign new host
  if (wasHost && room.players.length > 0) {
    room.players[0].isHost = true;
    console.log(`${room.players[0].name} is now host of room ${roomId}`);
  }

  // Adjust current player index if needed
  if (room.currentPlayerIndex >= room.players.length) {
    room.currentPlayerIndex = 0;
  }

  return { room, wasHost };
}

/**
 * Get a room by ID
 */
export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId.toUpperCase());
}

/**
 * Get room by player ID
 */
export function getRoomByPlayerId(playerId: string): GameRoom | undefined {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

/**
 * Get a player from a room
 */
export function getPlayer(room: GameRoom, playerId: string): Player | undefined {
  return room.players.find((p) => p.id === playerId);
}

/**
 * Convert room to public view (hides other players' hands)
 */
export function toPublicRoom(room: GameRoom): PublicGameRoom {
  return {
    id: room.id,
    players: room.players.map(toPublicPlayer),
    gameState: room.gameState,
    currentPlayerId: room.players[room.currentPlayerIndex]?.id || null,
    discardPile: room.discardPile,
    deckCount: room.deck.length,
    maxPlayers: room.maxPlayers,
  };
}

/**
 * Convert player to public view (hides hand)
 */
export function toPublicPlayer(player: Player): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    cardCount: player.hand.length,
    isHost: player.isHost,
    isConnected: player.isConnected,
  };
}

/**
 * Mark player as disconnected (for reconnection support)
 */
export function setPlayerConnected(playerId: string, connected: boolean): void {
  const room = getRoomByPlayerId(playerId);
  if (!room) return;

  const player = getPlayer(room, playerId);
  if (player) {
    player.isConnected = connected;
  }
}

/**
 * Get all rooms (for debugging)
 */
export function getAllRooms(): GameRoom[] {
  return Array.from(rooms.values());
}
