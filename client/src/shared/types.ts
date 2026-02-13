// ============================================
// CARDFIGHT!! VANGUARD - TYPE DEFINITIONS
// ============================================

// ============================================
// ENUMS AND CONSTANTS
// ============================================

export type Grade = 0 | 1 | 2 | 3;

export type Clan = 'royal-paladin' | 'kagero';

export type TriggerType = 'critical' | 'draw' | 'stand' | 'heal';

export type SkillIcon = 'boost' | 'intercept' | 'twin-drive' | 'none';

export type RPSChoice = 'rock' | 'paper' | 'scissors';

export type CardZone =
  | 'deck'
  | 'hand'
  | 'vanguard-circle'
  | 'front-left-rc'
  | 'front-right-rc'
  | 'back-left-rc'
  | 'back-center-rc'
  | 'back-right-rc'
  | 'damage-zone'
  | 'drop-zone'
  | 'soul'
  | 'trigger-zone'
  | 'guardian-circle'
  | 'removed';

export type RearGuardPosition =
  | 'front-left'
  | 'front-right'
  | 'back-left'
  | 'back-center'
  | 'back-right';

export type FieldPosition = 'vanguard' | RearGuardPosition;

export const FRONT_ROW_POSITIONS: RearGuardPosition[] = ['front-left', 'front-right'];
export const BACK_ROW_POSITIONS: RearGuardPosition[] = ['back-left', 'back-center', 'back-right'];

// Column mapping for boost: back row position -> front row position it boosts
export const BOOST_COLUMN_MAP: Record<string, FieldPosition> = {
  'back-left': 'front-left',
  'back-center': 'vanguard',
  'back-right': 'front-right',
};

// Reverse: front position -> back position that can boost it
export const BOOST_COLUMN_REVERSE: Record<string, RearGuardPosition> = {
  'front-left': 'back-left',
  'vanguard': 'back-center',
  'front-right': 'back-right',
};

// ============================================
// CARD DEFINITION (static, from card database)
// ============================================

export interface CardDefinition {
  cardId: string;           // e.g. "TD01/001"
  name: string;
  grade: Grade;
  power: number;
  shield: number;           // 0 for Grade 3
  clan: Clan;
  race: string;
  triggerType?: TriggerType;
  triggerPower?: number;    // +5000 for standard triggers (original V series)
  skillIcon: SkillIcon;
  imageFile: string;        // e.g. "TD01_001EN.png"
  imagePath: string;        // e.g. "/cards/td01/TD01_001EN.png"
  isStarterVanguard: boolean;
  abilityText: string;
  critical?: number;        // base critical, default 1
}

// ============================================
// CARD INSTANCE (runtime, in-game state)
// ============================================

export interface CardInstance {
  instanceId: string;       // unique per-game ID
  cardId: string;           // references CardDefinition.cardId
  ownerId: string;          // player socket ID
  zone: CardZone;
  position?: FieldPosition;
  isRested: boolean;
  isFaceUp: boolean;
  turnPowerModifier: number;
  turnCriticalModifier: number;
}

// ============================================
// PLAYER STATE
// ============================================

export interface RearGuardSlots {
  'front-left': string | null;
  'front-right': string | null;
  'back-left': string | null;
  'back-center': string | null;
  'back-right': string | null;
}

export interface VanguardPlayerState {
  id: string;
  name: string;
  deckId: DeckId;

  // Zones (arrays of instanceIds)
  deck: string[];
  hand: string[];
  damageZone: string[];
  dropZone: string[];
  soul: string[];

  // Field positions
  vanguardCircle: string | null;
  rearGuards: RearGuardSlots;

  // Temporary zones
  guardianCircle: string[];
  triggerZone: string | null;

  // Per-turn state
  hasRiddenThisTurn: boolean;
  isFirstTurn: boolean;

  // Exchange
  mulliganComplete: boolean;
}

// ============================================
// GAME PHASE
// ============================================

