import { GameRoom, RoomPlayer, PublicGameRoom, PublicRoomListItem, DeckId, CustomDeckComposition, RoomVisibility } from '../shared/types';
import { nanoid } from 'nanoid';

const rooms = new Map<string, GameRoom>();
const playerRooms = new Map<string, string>();

function generateRoomCode(): string {
  return nanoid(8).toUpperCase();
}

export function createRoom(hostId: string, hostName: string, visibility: RoomVisibility, password: string | null): GameRoom {
  const roomId = generateRoomCode();

  const host: RoomPlayer = {
    id: hostId,
    name: hostName,
    deckId: null,
    customDeck: null,
    isHost: true,
    isConnected: true,
    isReady: false,
  };

  const room: GameRoom = {
    id: roomId,
    players: [host],
    roomState: 'waiting',
    maxPlayers: 2,
    visibility,
    password: visibility === 'private' ? password : null,
  };

  rooms.set(roomId, room);
  playerRooms.set(hostId, roomId);

  console.log(`Room ${roomId} created by ${hostName} (${visibility})`);
  return room;
}

export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string,
  password: string | null,
): { room: GameRoom; player: RoomPlayer } | { error: string } {
  const room = rooms.get(roomId.toUpperCase());
  if (!room) return { error: 'Room not found' };
  if (room.roomState !== 'waiting') return { error: 'Game already in progress' };
  if (room.players.length >= room.maxPlayers) return { error: 'Room is full' };

  if (room.password && room.password !== password) {
    return { error: 'Incorrect password' };
  }

  if (room.players.some((p: RoomPlayer) => p.name.toLowerCase() === playerName.toLowerCase())) {
    return { error: 'Name already taken in this room' };
  }

  const player: RoomPlayer = {
    id: playerId,
    name: playerName,
    deckId: null,
    customDeck: null,
    isHost: false,
    isConnected: true,
    isReady: false,
  };

  room.players.push(player);
  playerRooms.set(playerId, roomId);

  // When 2 players are in, move to deck select
  if (room.players.length === 2) {
    room.roomState = 'deck-select';
  }

  console.log(`${playerName} joined room ${roomId}`);
  return { room, player };
}

export function leaveRoom(playerId: string): { room: GameRoom; wasHost: boolean } | null {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  if (!room) return null;

  const playerIdx = room.players.findIndex((p: RoomPlayer) => p.id === playerId);
  if (playerIdx === -1) return null;

  const wasHost = room.players[playerIdx].isHost;
  room.players.splice(playerIdx, 1);
  playerRooms.delete(playerId);

  if (room.players.length === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted (empty)`);
    return null;
  }

  if (wasHost && room.players.length > 0) {
    room.players[0].isHost = true;
  }

  if (room.roomState === 'playing' && room.players.length < 2) {
    room.roomState = 'finished';
  }

  if (room.roomState === 'deck-select') {
    room.roomState = 'waiting';
    room.players.forEach((p: RoomPlayer) => { p.isReady = false; });
  }

  return { room, wasHost };
}

export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId.toUpperCase());
}

export function getRoomByPlayerId(playerId: string): GameRoom | undefined {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function getPlayer(room: GameRoom, playerId: string): RoomPlayer | undefined {
  return room.players.find((p: RoomPlayer) => p.id === playerId);
}

export function setPlayerDeck(room: GameRoom, playerId: string, deckId: DeckId): boolean {
  const player = room.players.find((p: RoomPlayer) => p.id === playerId);
  if (!player) return false;

  player.deckId = deckId;
  player.customDeck = null;
  return true;
}

export function setPlayerCustomDeck(room: GameRoom, playerId: string, deck: CustomDeckComposition): boolean {
  const player = room.players.find((p: RoomPlayer) => p.id === playerId);
  if (!player) return false;

  player.customDeck = deck;
  player.deckId = null;
  return true;
}

export function setPlayerReady(room: GameRoom, playerId: string): boolean {
  const player = room.players.find((p: RoomPlayer) => p.id === playerId);
  if (!player || (!player.deckId && !player.customDeck)) return false;
  player.isReady = true;
  return true;
}

export function areAllPlayersReady(room: GameRoom): boolean {
  return room.players.length === 2 &&
    room.players.every((p: RoomPlayer) => p.isReady && (p.deckId !== null || p.customDeck !== null));
}

export function setPlayerConnected(playerId: string, connected: boolean): void {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players.find((p: RoomPlayer) => p.id === playerId);
  if (player) player.isConnected = connected;
}

export function toPublicRoom(room: GameRoom): PublicGameRoom {
  return {
    id: room.id,
    players: room.players.map(p => ({ ...p, customDeck: p.customDeck ? { name: p.customDeck.name, starterVanguardId: p.customDeck.starterVanguardId, cards: [] } : null })),
    roomState: room.roomState,
    maxPlayers: room.maxPlayers,
    visibility: room.visibility,
    hasPassword: !!room.password,
  };
}

export function getPublicRoomList(): PublicRoomListItem[] {
  const list: PublicRoomListItem[] = [];
  for (const room of rooms.values()) {
    if (room.visibility === 'public' && room.roomState === 'waiting' && room.players.length < room.maxPlayers) {
      list.push({
        id: room.id,
        hostName: room.players.find(p => p.isHost)?.name ?? 'Unknown',
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
      });
    }
  }
  return list;
}
