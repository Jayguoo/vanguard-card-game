// ============================================
// VANGUARD CARD TYPES
// ============================================

export interface VanguardCard {
  id: string;
  name: string;
  grade: number; // 0, 1, 2, 3
  power: number;
  shield?: number;
  clan: string;
  imageUrl: string;
  skill?: string;
  trigger?: 'critical' | 'draw' | 'stand' | 'heal';
}

export interface DeckDefinition {
  id: string;
  name: string;
  description: string;
  clan: string;
  coverImage: string;
  cards: VanguardCard[];
}

// Available decks
export type DeckId = 'blaster-blade' | 'dragonic-overlord';

export interface Player {
  id: string;
  name: string;
  hand: VanguardCard[];
  deckId: DeckId | null;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  gameState: GameState;
  currentPlayerIndex: number;
  deck: VanguardCard[];
  discardPile: VanguardCard[];
  maxPlayers: number;
}

export type GameState = 'waiting' | 'deck-select' | 'playing' | 'finished';

// ============================================
// SOCKET EVENTS - Client -> Server
// ============================================
export interface ClientToServerEvents {
  // Room management
  'room:create': (playerName: string, callback: (response: RoomResponse) => void) => void;
  'room:join': (roomId: string, playerName: string, callback: (response: RoomResponse) => void) => void;
  'room:leave': () => void;

  // Deck selection
  'deck:select': (deckId: DeckId) => void;
  'deck:ready': () => void;

  // Game actions
  'game:start': () => void;
  'game:playCard': (cardId: string) => void;
  'game:drawCard': () => void;
  'game:endTurn': () => void;
}

// ============================================
// SOCKET EVENTS - Server -> Client
// ============================================
export interface ServerToClientEvents {
  // Room updates
  'room:playerJoined': (player: PublicPlayer) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:update': (room: PublicGameRoom) => void;

  // Deck selection
  'deck:playerSelected': (playerId: string, deckId: DeckId) => void;
  'deck:playerReady': (playerId: string) => void;
  'deck:allReady': () => void;

  // Game updates
  'game:started': (gameState: PublicGameRoom) => void;
  'game:cardPlayed': (playerId: string, card: VanguardCard) => void;
  'game:cardDrawn': (playerId: string, cardCount: number) => void;
  'game:turnChanged': (currentPlayerId: string) => void;
  'game:ended': (winnerId: string) => void;
  'game:yourHand': (cards: VanguardCard[]) => void;

  // Errors
  'error': (message: string) => void;
}

// ============================================
// API RESPONSES
// ============================================
export interface RoomResponse {
  success: boolean;
  room?: PublicGameRoom;
  playerId?: string;
  error?: string;
}

// Public game room (hides other players' hands)
export interface PublicGameRoom {
  id: string;
  players: PublicPlayer[];
  gameState: GameState;
  currentPlayerId: string | null;
  discardPile: VanguardCard[];
  deckCount: number;
  maxPlayers: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  cardCount: number;
  deckId: DeckId | null;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}