export type GamePhase =
  | 'setup-rps'
  | 'setup-rps-result'
  | 'setup-choose-vanguard'
  | 'setup-draw-hand'
  | 'setup-mulligan'
  | 'setup-stand-up'
  | 'stand-phase'
  | 'draw-phase'
  | 'ride-phase'
  | 'main-phase'
  | 'battle-phase'
  | 'battle-attack-step'
  | 'battle-boost-step'
  | 'battle-guard-step'
  | 'battle-drive-check'
  | 'battle-drive-trigger-assign'
  | 'battle-damage-step'
  | 'battle-damage-check'
  | 'battle-damage-trigger-assign'
  | 'battle-close-step'
  | 'end-phase'
  | 'game-over';

// ============================================
// BATTLE STATE
// ============================================

export interface BattleState {
  attackingUnit: string | null;
  attackingPosition: FieldPosition | null;
  boostingUnit: string | null;
  boostingPosition: RearGuardPosition | null;
  targetUnit: string | null;
  targetPosition: FieldPosition | null;
  attackPower: number;
  defendPower: number;
  guardians: string[];
  driveChecksRemaining: number;
  driveCheckResults: string[];
  damageCheckResult: string | null;
  damageToApply: number;
  damageApplied: number;
  triggerToAssign: string | null;
  triggerContext: 'drive' | 'damage' | null;
  attackerCritical: number;
  healDamageChoicePending: boolean;
}

// ============================================
// RPS STATE (Rock Paper Scissors mini-game)
// ============================================

export interface RPSState {
  choices: Record<string, RPSChoice | null>;
  result: 'win' | 'draw' | null;
  winnerId: string | null;
  round: number;
}

export interface PublicRPSState {
  myChoice: RPSChoice | null;
  opponentHasChosen: boolean;
  myResult: 'win' | 'lose' | 'draw' | null;
  opponentChoice: RPSChoice | null;
  round: number;
}

// ============================================
// GAME STATE (full server-side state)
// ============================================

export interface VanguardGameState {
  phase: GamePhase;
  turnPlayerId: string;
  turnNumber: number;
  firstPlayerId: string;
  playerIds: string[];

  players: Record<string, VanguardPlayerState>;
  allCards: Record<string, CardInstance>;

  battle: BattleState | null;
  rps: RPSState | null;

  winner: string | null;

  actionLog: GameLogEntry[];
}

export interface GameLogEntry {
  timestamp: number;
  playerId: string;
  message: string;
  type: 'phase' | 'action' | 'trigger' | 'damage' | 'system';
}

// ============================================
// PUBLIC STATE (sent to clients)
// ============================================

export interface PublicCardInstance {
  instanceId: string;
  cardId: string;
  ownerId: string;
  zone: CardZone;
  position?: FieldPosition;
  isRested: boolean;
  isFaceUp: boolean;
  turnPowerModifier: number;
  turnCriticalModifier: number;
}

export interface PublicPlayerState {
  id: string;
  name: string;
  deckId: DeckId;
  deckCount: number;
  handCount: number;
  damageZone: PublicCardInstance[];
  dropZone: PublicCardInstance[];
  soulCount: number;

  vanguardCircle: PublicCardInstance | null;
  rearGuards: {
    'front-left': PublicCardInstance | null;
    'front-right': PublicCardInstance | null;
    'back-left': PublicCardInstance | null;
    'back-center': PublicCardInstance | null;
    'back-right': PublicCardInstance | null;
  };

  guardianCircle: PublicCardInstance[];
  triggerZone: PublicCardInstance | null;

  damageCount: number;
  mulliganComplete: boolean;
  hasRiddenThisTurn: boolean;
}

export interface MyPlayerState extends PublicPlayerState {
  hand: PublicCardInstance[];
  soul: PublicCardInstance[];
  deck: PublicCardInstance[];
}

export interface PublicBattleState {
  attackingUnit: PublicCardInstance | null;
  attackingPosition: FieldPosition | null;
  boostingUnit: PublicCardInstance | null;
  boostingPosition: RearGuardPosition | null;
  targetUnit: PublicCardInstance | null;
  targetPosition: FieldPosition | null;
  attackPower: number;
  defendPower: number;
  guardians: PublicCardInstance[];
  driveChecksRemaining: number;
  driveCheckResults: PublicCardInstance[];
  damageToApply: number;
  damageApplied: number;
  triggerToAssign: PublicCardInstance | null;
  triggerContext: 'drive' | 'damage' | null;
  attackerCritical: number;
  healDamageChoicePending: boolean;
}

