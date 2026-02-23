import {
  CardInstance,
  CardZone,
  DeckId,
  CustomDeckComposition,
  VanguardPlayerState,
  RearGuardSlots,
} from '../../shared/types';
import { getDeckComposition, getCardDefinition, CARD_DATABASE } from '../../shared/cardDatabase';

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

export function validateCustomDeck(deck: CustomDeckComposition): string | null {
  // Check starter vanguard — any grade 0 non-trigger card is valid
  const starterDef = CARD_DATABASE[deck.starterVanguardId];
  if (!starterDef) return `Unknown starter card: ${deck.starterVanguardId}`;
  if (starterDef.grade !== 0) return `Starter vanguard must be Grade 0`;
  if (starterDef.triggerType) return `${starterDef.name} is a trigger unit and cannot be a starter vanguard`;

  // Check main deck total
  const total = deck.cards.reduce((sum, e) => sum + e.count, 0);
  if (total !== 49) return `Main deck must have exactly 49 cards (has ${total})`;

  // Check each card exists and max 4 copies
  for (const entry of deck.cards) {
    const def = CARD_DATABASE[entry.cardId];
    if (!def) return `Unknown card: ${entry.cardId}`;
    if (entry.count < 1 || entry.count > 4) return `${def.name}: must have 1-4 copies (has ${entry.count})`;
  }

  // Check trigger count
  const starterIsTrigger = !!starterDef.triggerType;
  const expectedTriggers = starterIsTrigger ? 15 : 16;
  let triggerCount = 0;
  let healCount = 0;
  for (const entry of deck.cards) {
    const def = CARD_DATABASE[entry.cardId];
    if (def.triggerType) {
      triggerCount += entry.count;
      if (def.triggerType === 'heal') healCount += entry.count;
    }
  }
  if (triggerCount !== expectedTriggers) return `Must have exactly ${expectedTriggers} trigger units (has ${triggerCount})`;
  if (healCount > 4) return `Maximum 4 heal triggers (has ${healCount})`;

  return null;
}

export function buildDeckFromCustom(deck: CustomDeckComposition, playerId: string): BuiltDeck {
  const allCards: CardInstance[] = [];
  let cardIndex = 0;

  const starterDef = CARD_DATABASE[deck.starterVanguardId];
  const starterVanguard: CardInstance = {
    instanceId: `${playerId}-card-${cardIndex++}`,
    cardId: starterDef.cardId,
    ownerId: playerId,
    zone: 'vanguard-circle',
    position: 'vanguard',
    isRested: false,
    isFaceUp: false,
    turnPowerModifier: 0,
    turnCriticalModifier: 0,
    battlePowerModifier: 0,
    battleCriticalModifier: 0,
    continuousPowerModifier: 0,
    lostTwinDrive: false,
  };
  allCards.push(starterVanguard);

  const mainDeckCards: CardInstance[] = [];
  for (const entry of deck.cards) {
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

  const shuffledDeck = shuffle(mainDeckCards);
  return { starterVanguard, mainDeck: shuffledDeck, allCards };
}

export function createInitialPlayerState(
  playerId: string,
  playerName: string,
  deckId: DeckId | 'custom',
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
