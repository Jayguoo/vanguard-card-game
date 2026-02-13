import { CardDefinition, DeckComposition, DeckId } from './types';

// ============================================
// TD01 - BLASTER BLADE TRIAL DECK (Royal Paladin)
// ============================================
// TD02 - DRAGONIC OVERLORD TRIAL DECK (Kagero)
// ============================================

export const CARD_DATABASE: Record<string, CardDefinition> = {
  // ========== TD01 - Royal Paladin ==========

  'TD01/001': {
    cardId: 'TD01/001',
    name: 'Crimson Butterfly, Brigitte',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'twin-drive',
    imageFile: 'TD01_001EN.png',
    imagePath: '/cards/td01/TD01_001EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC):When this unit\'s drive check reveals a grade 3 <Royal Paladin>, this unit gets [Power]+5000 until end of that battle.',
  },
  'TD01/002': {
    cardId: 'TD01/002',
    name: 'Knight of Conviction, Bors',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'twin-drive',
    imageFile: 'TD01_002EN.png',
    imagePath: '/cards/td01/TD01_002EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):When this unit attacks, you may pay the cost. If you do, this unit gets [Power]+3000 until end of that battle.',
  },
  'TD01/003': {
    cardId: 'TD01/003',
    name: 'Solitary Knight, Gancelot',
    grade: 3,
    power: 9000,
    shield: 0,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'twin-drive',
    imageFile: 'TD01_003EN.png',
    imagePath: '/cards/td01/TD01_003EN.png',
    isStarterVanguard: false,
    abilityText: '[CONT](VC):If you have a card named "Blaster Blade" in your soul, this unit gets [Power]+5000. [AUTO]:When this card is placed on (VC), search your deck for up to one card named "Blaster Blade", reveal it to your opponent, put it into your hand, and shuffle your deck.',
  },
  'TD01/004': {
    cardId: 'TD01/004',
    name: 'Knight of Silence, Gallatin',
    grade: 2,
    power: 10000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'intercept',
    imageFile: 'TD01_004EN.png',
    imagePath: '/cards/td01/TD01_004EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD01/005': {
    cardId: 'TD01/005',
    name: 'Blaster Blade',
    grade: 2,
    power: 9000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'intercept',
    imageFile: 'TD01_005EN.png',
    imagePath: '/cards/td01/TD01_005EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:[Counter Blast (2)] When this unit is placed on (VC) or (RC), if you have a <Royal Paladin> vanguard, you may pay the cost. If you do, choose an opponent\'s grade 2 or greater rear-guard, and retire it.',
  },
  'TD01/006': {
    cardId: 'TD01/006',
    name: 'Knight of the Harp, Tristan',
    grade: 2,
    power: 8000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'intercept',
    imageFile: 'TD01_006EN.png',
    imagePath: '/cards/td01/TD01_006EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):When this unit\'s drive check reveals a grade 3 <Royal Paladin>, this unit gets [Power]+5000 until end of that battle.',
  },
  'TD01/007': {
    cardId: 'TD01/007',
    name: 'Covenant Knight, Randolf',
    grade: 2,
    power: 8000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'intercept',
    imageFile: 'TD01_007EN.png',
    imagePath: '/cards/td01/TD01_007EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):When this unit attacks, if the number of cards in your hand is greater than your opponent\'s, this unit gets [Power]+3000 until end of that battle.',
  },
  'TD01/008': {
    cardId: 'TD01/008',
    name: 'Little Sage, Marron',
    grade: 1,
    power: 8000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'boost',
    imageFile: 'TD01_008EN.png',
    imagePath: '/cards/td01/TD01_008EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD01/009': {
    cardId: 'TD01/009',
    name: 'Wingal',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'High Beast',
    skillIcon: 'boost',
    imageFile: 'TD01_009EN.png',
    imagePath: '/cards/td01/TD01_009EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](RC):When this unit boosts a unit named "Blaster Blade", the boosted unit gets [Power]+4000 until end of that battle.',
  },
  'TD01/010': {
    cardId: 'TD01/010',
    name: 'Starlight Unicorn',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'High Beast',
    skillIcon: 'boost',
    imageFile: 'TD01_010EN.png',
    imagePath: '/cards/td01/TD01_010EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:When this unit is placed on (RC), choose another of your <Royal Paladin>, and that unit gets [Power]+2000 until end of turn.',
  },
  'TD01/011': {
    cardId: 'TD01/011',
    name: 'Knight of Rose, Morgana',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'Human',
    skillIcon: 'boost',
    imageFile: 'TD01_011EN.png',
    imagePath: '/cards/td01/TD01_011EN.png',
    isStarterVanguard: false,
    abilityText: '[ACT](RC):[Choose a card from your hand, and discard it] When this unit attacks, you may pay the cost. If you do, this unit gets [Power]+4000 until end of turn.',
  },
  'TD01/012': {
    cardId: 'TD01/012',
    name: 'Stardust Trumpeter',
    grade: 0,
    power: 6000,
    shield: 10000,
    clan: 'royal-paladin',
    race: 'Angel',
    skillIcon: 'boost',
    imageFile: 'TD01_012EN.png',
    imagePath: '/cards/td01/TD01_012EN.png',
    isStarterVanguard: true,
    abilityText: '',
  },
  'TD01/013': {
    cardId: 'TD01/013',
    name: 'Bringer of Good Luck, Epona',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'royal-paladin',
    race: 'Human',
    triggerType: 'critical',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD01_013EN.png',
    imagePath: '/cards/td01/TD01_013EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD01/014': {
    cardId: 'TD01/014',
    name: 'Yggdrasil Maiden, Elaine',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'royal-paladin',
    race: 'High Beast',
    triggerType: 'heal',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD01_014EN.png',
    imagePath: '/cards/td01/TD01_014EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD01/015': {
    cardId: 'TD01/015',
    name: 'Weapons Dealer, Govannon',
    grade: 0,
    power: 5000,
    shield: 5000,
    clan: 'royal-paladin',
    race: 'Giant',
    triggerType: 'draw',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD01_015EN.png',
    imagePath: '/cards/td01/TD01_015EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD01/016': {
    cardId: 'TD01/016',
    name: 'Flogal',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'royal-paladin',
    race: 'High Beast',
    triggerType: 'stand',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD01_016EN.png',
    imagePath: '/cards/td01/TD01_016EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },

  // ========== TD02 - Kagero ==========

  'TD02/001': {
    cardId: 'TD02/001',
    name: 'Dragonic Overlord',
    grade: 3,
    power: 11000,
    shield: 0,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'twin-drive',
    imageFile: 'TD02_001EN.png',
    imagePath: '/cards/td02/TD02_001EN.png',
    isStarterVanguard: false,
    abilityText: '[ACT](VC/RC):[Counter Blast (3)] If you do not have another <Kagero> vanguard or rear-guard, this unit gets [Power]+5000/[Critical]+1 until end of turn. [AUTO](VC/RC):When this unit\'s attack hits an opponent\'s rear-guard, [Stand] this unit and lose "Twin Drive!!".',
  },
  'TD02/002': {
    cardId: 'TD02/002',
    name: 'Dragon Monk, Goku',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'twin-drive',
    imageFile: 'TD02_002EN.png',
    imagePath: '/cards/td02/TD02_002EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC):When this unit\'s drive check reveals a grade 3 <Kagero>, choose an opponent\'s grade 1 or less rear-guard, and retire it.',
  },
  'TD02/003': {
    cardId: 'TD02/003',
    name: 'Demonic Dragon Berserker, Yaksha',
    grade: 3,
    power: 9000,
    shield: 0,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'twin-drive',
    imageFile: 'TD02_003EN.png',
    imagePath: '/cards/td02/TD02_003EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:During your main phase, when an opponent\'s rear-guard is put into the drop zone, if you have a grade 2 vanguard, you may reveal this card. If you do, ride this card.',
  },
  'TD02/004': {
    cardId: 'TD02/004',
    name: 'Dragon Knight, Nehalem',
    grade: 2,
    power: 10000,
    shield: 5000,
    clan: 'kagero',
    race: 'Human',
    skillIcon: 'intercept',
    imageFile: 'TD02_004EN.png',
    imagePath: '/cards/td02/TD02_004EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD02/005': {
    cardId: 'TD02/005',
    name: 'Berserk Dragon',
    grade: 2,
    power: 9000,
    shield: 5000,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'intercept',
    imageFile: 'TD02_005EN.png',
    imagePath: '/cards/td02/TD02_005EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:[Counter Blast (2)] When this unit is placed on (VC) or (RC), if you have a <Kagero> vanguard, you may pay the cost. If you do, choose an opponent\'s grade 2 or less rear-guard, and retire it.',
  },
  'TD02/006': {
    cardId: 'TD02/006',
    name: 'Wyvern Strike, Tejas',
    grade: 2,
    power: 8000,
    shield: 5000,
    clan: 'kagero',
    race: 'Winged Dragon',
    skillIcon: 'intercept',
    imageFile: 'TD02_006EN.png',
    imagePath: '/cards/td02/TD02_006EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):If this unit would attack, it may instead attack an opponent\'s unit in the back row of the same column as this unit.',
  },
  'TD02/007': {
    cardId: 'TD02/007',
    name: 'Embodiment of Armor, Bahr',
    grade: 1,
    power: 8000,
    shield: 5000,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'boost',
    imageFile: 'TD02_007EN.png',
    imagePath: '/cards/td02/TD02_007EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD02/008': {
    cardId: 'TD02/008',
    name: 'Dragon Monk, Gojo',
    grade: 1,
    power: 7000,
    shield: 5000,
    clan: 'kagero',
    race: 'Human',
    skillIcon: 'boost',
    imageFile: 'TD02_008EN.png',
    imagePath: '/cards/td02/TD02_008EN.png',
    isStarterVanguard: false,
    abilityText: '[ACT](RC):[Put this unit into soul & Choose a card from your hand, and discard it] Draw a card.',
  },
  'TD02/009': {
    cardId: 'TD02/009',
    name: 'Flame of Hope, Aermo',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'boost',
    imageFile: 'TD02_009EN.png',
    imagePath: '/cards/td02/TD02_009EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](RC):[Choose a card from your hand, and discard it] When an attack hits during the battle that this unit boosted, you may pay the cost. If you do, draw a card.',
  },
  'TD02/010': {
    cardId: 'TD02/010',
    name: 'Demonic Dragon Madonna, Joka',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'boost',
    imageFile: 'TD02_010EN.png',
    imagePath: '/cards/td02/TD02_010EN.png',
    isStarterVanguard: false,
    abilityText: '[ACT](RC):During your main phase, when an opponent\'s rear-guard is put into the drop zone, this unit gets [Power]+3000 until end of turn.',
  },
  'TD02/011': {
    cardId: 'TD02/011',
    name: 'Wyvern Strike, Jarran',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'kagero',
    race: 'Winged Dragon',
    skillIcon: 'boost',
    imageFile: 'TD02_011EN.png',
    imagePath: '/cards/td02/TD02_011EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](RC):When this unit boosts a unit named "Wyvern Strike, Tejas", the boosted unit gets [Power]+4000 until end of that battle.',
  },
  'TD02/012': {
    cardId: 'TD02/012',
    name: 'Lizard Runner, Undeux',
    grade: 0,
    power: 6000,
    shield: 10000,
    clan: 'kagero',
    race: 'Flame Dragon',
    skillIcon: 'boost',
    imageFile: 'TD02_012EN.png',
    imagePath: '/cards/td02/TD02_012EN.png',
    isStarterVanguard: true,
    abilityText: '',
  },
  'TD02/013': {
    cardId: 'TD02/013',
    name: 'Dragon Dancer, Monica',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'kagero',
    race: 'Human',
    triggerType: 'critical',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD02_013EN.png',
    imagePath: '/cards/td02/TD02_013EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD02/014': {
    cardId: 'TD02/014',
    name: 'Lizard Soldier, Ganlu',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'kagero',
    race: 'Flame Dragon',
    triggerType: 'stand',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD02_014EN.png',
    imagePath: '/cards/td02/TD02_014EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD02/015': {
    cardId: 'TD02/015',
    name: 'Dragon Monk, Genjo',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'kagero',
    race: 'Human',
    triggerType: 'heal',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD02_015EN.png',
    imagePath: '/cards/td02/TD02_015EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD02/016': {
    cardId: 'TD02/016',
    name: 'Demonic Dragon Mage, Rakshasa',
    grade: 0,
    power: 3000,
    shield: 10000,
    clan: 'kagero',
    race: 'Flame Dragon',
    triggerType: 'critical',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD02_016EN.png',
    imagePath: '/cards/td02/TD02_016EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](RC):During your main phase, when an opponent\'s rear-guard is put into the drop zone, this unit gets [Power]+3000 until end of turn.',
  },
};

// ============================================
// DECK COMPOSITIONS
// ============================================
// Each trial deck is 50 cards total:
// 1 starter vanguard (Grade 0, placed on VC at game start)
// 49 cards in the main deck (including 16 triggers)

export const DECK_COMPOSITIONS: Record<DeckId, DeckComposition> = {
  'td01-blaster-blade': {
    deckId: 'td01-blaster-blade',
    name: 'Blaster Blade Trial Deck',
    clan: 'royal-paladin',
    clanDisplay: 'Royal Paladin',
    description: 'The knights of the sanctuary rally behind the legendary Blaster Blade!',
    coverCardId: 'TD01/005', // Blaster Blade
    starterVanguardId: 'TD01/012', // Stardust Trumpeter
    cards: [
      // Grade 3 (7 cards)
      { cardId: 'TD01/001', count: 2 }, // Crimson Butterfly, Brigitte
      { cardId: 'TD01/002', count: 3 }, // Knight of Conviction, Bors
      { cardId: 'TD01/003', count: 2 }, // Solitary Knight, Gancelot

      // Grade 2 (11 cards)
      { cardId: 'TD01/004', count: 3 }, // Knight of Silence, Gallatin
      { cardId: 'TD01/005', count: 3 }, // Blaster Blade
      { cardId: 'TD01/006', count: 3 }, // Knight of the Harp, Tristan
      { cardId: 'TD01/007', count: 2 }, // Covenant Knight, Randolf

      // Grade 1 (15 cards)
      { cardId: 'TD01/008', count: 4 }, // Little Sage, Marron
      { cardId: 'TD01/009', count: 3 }, // Wingal
      { cardId: 'TD01/010', count: 4 }, // Starlight Unicorn
      { cardId: 'TD01/011', count: 4 }, // Knight of Rose, Morgana

      // Grade 0 triggers (16 cards)
      { cardId: 'TD01/013', count: 4 }, // Bringer of Good Luck, Epona (Critical)
      { cardId: 'TD01/014', count: 4 }, // Yggdrasil Maiden, Elaine (Heal)
      { cardId: 'TD01/015', count: 4 }, // Weapons Dealer, Govannon (Draw)
      { cardId: 'TD01/016', count: 4 }, // Flogal (Stand)
      // Total: 7 + 11 + 15 + 16 = 49 in deck + 1 starter = 50
    ],
  },

  'td02-dragonic-overlord': {
    deckId: 'td02-dragonic-overlord',
    name: 'Dragonic Overlord Trial Deck',
    clan: 'kagero',
    clanDisplay: 'Kagero',
    description: 'Unleash the flames of the apocalypse with Dragonic Overlord!',
    coverCardId: 'TD02/001', // Dragonic Overlord
    starterVanguardId: 'TD02/012', // Lizard Runner, Undeux
    cards: [
      // Grade 3 (7 cards)
      { cardId: 'TD02/001', count: 2 }, // Dragonic Overlord
      { cardId: 'TD02/002', count: 3 }, // Dragon Monk, Goku
      { cardId: 'TD02/003', count: 2 }, // Demonic Dragon Berserker, Yaksha

      // Grade 2 (11 cards)
      { cardId: 'TD02/004', count: 3 }, // Dragon Knight, Nehalem
      { cardId: 'TD02/005', count: 3 }, // Berserk Dragon
      { cardId: 'TD02/006', count: 3 }, // Wyvern Strike, Tejas
      // Add 2 more G2 to make 11 - use Nehalem extras
      // Actually let me make it: 4 Nehalem + 3 Berserk + 2 Tejas = 9, need 2 more
      // Trial decks typically use the cards they have. Let's adjust:

      // Grade 1 (15 cards)
      { cardId: 'TD02/007', count: 4 }, // Embodiment of Armor, Bahr
      { cardId: 'TD02/008', count: 3 }, // Dragon Monk, Gojo
      { cardId: 'TD02/009', count: 3 }, // Flame of Hope, Aermo
      { cardId: 'TD02/010', count: 2 }, // Demonic Dragon Madonna, Joka
      { cardId: 'TD02/011', count: 3 }, // Wyvern Strike, Jarran

      // Grade 0 triggers (16 cards)
      { cardId: 'TD02/013', count: 4 }, // Dragon Dancer, Monica (Critical)
      { cardId: 'TD02/014', count: 4 }, // Lizard Soldier, Ganlu (Stand)
      { cardId: 'TD02/015', count: 4 }, // Dragon Monk, Genjo (Heal)
      { cardId: 'TD02/016', count: 4 }, // Demonic Dragon Mage, Rakshasa (Critical)
      // Total: 7 + 9 + 15 + 16 = 47... need 49. Adjust G2 to 11:
    ],
  },
};

// Fix TD02 G2 counts to ensure 49 cards in main deck
// G3: 7, G2: 11, G1: 15, G0 triggers: 16 = 49
DECK_COMPOSITIONS['td02-dragonic-overlord'].cards = [
  // Grade 3 (7 cards)
  { cardId: 'TD02/001', count: 2 }, // Dragonic Overlord
  { cardId: 'TD02/002', count: 3 }, // Dragon Monk, Goku
  { cardId: 'TD02/003', count: 2 }, // Demonic Dragon Berserker, Yaksha

  // Grade 2 (11 cards)
  { cardId: 'TD02/004', count: 4 }, // Dragon Knight, Nehalem
  { cardId: 'TD02/005', count: 4 }, // Berserk Dragon
  { cardId: 'TD02/006', count: 3 }, // Wyvern Strike, Tejas

  // Grade 1 (15 cards)
  { cardId: 'TD02/007', count: 4 }, // Embodiment of Armor, Bahr
  { cardId: 'TD02/008', count: 3 }, // Dragon Monk, Gojo
  { cardId: 'TD02/009', count: 3 }, // Flame of Hope, Aermo
  { cardId: 'TD02/010', count: 2 }, // Demonic Dragon Madonna, Joka
  { cardId: 'TD02/011', count: 3 }, // Wyvern Strike, Jarran

  // Grade 0 triggers (16 cards)
  { cardId: 'TD02/013', count: 4 }, // Dragon Dancer, Monica (Critical)
  { cardId: 'TD02/014', count: 4 }, // Lizard Soldier, Ganlu (Stand)
  { cardId: 'TD02/015', count: 4 }, // Dragon Monk, Genjo (Heal)
  { cardId: 'TD02/016', count: 4 }, // Demonic Dragon Mage, Rakshasa (Critical)
  // Total: 7 + 11 + 15 + 16 = 49 in deck + 1 starter = 50
];

// Helper to get a card definition by ID
export function getCardDefinition(cardId: string): CardDefinition {
  const def = CARD_DATABASE[cardId];
  if (!def) {
    throw new Error(`Card not found: ${cardId}`);
  }
  return def;
}

// Helper to get deck composition
export function getDeckComposition(deckId: DeckId): DeckComposition {
  const comp = DECK_COMPOSITIONS[deckId];
  if (!comp) {
    throw new Error(`Deck not found: ${deckId}`);
  }
  return comp;
}

// Validate deck composition totals
export function validateDeckComposition(deckId: DeckId): boolean {
  const comp = getDeckComposition(deckId);
  const totalCards = comp.cards.reduce((sum, c) => sum + c.count, 0);
  const triggerCount = comp.cards.reduce((sum, c) => {
    const def = getCardDefinition(c.cardId);
    return sum + (def.triggerType ? c.count : 0);
  }, 0);

  if (totalCards !== 49) {
    console.error(`Deck ${deckId}: Expected 49 cards in main deck, got ${totalCards}`);
    return false;
  }
  if (triggerCount !== 16) {
    console.error(`Deck ${deckId}: Expected 16 triggers, got ${triggerCount}`);
    return false;
  }
  return true;
}
