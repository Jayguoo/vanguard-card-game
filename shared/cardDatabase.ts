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
    abilityText: '[AUTO](VC/RC):[Counter Blast (1)] When this unit attacks, you may pay the cost. If you do, this unit gets [Power]+3000 until end of that battle.',
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
    abilityText: '[ACT](VC):[Counter Blast (2)] If you have a card named "Blaster Blade" in your soul, this unit gets [Power]+5000/[Critical]+1 until end of turn. [ACT](Hand):[Reveal this card to your opponent, and put it on top of your deck] Search your deck for up to one card named "Blaster Blade", reveal it to your opponent, put it into your hand, and shuffle your deck.',
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
    abilityText: '[AUTO]:[Counter Blast (2)] When this unit is placed on (VC), you may pay the cost. If you do, choose one of your opponent\'s rear-guards, and retire it. [AUTO]:[Counter Blast (2)] When this unit is placed on (RC), if you have a <Royal Paladin> vanguard, you may pay the cost. If you do, choose one of your opponent\'s grade 2 or greater rear-guards, and retire it.',
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
    abilityText: '[AUTO](VC):When this unit\'s drive check reveals a grade 3 <Royal Paladin>, this unit gets [Power]+5000 until end of that battle.',
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
    abilityText: '[AUTO](VC/RC):[Choose a card from your hand, and discard it] When this unit attacks, you may pay the cost. If you do, this unit gets [Power]+4000 until end of turn.',
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
    abilityText: '[AUTO](RC):During your main phase, when an opponent\'s rear-guard is put into the drop zone, this unit gets [Power]+3000 until end of turn.',
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
    shield: 5000,
    clan: 'kagero',
    race: 'Human',
    triggerType: 'draw',
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

  // ========== TD03 - Nova Grappler ==========

  'TD03/001': {
    cardId: 'TD03/001',
    name: 'Gold Rutile',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'nova-grappler',
    race: 'Battleroid',
    skillIcon: 'twin-drive',
    imageFile: 'TD03_001EN.png',
    imagePath: '/cards/td03/TD03_001EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC):When your rear-guard\'s attack hits a vanguard, choose a card from your damage zone, and turn it face up. [AUTO](VC):[Counter Blast (2)] When this unit\'s attack hits a vanguard, you may pay the cost. If you do, choose one of your <Nova Grappler> rear-guards, and [Stand] it.',
  },
  'TD03/002': {
    cardId: 'TD03/002',
    name: 'Death Metal Droid',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'nova-grappler',
    race: 'Battleroid',
    skillIcon: 'twin-drive',
    imageFile: 'TD03_002EN.png',
    imagePath: '/cards/td03/TD03_002EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):[Counter Blast (1)] When this unit attacks, you may pay the cost. If you do, this unit gets [Power]+3000 until end of that battle.',
  },
  'TD03/003': {
    cardId: 'TD03/003',
    name: 'Mr. Invincible',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'nova-grappler',
    race: 'Alien',
    skillIcon: 'twin-drive',
    imageFile: 'TD03_003EN.png',
    imagePath: '/cards/td03/TD03_003EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC):At the beginning of your main phase, Soul Charge (1), choose a card from your damage zone, and turn it face up. [AUTO](VC):[Soul Blast (8) & Counter Blast (5)] When this unit\'s attack hits a vanguard, you may pay the cost. If you do, [Stand] all of your units.',
  },
  'TD03/004': {
    cardId: 'TD03/004',
    name: 'King of Sword',
    grade: 2,
    power: 10000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Battleroid',
    skillIcon: 'intercept',
    imageFile: 'TD03_004EN.png',
    imagePath: '/cards/td03/TD03_004EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD03/005': {
    cardId: 'TD03/005',
    name: 'Super Electromagnetic Lifeform, Storm',
    grade: 2,
    power: 9000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Alien',
    skillIcon: 'intercept',
    imageFile: 'TD03_005EN.png',
    imagePath: '/cards/td03/TD03_005EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):When this unit\'s attack hits a vanguard, if you have a <Nova Grappler> vanguard, choose a card from your damage zone, and turn it face up.',
  },
  'TD03/006': {
    cardId: 'TD03/006',
    name: 'NGM Prototype',
    grade: 2,
    power: 8000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Battleroid',
    skillIcon: 'intercept',
    imageFile: 'TD03_006EN.png',
    imagePath: '/cards/td03/TD03_006EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:When this unit intercepts, if you have a <Nova Grappler> vanguard, this unit gets [Shield]+5000 until end of that battle.',
  },
  'TD03/007': {
    cardId: 'TD03/007',
    name: 'Tough Boy',
    grade: 1,
    power: 8000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Battleroid',
    skillIcon: 'boost',
    imageFile: 'TD03_007EN.png',
    imagePath: '/cards/td03/TD03_007EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD03/008': {
    cardId: 'TD03/008',
    name: 'Oasis Girl',
    grade: 1,
    power: 7000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Workeroid',
    skillIcon: 'boost',
    imageFile: 'TD03_008EN.png',
    imagePath: '/cards/td03/TD03_008EN.png',
    isStarterVanguard: false,
    abilityText: '[ACT](VC/RC):[Counter Blast (1)] This unit gets [Power]+1000 until end of turn.',
  },
  'TD03/009': {
    cardId: 'TD03/009',
    name: "Screamin' and Dancin' Announcer, Shout",
    grade: 1,
    power: 7000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Alien',
    skillIcon: 'boost',
    imageFile: 'TD03_009EN.png',
    imagePath: '/cards/td03/TD03_009EN.png',
    isStarterVanguard: false,
    abilityText: '[ACT](RC):[Rest this unit & Choose a card from your hand, and discard it] Draw a card.',
  },
  'TD03/010': {
    cardId: 'TD03/010',
    name: 'Queen of Heart',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Battleroid',
    skillIcon: 'boost',
    imageFile: 'TD03_010EN.png',
    imagePath: '/cards/td03/TD03_010EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](RC):When this unit boosts a unit named "King of Sword", the boosted unit gets [Power]+4000 until end of that battle.',
  },
  'TD03/011': {
    cardId: 'TD03/011',
    name: 'Battering Minotaur',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'nova-grappler',
    race: 'Warbeast',
    skillIcon: 'boost',
    imageFile: 'TD03_011EN.png',
    imagePath: '/cards/td03/TD03_011EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:When this unit attacks, this unit gets [Power]+3000 until end of that battle.',
  },
  'TD03/012': {
    cardId: 'TD03/012',
    name: 'Shining Lady',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'nova-grappler',
    race: 'Battleroid',
    triggerType: 'critical',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD03_012EN.png',
    imagePath: '/cards/td03/TD03_012EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD03/013': {
    cardId: 'TD03/013',
    name: 'Cannon Ball',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'nova-grappler',
    race: 'Battleroid',
    triggerType: 'stand',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD03_013EN.png',
    imagePath: '/cards/td03/TD03_013EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD03/014': {
    cardId: 'TD03/014',
    name: 'Ring Girl, Clara',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'nova-grappler',
    race: 'Workeroid',
    triggerType: 'heal',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD03_014EN.png',
    imagePath: '/cards/td03/TD03_014EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },
  'TD03/015': {
    cardId: 'TD03/015',
    name: 'Battleraizer',
    grade: 0,
    power: 3000,
    shield: 10000,
    clan: 'nova-grappler',
    race: 'Battleroid',
    triggerType: 'stand',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD03_015EN.png',
    imagePath: '/cards/td03/TD03_015EN.png',
    isStarterVanguard: true,
    abilityText: '[AUTO]:When another <Nova Grappler> rides this unit, you may call this card to (RC). [AUTO](RC):When this unit boosts, the boosted unit gets [Power]+3000 until end of that battle, and at the end of that battle, put this unit on the bottom of your deck.',
  },

  // ============================================
  // TD04 — Maiden Princess of the Cherry Blossoms (Oracle Think Tank)
  // ============================================

  // #1 — Oracle Guardian, Apollon (Grade 3)
  'TD04/001': {
    cardId: 'TD04/001',
    name: 'Oracle Guardian, Apollon',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'oracle-think-tank',
    race: 'Battleroid',
    skillIcon: 'twin-drive',
    imageFile: 'TD04_001EN.png',
    imagePath: '/cards/td04/TD04_001EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC):[CB(2)] When this unit\'s attack hits, draw 2 cards, return 1 to deck. [AUTO](RC):[CB(2)] When this unit\'s attack hits, draw a card.',
  },

  // #2 — Goddess of Flower Divination, Sakuya (Grade 3)
  'TD04/002': {
    cardId: 'TD04/002',
    name: 'Goddess of Flower Divination, Sakuya',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'oracle-think-tank',
    race: 'Noble',
    skillIcon: 'twin-drive',
    imageFile: 'TD04_002EN.png',
    imagePath: '/cards/td04/TD04_002EN.png',
    isStarterVanguard: false,
    abilityText: '[CONT](VC):During your turn, if hand is 4+, this unit gets +4000. [AUTO]:When placed on (VC), return all OTT rear-guards to hand.',
  },

  // #3 — Meteor Break Wizard (Grade 3)
  'TD04/003': {
    cardId: 'TD04/003',
    name: 'Meteor Break Wizard',
    grade: 3,
    power: 10000,
    shield: 0,
    clan: 'oracle-think-tank',
    race: 'Human',
    skillIcon: 'twin-drive',
    imageFile: 'TD04_003EN.png',
    imagePath: '/cards/td04/TD04_003EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):[CB(1)] When this unit attacks, you may pay the cost. If you do, this unit gets +3000 until end of that battle.',
  },

  // #4 — Oracle Guardian, Wiseman (Grade 2)
  'TD04/004': {
    cardId: 'TD04/004',
    name: 'Oracle Guardian, Wiseman',
    grade: 2,
    power: 10000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'Battleroid',
    skillIcon: 'intercept',
    imageFile: 'TD04_004EN.png',
    imagePath: '/cards/td04/TD04_004EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },

  // #5 — Security Guardian (Grade 2)
  'TD04/005': {
    cardId: 'TD04/005',
    name: 'Security Guardian',
    grade: 2,
    power: 8000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'Battleroid',
    skillIcon: 'intercept',
    imageFile: 'TD04_005EN.png',
    imagePath: '/cards/td04/TD04_005EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:When this unit intercepts, if you have an OTT vanguard, this unit gets Shield+5000.',
  },

  // #6 — Sword Dancer Angel (Grade 2)
  'TD04/006': {
    cardId: 'TD04/006',
    name: 'Sword Dancer Angel',
    grade: 2,
    power: 8000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'Angel',
    skillIcon: 'intercept',
    imageFile: 'TD04_006EN.png',
    imagePath: '/cards/td04/TD04_006EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):When you draw a card, this unit gets +1000 until end of turn.',
  },

  // #7 — Oracle Guardian, Gemini (Grade 1)
  'TD04/007': {
    cardId: 'TD04/007',
    name: 'Oracle Guardian, Gemini',
    grade: 1,
    power: 8000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'Battleroid',
    skillIcon: 'boost',
    imageFile: 'TD04_007EN.png',
    imagePath: '/cards/td04/TD04_007EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },

  // #8 — Dark Cat (Grade 1)
  'TD04/008': {
    cardId: 'TD04/008',
    name: 'Dark Cat',
    grade: 1,
    power: 7000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'High Beast',
    skillIcon: 'boost',
    imageFile: 'TD04_008EN.png',
    imagePath: '/cards/td04/TD04_008EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:When this unit is placed on (VC) or (RC), if you have an OTT vanguard, each player may draw a card.',
  },

  // #9 — Weather Girl, Milk (Grade 1)
  'TD04/009': {
    cardId: 'TD04/009',
    name: 'Weather Girl, Milk',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'Sylph',
    skillIcon: 'boost',
    imageFile: 'TD04_009EN.png',
    imagePath: '/cards/td04/TD04_009EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](RC):When this unit boosts an OTT vanguard, if hand is 4+, the boosted unit gets +4000.',
  },

  // #10 — Battle Sister, Maple (Grade 1)
  'TD04/010': {
    cardId: 'TD04/010',
    name: 'Battle Sister, Maple',
    grade: 1,
    power: 6000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'Elf',
    skillIcon: 'boost',
    imageFile: 'TD04_010EN.png',
    imagePath: '/cards/td04/TD04_010EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO](VC/RC):When this unit attacks, if hand is 4+, this unit gets +3000 until end of that battle.',
  },

  // #11 — Luck Bird (Grade 1)
  'TD04/011': {
    cardId: 'TD04/011',
    name: 'Luck Bird',
    grade: 1,
    power: 5000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'High Beast',
    skillIcon: 'boost',
    imageFile: 'TD04_011EN.png',
    imagePath: '/cards/td04/TD04_011EN.png',
    isStarterVanguard: false,
    abilityText: '[AUTO]:[SB(2)] When this unit is placed on (RC), if you have an OTT vanguard, you may pay the cost. If you do, draw a card.',
  },

  // #12 — Oracle Guardian, Nike (Grade 0 — Critical Trigger)
  'TD04/012': {
    cardId: 'TD04/012',
    name: 'Oracle Guardian, Nike',
    grade: 0,
    power: 5000,
    shield: 10000,
    clan: 'oracle-think-tank',
    race: 'Battleroid',
    triggerType: 'critical',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD04_012EN.png',
    imagePath: '/cards/td04/TD04_012EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },

  // #13 — Dream Eater (Grade 0 — Draw Trigger)
  'TD04/013': {
    cardId: 'TD04/013',
    name: 'Dream Eater',
    grade: 0,
    power: 5000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'High Beast',
    triggerType: 'draw',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD04_013EN.png',
    imagePath: '/cards/td04/TD04_013EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },

  // #14 — Victory Maker (Grade 0 — Draw Trigger)
  'TD04/014': {
    cardId: 'TD04/014',
    name: 'Victory Maker',
    grade: 0,
    power: 5000,
    shield: 5000,
    clan: 'oracle-think-tank',
    race: 'High Beast',
    triggerType: 'draw',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD04_014EN.png',
    imagePath: '/cards/td04/TD04_014EN.png',
    isStarterVanguard: false,
    abilityText: '',
  },

  // #15 — Lozenge Magus (Grade 0 — Heal Trigger, FVG)
  'TD04/015': {
    cardId: 'TD04/015',
    name: 'Lozenge Magus',
    grade: 0,
    power: 3000,
    shield: 10000,
    clan: 'oracle-think-tank',
    race: 'Elf',
    triggerType: 'heal',
    triggerPower: 5000,
    skillIcon: 'boost',
    imageFile: 'TD04_015EN.png',
    imagePath: '/cards/td04/TD04_015EN.png',
    isStarterVanguard: true,
    abilityText: '[AUTO]:When another <Oracle Think Tank> rides this unit, you may call this card to (RC). [AUTO](RC):When this unit boosts, the boosted unit gets [Power]+3000 until end of that battle, and at the beginning of the end phase, return this unit to your deck and shuffle.',
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
      { cardId: 'TD01/001', count: 4 }, // Crimson Butterfly, Brigitte
      { cardId: 'TD01/002', count: 1 }, // Knight of Conviction, Bors
      { cardId: 'TD01/003', count: 2 }, // Solitary Knight, Gancelot

      // Grade 2 (12 cards)
      { cardId: 'TD01/004', count: 4 }, // Knight of Silence, Gallatin
      { cardId: 'TD01/005', count: 1 }, // Blaster Blade
      { cardId: 'TD01/006', count: 3 }, // Knight of the Harp, Tristan
      { cardId: 'TD01/007', count: 4 }, // Covenant Knight, Randolf

      // Grade 1 (14 cards)
      { cardId: 'TD01/008', count: 4 }, // Little Sage, Marron
      { cardId: 'TD01/009', count: 2 }, // Wingal
      { cardId: 'TD01/010', count: 4 }, // Starlight Unicorn
      { cardId: 'TD01/011', count: 4 }, // Knight of Rose, Morgana

      // Grade 0 triggers (16 cards)
      { cardId: 'TD01/013', count: 4 }, // Bringer of Good Luck, Epona (Critical)
      { cardId: 'TD01/014', count: 4 }, // Yggdrasil Maiden, Elaine (Heal)
      { cardId: 'TD01/015', count: 4 }, // Weapons Dealer, Govannon (Draw)
      { cardId: 'TD01/016', count: 4 }, // Flogal (Stand)
      // Total: 7 + 12 + 14 + 16 = 49 in deck + 1 starter = 50
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
      { cardId: 'TD02/002', count: 1 }, // Dragon Monk, Goku
      { cardId: 'TD02/003', count: 4 }, // Demonic Dragon Berserker, Yaksha

      // Grade 2 (12 cards)
      { cardId: 'TD02/004', count: 4 }, // Dragon Knight, Nehalem
      { cardId: 'TD02/005', count: 4 }, // Berserk Dragon
      { cardId: 'TD02/006', count: 4 }, // Wyvern Strike, Tejas

      // Grade 1 (14 cards)
      { cardId: 'TD02/007', count: 4 }, // Embodiment of Armor, Bahr
      { cardId: 'TD02/008', count: 2 }, // Dragon Monk, Gojo
      { cardId: 'TD02/009', count: 4 }, // Flame of Hope, Aermo
      { cardId: 'TD02/010', count: 2 }, // Demonic Dragon Madonna, Joka
      { cardId: 'TD02/011', count: 2 }, // Wyvern Strike, Jarran

      // Grade 0 triggers (16 cards)
      { cardId: 'TD02/013', count: 4 }, // Dragon Dancer, Monica (Draw)
      { cardId: 'TD02/014', count: 4 }, // Lizard Soldier, Ganlu (Stand)
      { cardId: 'TD02/015', count: 4 }, // Dragon Monk, Genjo (Heal)
      { cardId: 'TD02/016', count: 4 }, // Demonic Dragon Mage, Rakshasa (Critical)
      // Total: 7 + 12 + 14 + 16 = 49 in deck + 1 starter = 50
    ],
  },

  'td03-gold-rutile': {
    deckId: 'td03-gold-rutile',
    name: 'Gold Rutile Trial Deck',
    clan: 'nova-grappler',
    clanDisplay: 'Nova Grappler',
    description: 'Stand up and fight again! The golden machines never stay down!',
    coverCardId: 'TD03/001', // Gold Rutile
    starterVanguardId: 'TD03/015', // Battleraizer
    cards: [
      // Grade 3 (7 cards)
      { cardId: 'TD03/001', count: 1 }, // Gold Rutile
      { cardId: 'TD03/002', count: 2 }, // Death Metal Droid
      { cardId: 'TD03/003', count: 4 }, // Mr. Invincible

      // Grade 2 (10 cards)
      { cardId: 'TD03/004', count: 4 }, // King of Sword
      { cardId: 'TD03/005', count: 2 }, // Super Electromagnetic Lifeform, Storm
      { cardId: 'TD03/006', count: 4 }, // NGM Prototype

      // Grade 1 (17 cards)
      { cardId: 'TD03/007', count: 4 }, // Tough Boy
      { cardId: 'TD03/008', count: 4 }, // Oasis Girl
      { cardId: 'TD03/009', count: 4 }, // Screamin' and Dancin' Announcer, Shout
      { cardId: 'TD03/010', count: 3 }, // Queen of Heart
      { cardId: 'TD03/011', count: 2 }, // Battering Minotaur

      // Grade 0 triggers (15 cards — 1 Battleraizer is the starter)
      { cardId: 'TD03/012', count: 4 }, // Shining Lady (Critical)
      { cardId: 'TD03/013', count: 4 }, // Cannon Ball (Stand)
      { cardId: 'TD03/014', count: 4 }, // Ring Girl, Clara (Heal)
      { cardId: 'TD03/015', count: 3 }, // Battleraizer (Stand) — 1 copy is starter VG
      // Total: 7 + 10 + 17 + 15 = 49 in deck + 1 starter = 50
    ],
  },

  'td04-sakuya': {
    deckId: 'td04-sakuya',
    name: 'Sakuya Trial Deck',
    clan: 'oracle-think-tank',
    clanDisplay: 'Oracle Think Tank',
    description: 'Divine wisdom and foresight guide the maiden princess of cherry blossoms!',
    coverCardId: 'TD04/002', // Sakuya
    starterVanguardId: 'TD04/015', // Lozenge Magus
    cards: [
      // Grade 3 (7 cards)
      { cardId: 'TD04/001', count: 4 }, // Oracle Guardian, Apollon
      { cardId: 'TD04/002', count: 1 }, // Goddess of Flower Divination, Sakuya
      { cardId: 'TD04/003', count: 2 }, // Meteor Break Wizard

      // Grade 2 (10 cards)
      { cardId: 'TD04/004', count: 4 }, // Oracle Guardian, Wiseman
      { cardId: 'TD04/005', count: 4 }, // Security Guardian
      { cardId: 'TD04/006', count: 2 }, // Sword Dancer Angel

      // Grade 1 (17 cards)
      { cardId: 'TD04/007', count: 4 }, // Oracle Guardian, Gemini
      { cardId: 'TD04/008', count: 4 }, // Dark Cat
      { cardId: 'TD04/009', count: 4 }, // Weather Girl, Milk
      { cardId: 'TD04/010', count: 2 }, // Battle Sister, Maple
      { cardId: 'TD04/011', count: 3 }, // Luck Bird

      // Grade 0 triggers (15 cards — 1 Lozenge Magus is the starter)
      { cardId: 'TD04/012', count: 4 }, // Oracle Guardian, Nike (Critical)
      { cardId: 'TD04/013', count: 4 }, // Dream Eater (Draw)
      { cardId: 'TD04/014', count: 4 }, // Victory Maker (Draw)
      { cardId: 'TD04/015', count: 3 }, // Lozenge Magus (Heal) — 1 copy is starter VG
      // Total: 7 + 10 + 17 + 15 = 49 in deck + 1 starter = 50
    ],
  },
};

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
  // Most decks have 16 triggers, but some (like TD03) have a trigger unit as the starter VG,
  // so the main deck only has 15 triggers.
  const starterDef = getCardDefinition(comp.starterVanguardId);
  const expectedTriggers = starterDef.triggerType ? 15 : 16;
  if (triggerCount !== expectedTriggers) {
    console.error(`Deck ${deckId}: Expected ${expectedTriggers} triggers, got ${triggerCount}`);
    return false;
  }
  return true;
}