export interface PublicVanguardGameState {
  phase: GamePhase;
  turnPlayerId: string;
  turnNumber: number;
  firstPlayerId: string;
  myState: MyPlayerState;
  opponentState: PublicPlayerState;
  battle: PublicBattleState | null;
  rps: PublicRPSState | null;
  winner: string | null;
  actionLog: GameLogEntry[];
}

// ============================================
// GAME ACTIONS (client -> server)
// ============================================

export type GameAction =
  | { type: 'setup:rpsChoice'; choice: RPSChoice }
  | { type: 'setup:confirmStartingVanguard' }
  | { type: 'setup:submitMulligan'; cardIds: string[] }
  | { type: 'phase:endPhase' }
  | { type: 'ride'; cardInstanceId: string }
  | { type: 'call'; cardInstanceId: string; position: RearGuardPosition }
  | { type: 'moveRearGuard'; from: RearGuardPosition; to: RearGuardPosition }
  | { type: 'swapRearGuards'; posA: RearGuardPosition; posB: RearGuardPosition }
  | { type: 'retireRearGuard'; position: RearGuardPosition }
  | { type: 'attack:declare'; attackerPosition: FieldPosition; targetPosition: FieldPosition }
  | { type: 'boost:declare'; boosterPosition: RearGuardPosition }
  | { type: 'boost:decline' }
  | { type: 'guard:addGuardian'; cardInstanceId: string }
  | { type: 'guard:intercept'; position: RearGuardPosition }
  | { type: 'guard:done' }
  | { type: 'guard:noGuard' }
  | { type: 'trigger:assignPower'; targetInstanceId: string; effectTargetInstanceId?: string }
  | { type: 'trigger:assignStandTarget'; targetInstanceId: string }
  | { type: 'trigger:chooseHealDamage'; damageInstanceId: string }
  | { type: 'endBattle' }
  | { type: 'endTurn' };

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================
// DECK TYPES
// ============================================

export type DeckId = 'td01-blaster-blade' | 'td02-dragonic-overlord';

export interface DeckComposition {
  deckId: DeckId;
  name: string;
  clan: Clan;
  clanDisplay: string;
  description: string;
  coverCardId: string;
  starterVanguardId: string;
  cards: { cardId: string; count: number }[];
}

// ============================================
// ROOM / LOBBY TYPES
// ============================================

export type RoomState = 'waiting' | 'deck-select' | 'playing' | 'finished';

export interface RoomPlayer {
  id: string;
  name: string;
  deckId: DeckId | null;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}

export interface GameRoom {
  id: string;
  players: RoomPlayer[];
  roomState: RoomState;
  maxPlayers: 2;
}

export interface PublicGameRoom {
  id: string;
  players: RoomPlayer[];
  roomState: RoomState;
  maxPlayers: number;
}

// ============================================
// SOCKET EVENTS
// ============================================

export interface RoomResponse {
  success: boolean;
  room?: PublicGameRoom;
  playerId?: string;
  error?: string;
}

export interface ClientToServerEvents {
  'room:create': (playerName: string, callback: (response: RoomResponse) => void) => void;
  'room:join': (roomId: string, playerName: string, callback: (response: RoomResponse) => void) => void;
  'room:leave': () => void;

  'deck:select': (deckId: DeckId) => void;
  'deck:ready': () => void;

  'game:start': () => void;
  'game:action': (action: GameAction, callback: (result: ActionResult) => void) => void;
}

export interface ServerToClientEvents {
  'room:playerJoined': (player: RoomPlayer) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:update': (room: PublicGameRoom) => void;

  'deck:playerSelected': (playerId: string, deckId: DeckId) => void;
  'deck:playerReady': (playerId: string) => void;
  'deck:allReady': () => void;

  'game:stateUpdate': (state: PublicVanguardGameState) => void;

  'error': (message: string) => void;
}
