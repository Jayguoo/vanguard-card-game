import {
  CardInstance,
  CardZone,
  DeckId,
  VanguardPlayerState,
  RearGuardSlots,
} from '../../shared/types';
import { getDeckComposition, getCardDefinition } from '../../shared/cardDatabase';

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface BuiltDeck {
  starterVanguard: CardInstance;
  mainDeck: CardInstance[]; // shuffled 49 cards
  allCards: CardInstance[];  // all 50 cards
}

export function buildDeck(deckId: DeckId, playerId: string): BuiltDeck {
  const composition = getDeckComposition(deckId);
  const allCards: CardInstance[] = [];
  let cardIndex = 0;

  // Create the starter vanguard
  const starterDef = getCardDefinition(composition.starterVanguardId);
  const starterVanguard: CardInstance = {
    instanceId: `${playerId}-card-${cardIndex++}`,
    cardId: starterDef.cardId,
    ownerId: playerId,
    zone: 'vanguard-circle',
    position: 'vanguard',
    isRested: false,
    isFaceUp: false, // starts face down
    turnPowerModifier: 0,
    turnCriticalModifier: 0,
    battlePowerModifier: 0,
    battleCriticalModifier: 0,
    continuousPowerModifier: 0,
    lostTwinDrive: false,
  };
  allCards.push(starterVanguard);

  // Create all main deck cards
  const mainDeckCards: CardInstance[] = [];
  for (const entry of composition.cards) {
    for (let i = 0; i < entry.count; i++) {
      const card: CardInstance = {
        instanceId: `${playerId}-card-${cardIndex++}`,
        cardId: entry.cardId,
        ownerId: playerId,
        zone: 'deck',
        isRested: false,
        isFaceUp: false,
        turnPowerModifier: 0,
        turnCriticalModifier: 0,
        battlePowerModifier: 0,
        battleCriticalModifier: 0,
        continuousPowerModifier: 0,
        lostTwinDrive: false,
      };
      mainDeckCards.push(card);
      allCards.push(card);
    }
  }

  // Shuffle the main deck
  const shuffledDeck = shuffle(mainDeckCards);

  return {
    starterVanguard,
    mainDeck: shuffledDeck,
    allCards,
  };
}

export function createInitialPlayerState(
  playerId: string,
  playerName: string,
  deckId: DeckId,
  builtDeck: BuiltDeck,
): VanguardPlayerState {
  const emptyRearGuards: RearGuardSlots = {
    'front-left': null,
    'front-right': null,
    'back-left': null,
    'back-center': null,
    'back-right': null,
  };

  return {
    id: playerId,
    name: playerName,
    deckId,
    deck: builtDeck.mainDeck.map(c => c.instanceId),
    hand: [],
    damageZone: [],
    dropZone: [],
    soul: [],
    vanguardCircle: builtDeck.starterVanguard.instanceId,
    rearGuards: emptyRearGuards,
    guardianCircle: [],
    triggerZone: null,
    hasRiddenThisTurn: false,
    isFirstTurn: false,
    mulliganComplete: false,
  };
}

export function reshuffleDeck(deck: string[]): string[] {
  return shuffle(deck);
}
