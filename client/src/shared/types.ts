// ============================================
// CARDFIGHT!! VANGUARD - TYPE DEFINITIONS
// ============================================

// ============================================
// ENUMS AND CONSTANTS
// ============================================

export type Grade = 0 | 1 | 2 | 3;

export type Clan = 'royal-paladin' | 'kagero' | 'nova-grappler' | 'oracle-think-tank' | 'spike-brothers' | 'tachikaze' | 'nubatama' | 'dark-irregulars' | 'granblue' | 'megacolony' | 'bermuda-triangle' | 'great-nature' | 'pale-moon' | 'murakumo';

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
  battlePowerModifier: number;     // cleared at closeBattle()
  battleCriticalModifier: number;  // cleared at closeBattle()
  continuousPowerModifier: number; // recalculated on demand (e.g. Gancelot)
  continuousCriticalModifier: number; // recalculated on demand (e.g. Perfect Raizer)
  lostTwinDrive: boolean;          // Dragonic Overlord re-stand effect
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
  deckId: DeckId | 'custom';

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
  | 'ability-pending'
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
  nullified: boolean;
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

  // Ability system
  abilityPending: AbilityPendingState | null;
  abilityQueue: QueuedAbility[];
}

export interface GameLogEntry {
  timestamp: number;
  playerId: string;
  message: string;
  type: 'phase' | 'action' | 'trigger' | 'damage' | 'system' | 'ability';
}

// ============================================
// ABILITY PENDING STATE
// ============================================

export type AbilityPendingType =
  | 'may-activate'      // optional: player may activate or decline
  | 'select-target'     // player must choose a target
  | 'select-discard'    // player must choose card(s) to discard from hand
  | 'search-select';    // player must choose from search results

export interface AbilityPendingState {
  abilityId: string;            // e.g. "TD01/005-0"
  cardInstanceId: string;       // the card whose ability triggered
  cardId: string;               // cardId for lookup
  playerId: string;             // whose ability it is
  type: AbilityPendingType;
  description: string;          // displayed to the player
  optional: boolean;            // can the player decline?
  validTargets?: string[];      // instanceIds of valid target units
  searchResults?: string[];     // instanceIds found via deck search
  minSelections?: number;
  maxSelections?: number;
  costDescription?: string;     // e.g. "Counter Blast (2)"
  previousPhase: GamePhase;     // phase to return to after resolution
  nonDiscardCostsPaid?: boolean; // true if non-discard costs were already paid in confirm step
  validDiscards?: string[];     // instanceIds of valid cards for select-discard (e.g., clan-filtered for sentinel)
}

export interface QueuedAbility {
  abilityId: string;
  cardInstanceId: string;
  cardId: string;
  playerId: string;
  context: Record<string, any>; // additional context for resolution
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
  battlePowerModifier: number;
  battleCriticalModifier: number;
  continuousPowerModifier: number;
  continuousCriticalModifier: number;
  lostTwinDrive: boolean;
}

export interface PublicPlayerState {
  id: string;
  name: string;
  deckId: DeckId | 'custom';
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
  nullified: boolean;
}

export interface PublicAbilityPendingState {
  abilityId: string;
  cardInstanceId: string;
  cardId: string;
  playerId: string;
  type: AbilityPendingType;
  description: string;
  optional: boolean;
  validTargets?: PublicCardInstance[];
  validTargetPositions?: string[];  // for position-based selections (e.g., callSelfToRC empty RC)
  searchResults?: PublicCardInstance[];
  minSelections?: number;
  maxSelections?: number;
  costDescription?: string;
  validDiscards?: PublicCardInstance[];  // valid cards for clan-filtered discard (sentinel)
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
  abilityPending: PublicAbilityPendingState | null;
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
  | { type: 'endTurn' }
  // Ability actions
  | { type: 'ability:activate'; instanceId: string; abilityIndex: number }
  | { type: 'ability:selectTarget'; targetInstanceId: string }
  | { type: 'ability:selectDiscard'; cardInstanceIds: string[] }
  | { type: 'ability:searchSelect'; cardInstanceId: string }
  | { type: 'ability:confirm' }
  | { type: 'ability:decline' };

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================
// DECK TYPES
// ============================================

export type DeckId = 'td01-blaster-blade' | 'td02-dragonic-overlord' | 'td03-gold-rutile' | 'td04-sakuya';

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

export interface CustomDeckComposition {
  name: string;
  starterVanguardId: string;
  cards: { cardId: string; count: number }[];
}

// ============================================
// ROOM / LOBBY TYPES
// ============================================

export type RoomState = 'waiting' | 'deck-select' | 'playing' | 'finished';
export type RoomVisibility = 'public' | 'private';

export interface RoomPlayer {
  id: string;
  name: string;
  deckId: DeckId | null;
  customDeck: CustomDeckComposition | null;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}

export interface GameRoom {
  id: string;
  players: RoomPlayer[];
  roomState: RoomState;
  maxPlayers: 2;
  visibility: RoomVisibility;
  password: string | null;
}

export interface PublicGameRoom {
  id: string;
  players: RoomPlayer[];
  roomState: RoomState;
  maxPlayers: number;
  visibility: RoomVisibility;
  hasPassword: boolean;
}

export interface PublicRoomListItem {
  id: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
}

// ============================================
// AUTH / ACCOUNTS
// ============================================

export interface AuthUser {
  userId: string;
  username: string;
  fighterName: string;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
}

export interface FriendInfo {
  userId: string;
  username: string;
  fighterName: string;
  isOnline: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
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
  'room:create': (playerName: string, options: { visibility: RoomVisibility; password?: string }, callback: (response: RoomResponse) => void) => void;
  'room:join': (roomId: string, playerName: string, password: string | null, callback: (response: RoomResponse) => void) => void;
  'room:leave': () => void;
  'room:list': (callback: (rooms: PublicRoomListItem[]) => void) => void;

  'deck:select': (deckId: DeckId) => void;
  'deck:submitCustom': (deck: CustomDeckComposition, callback: (response: { success: boolean; error?: string }) => void) => void;
  'deck:ready': () => void;

  'game:start': () => void;
  'game:action': (action: GameAction, callback: (result: ActionResult) => void) => void;

  'auth:register': (username: string, password: string, fighterName: string, callback: (response: AuthResponse) => void) => void;
  'auth:login': (username: string, password: string, callback: (response: AuthResponse) => void) => void;
  'auth:updateFighterName': (fighterName: string, callback: (response: { success: boolean; error?: string }) => void) => void;

  'stats:get': (callback: (stats: UserStats | null) => void) => void;

  'friends:list': (callback: (friends: FriendInfo[]) => void) => void;
  'friends:add': (username: string, callback: (response: { success: boolean; error?: string }) => void) => void;
  'friends:remove': (friendUserId: string, callback: (response: { success: boolean; error?: string }) => void) => void;

  'latency:ping': (timestamp: number, callback: (timestamp: number) => void) => void;
}

export interface ServerToClientEvents {
  'room:playerJoined': (player: RoomPlayer) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:update': (room: PublicGameRoom) => void;
  'room:listUpdate': (rooms: PublicRoomListItem[]) => void;

  'deck:playerSelected': (playerId: string, deckId: DeckId | 'custom') => void;
  'deck:playerReady': (playerId: string) => void;
  'deck:allReady': () => void;

  'game:stateUpdate': (state: PublicVanguardGameState) => void;

  'auth:verified': (user: AuthUser) => void;
  'auth:expired': () => void;

  'friends:statusUpdate': (friendUserId: string, isOnline: boolean) => void;

  'error': (message: string) => void;
}
