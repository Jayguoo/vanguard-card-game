// ============================================
// ABILITY DEFINITIONS FOR ALL TRIAL DECK CARDS
// ============================================
// Structured data describing every card ability.
// The server ability engine reads these to decide
// when / how to fire each ability at runtime.
// ============================================

import { Clan, Grade } from './types';

// ---- Enums / literal unions ----

export type AbilityTiming = 'AUTO' | 'ACT' | 'CONT';

/**
 * Events that can trigger an AUTO ability.
 * ACT abilities use 'mainPhaseACT'.
 * CONT abilities use 'continuous'.
 */
export type AbilityTriggerEvent =
  | 'onPlaceVC'           // card placed on Vanguard Circle (ride)
  | 'onPlaceRC'           // card placed on Rear-Guard Circle (call)
  | 'onPlaceVCorRC'       // card placed on VC or RC
  | 'onAttack'            // this unit attacks
  | 'onBoost'             // this unit boosts another
  | 'onDriveCheckReveal'  // a drive check reveals a card (checked per-card on field)
  | 'onAttackHitsRG'      // this unit's attack hits a rear-guard
  | 'onBoostedAttackHits' // an attack hits during battle this unit boosted
  | 'onOpponentRGRetired' // an opponent's rear-guard is retired (during your main phase)
  | 'mainPhaseACT'        // ACT ability usable during your main phase
  | 'continuous';          // CONT — always-on, recalculated

export type AbilityLocation = 'VC' | 'RC' | 'VCorRC' | 'hand';

// ---- Cost types ----

export interface CostCounterBlast {
  type: 'counterBlast';
  amount: number;
}

export interface CostDiscardFromHand {
  type: 'discardFromHand';
  amount: number;
}

export interface CostPutSelfToSoul {
  type: 'putSelfToSoul';
}

export interface CostCompound {
  type: 'compound';
  costs: AbilityCost[];
}

export type AbilityCost =
  | CostCounterBlast
  | CostDiscardFromHand
  | CostPutSelfToSoul
  | CostCompound;

// ---- Condition types ----

export interface CondSoulContainsName {
  type: 'soulContainsName';
  name: string;
}

export interface CondVanguardClan {
  type: 'vanguardClan';
  clan: Clan;
}

export interface CondHandSizeGreater {
  type: 'handSizeGreaterThanOpponent';
}

export interface CondDriveCheckGradeAndClan {
  type: 'driveCheckGradeAndClan';
  grade: Grade;
  clan: Clan;
}

export interface CondNoOtherClanUnits {
  type: 'noOtherClanUnits';
  clan: Clan;
}

export interface CondBoostedUnitNamed {
  type: 'boostedUnitNamed';
  name: string;
}

export interface CondVanguardGrade {
  type: 'vanguardGrade';
  grade: Grade;
}

export type AbilityCondition =
  | CondSoulContainsName
  | CondVanguardClan
  | CondHandSizeGreater
  | CondDriveCheckGradeAndClan
  | CondNoOtherClanUnits
  | CondBoostedUnitNamed
  | CondVanguardGrade;

// ---- Effect types ----

export interface EffectSelfPowerUp {
  type: 'selfPowerUp';
  amount: number;
  scope: 'battle' | 'turn';
}

export interface EffectSelfCriticalUp {
  type: 'selfCriticalUp';
  amount: number;
  scope: 'battle' | 'turn';
}

export interface EffectBoostedUnitPowerUp {
  type: 'boostedUnitPowerUp';
  amount: number;
  scope: 'battle' | 'turn';
}

export interface EffectRetireOpponentRG {
  type: 'retireOpponentRG';
  gradeCondition: 'gte2' | 'lte1' | 'lte2' | 'any';
}

export interface EffectSearchDeckForName {
  type: 'searchDeckForName';
  name: string;
  addToHand: boolean;
}

export interface EffectChooseAllyPowerUp {
  type: 'chooseAllyPowerUp';
  amount: number;
  scope: 'battle' | 'turn';
  clanRestriction?: Clan;
  excludeSelf: boolean;
}

export interface EffectDraw {
  type: 'draw';
  amount: number;
}

export interface EffectStandSelf {
  type: 'standSelf';
  loseTwinDrive: boolean;
}

export interface EffectSuperiorRideFromHand {
  type: 'superiorRideFromHand';
}

export interface EffectContinuousPowerUp {
  type: 'continuousPowerUp';
  amount: number;
}

export interface EffectCanAttackBackRow {
  type: 'canAttackBackRow';
  sameColumn: boolean;
}

export type AbilityEffect =
  | EffectSelfPowerUp
  | EffectSelfCriticalUp
  | EffectBoostedUnitPowerUp
  | EffectRetireOpponentRG
  | EffectSearchDeckForName
  | EffectChooseAllyPowerUp
  | EffectDraw
  | EffectStandSelf
  | EffectSuperiorRideFromHand
  | EffectContinuousPowerUp
  | EffectCanAttackBackRow;

// ---- The main AbilityDef structure ----

export interface AbilityDef {
  /** Unique ability id — "{cardId}-{index}" */
  abilityId: string;
  timing: AbilityTiming;
  triggerEvent: AbilityTriggerEvent;
  location: AbilityLocation;
  /** Is paying cost / activating optional? (most AUTO with cost are optional) */
  optional: boolean;
  cost?: AbilityCost;
  conditions: AbilityCondition[];
  effects: AbilityEffect[];
  description: string;
}

// ============================================
// ABILITY DATABASE — keyed by cardId
// ============================================

export const ABILITY_DATABASE: Record<string, AbilityDef[]> = {

  // ========================================
  // TD01 - ROYAL PALADIN
  // ========================================

  // #1 — Crimson Butterfly, Brigitte
  // [AUTO](VC): Drive check reveals G3 RP → self +5000 (battle)
  'TD01/001': [
    {
      abilityId: 'TD01/001-0',
      timing: 'AUTO',
      triggerEvent: 'onDriveCheckReveal',
      location: 'VC',
      optional: false,
      conditions: [
        { type: 'driveCheckGradeAndClan', grade: 3, clan: 'royal-paladin' },
      ],
      effects: [
        { type: 'selfPowerUp', amount: 5000, scope: 'battle' },
      ],
      description: 'Brigitte gets +5000 power! (Grade 3 Royal Paladin revealed)',
    },
  ],

  // #2 — Knight of Conviction, Bors
  // [AUTO](VC/RC): On attack → self +3000 (battle). "May pay the cost" but TD has no cost.
  'TD01/002': [
    {
      abilityId: 'TD01/002-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: true,
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'battle' },
      ],
      description: 'Bors attacks! Activate +3000 power?',
    },
  ],

  // #3a — Solitary Knight, Gancelot — CONT
  // [CONT](VC): If "Blaster Blade" in soul → self +5000
  // #3b — Solitary Knight, Gancelot — AUTO
  // [AUTO]: On ride to VC → search deck for "Blaster Blade", add to hand
  'TD01/003': [
    {
      abilityId: 'TD01/003-0',
      timing: 'CONT',
      triggerEvent: 'continuous',
      location: 'VC',
      optional: false,
      conditions: [
        { type: 'soulContainsName', name: 'Blaster Blade' },
      ],
      effects: [
        { type: 'continuousPowerUp', amount: 5000 },
      ],
      description: 'Gancelot gains +5000 power (Blaster Blade in soul).',
    },
    {
      abilityId: 'TD01/003-1',
      timing: 'AUTO',
      triggerEvent: 'onPlaceVC',
      location: 'VC',
      optional: true,
      conditions: [],
      effects: [
        { type: 'searchDeckForName', name: 'Blaster Blade', addToHand: true },
      ],
      description: 'Gancelot rides! Search deck for "Blaster Blade"?',
    },
  ],

  // TD01/004 — Knight of Silence, Gallatin — no ability

  // #4 — Blaster Blade
  // [AUTO]:[CB(2)] On place VC/RC, if RP vanguard → retire opp G2+ RG
  'TD01/005': [
    {
      abilityId: 'TD01/005-0',
      timing: 'AUTO',
      triggerEvent: 'onPlaceVCorRC',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [
        { type: 'vanguardClan', clan: 'royal-paladin' },
      ],
      effects: [
        { type: 'retireOpponentRG', gradeCondition: 'gte2' },
      ],
      description: 'Blaster Blade arrives! Pay CB(2) to retire an opponent\'s Grade 2+ rear-guard?',
    },
  ],

  // #5 — Knight of the Harp, Tristan
  // [AUTO](VC/RC): Drive check reveals G3 RP → self +5000 (battle)
  'TD01/006': [
    {
      abilityId: 'TD01/006-0',
      timing: 'AUTO',
      triggerEvent: 'onDriveCheckReveal',
      location: 'VCorRC',
      optional: false,
      conditions: [
        { type: 'driveCheckGradeAndClan', grade: 3, clan: 'royal-paladin' },
      ],
      effects: [
        { type: 'selfPowerUp', amount: 5000, scope: 'battle' },
      ],
      description: 'Tristan gets +5000 power! (Grade 3 Royal Paladin revealed)',
    },
  ],

  // #6 — Covenant Knight, Randolf
  // [AUTO](VC/RC): On attack, if hand > opp hand → self +3000 (battle)
  'TD01/007': [
    {
      abilityId: 'TD01/007-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: false,
      conditions: [
        { type: 'handSizeGreaterThanOpponent' },
      ],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'battle' },
      ],
      description: 'Randolf gets +3000 power! (More cards in hand than opponent)',
    },
  ],

  // TD01/008 — Little Sage, Marron — no ability

  // #7 — Wingal
  // [AUTO](RC): Boosts "Blaster Blade" → boosted unit +4000 (battle)
  'TD01/009': [
    {
      abilityId: 'TD01/009-0',
      timing: 'AUTO',
      triggerEvent: 'onBoost',
      location: 'RC',
      optional: false,
      conditions: [
        { type: 'boostedUnitNamed', name: 'Blaster Blade' },
      ],
      effects: [
        { type: 'boostedUnitPowerUp', amount: 4000, scope: 'battle' },
      ],
      description: 'Wingal\'s bond with Blaster Blade! Boosted unit gets +4000 power!',
    },
  ],

  // #8 — Starlight Unicorn
  // [AUTO]: On place RC → choose another RP unit, +2000 (turn)
  'TD01/010': [
    {
      abilityId: 'TD01/010-0',
      timing: 'AUTO',
      triggerEvent: 'onPlaceRC',
      location: 'RC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'chooseAllyPowerUp', amount: 2000, scope: 'turn', clanRestriction: 'royal-paladin', excludeSelf: true },
      ],
      description: 'Starlight Unicorn placed! Choose a Royal Paladin ally to give +2000 power.',
    },
  ],

  // #9 — Knight of Rose, Morgana
  // [ACT](RC): [Discard 1 from hand] → self +4000 (turn)
  'TD01/011': [
    {
      abilityId: 'TD01/011-0',
      timing: 'ACT',
      triggerEvent: 'mainPhaseACT',
      location: 'RC',
      optional: true,
      cost: { type: 'discardFromHand', amount: 1 },
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 4000, scope: 'turn' },
      ],
      description: 'Activate Morgana? Discard 1 card to give her +4000 power this turn.',
    },
  ],

  // TD01/012-016 — Grade 0 units / triggers — no abilities

  // ========================================
  // TD02 - KAGERO
  // ========================================

  // #10a — Dragonic Overlord — ACT
  // [ACT](VC/RC): CB(3), if no other Kagero units → self +5000/+1 crit (turn)
  // #10b — Dragonic Overlord — AUTO
  // [AUTO](VC/RC): Attack hits RG → stand self, lose Twin Drive
  'TD02/001': [
    {
      abilityId: 'TD02/001-0',
      timing: 'ACT',
      triggerEvent: 'mainPhaseACT',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'counterBlast', amount: 3 },
      conditions: [
        { type: 'noOtherClanUnits', clan: 'kagero' },
      ],
      effects: [
        { type: 'selfPowerUp', amount: 5000, scope: 'turn' },
        { type: 'selfCriticalUp', amount: 1, scope: 'turn' },
      ],
      description: 'Activate Dragonic Overlord? Pay CB(3) for +5000 power and +1 critical this turn.',
    },
    {
      abilityId: 'TD02/001-1',
      timing: 'AUTO',
      triggerEvent: 'onAttackHitsRG',
      location: 'VCorRC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'standSelf', loseTwinDrive: true },
      ],
      description: 'Dragonic Overlord stands back up! (Loses Twin Drive)',
    },
  ],

  // #11 — Dragon Monk, Goku
  // [AUTO](VC): Drive check reveals G3 Kagero → retire opp G1-or-less RG
  'TD02/002': [
    {
      abilityId: 'TD02/002-0',
      timing: 'AUTO',
      triggerEvent: 'onDriveCheckReveal',
      location: 'VC',
      optional: false,
      conditions: [
        { type: 'driveCheckGradeAndClan', grade: 3, clan: 'kagero' },
      ],
      effects: [
        { type: 'retireOpponentRG', gradeCondition: 'lte1' },
      ],
      description: 'Goku\'s flames! Grade 3 Kagero revealed — retire opponent\'s Grade 1 or less rear-guard!',
    },
  ],

  // #12 — Demonic Dragon Berserker, Yaksha
  // [AUTO]: During your main phase, opp RG retired + G2 VG → may reveal + superior ride from hand
  'TD02/003': [
    {
      abilityId: 'TD02/003-0',
      timing: 'AUTO',
      triggerEvent: 'onOpponentRGRetired',
      location: 'hand',
      optional: true,
      conditions: [
        { type: 'vanguardGrade', grade: 2 },
      ],
      effects: [
        { type: 'superiorRideFromHand' },
      ],
      description: 'An opponent\'s rear-guard was retired! Ride Yaksha from hand?',
    },
  ],

  // TD02/004 — Dragon Knight, Nehalem — no ability

  // #13 — Berserk Dragon
  // [AUTO]:[CB(2)] On place VC/RC, if Kagero VG → retire opp G2-or-less RG
  'TD02/005': [
    {
      abilityId: 'TD02/005-0',
      timing: 'AUTO',
      triggerEvent: 'onPlaceVCorRC',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [
        { type: 'vanguardClan', clan: 'kagero' },
      ],
      effects: [
        { type: 'retireOpponentRG', gradeCondition: 'lte2' },
      ],
      description: 'Berserk Dragon arrives! Pay CB(2) to retire an opponent\'s Grade 2 or less rear-guard?',
    },
  ],

  // #14 — Wyvern Strike, Tejas
  // [AUTO](VC/RC): Can attack back row in same column
  'TD02/006': [
    {
      abilityId: 'TD02/006-0',
      timing: 'CONT',
      triggerEvent: 'continuous',
      location: 'VCorRC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'canAttackBackRow', sameColumn: true },
      ],
      description: 'Tejas can attack the back row unit in the same column.',
    },
  ],

  // TD02/007 — Embodiment of Armor, Bahr — no ability

  // #15 — Dragon Monk, Gojo
  // [ACT](RC): [Put self to soul + Discard 1] → Draw 1
  'TD02/008': [
    {
      abilityId: 'TD02/008-0',
      timing: 'ACT',
      triggerEvent: 'mainPhaseACT',
      location: 'RC',
      optional: true,
      cost: {
        type: 'compound',
        costs: [
          { type: 'putSelfToSoul' },
          { type: 'discardFromHand', amount: 1 },
        ],
      },
      conditions: [],
      effects: [
        { type: 'draw', amount: 1 },
      ],
      description: 'Activate Gojo? Put him to soul and discard 1 card to draw 1 card.',
    },
  ],

  // #16 — Flame of Hope, Aermo
  // [AUTO](RC): [Discard 1] When attack hits during battle this unit boosted → draw 1
  'TD02/009': [
    {
      abilityId: 'TD02/009-0',
      timing: 'AUTO',
      triggerEvent: 'onBoostedAttackHits',
      location: 'RC',
      optional: true,
      cost: { type: 'discardFromHand', amount: 1 },
      conditions: [],
      effects: [
        { type: 'draw', amount: 1 },
      ],
      description: 'Aermo\'s boost helped the attack hit! Discard 1 card to draw 1?',
    },
  ],

  // #17 — Demonic Dragon Madonna, Joka
  // [AUTO](RC): During your main phase, opp RG retired → self +3000 (turn)
  'TD02/010': [
    {
      abilityId: 'TD02/010-0',
      timing: 'AUTO',
      triggerEvent: 'onOpponentRGRetired',
      location: 'RC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'turn' },
      ],
      description: 'Joka gains +3000 power! (Opponent\'s rear-guard retired)',
    },
  ],

  // #18 — Wyvern Strike, Jarran
  // [AUTO](RC): Boosts "Wyvern Strike, Tejas" → boosted unit +4000 (battle)
  'TD02/011': [
    {
      abilityId: 'TD02/011-0',
      timing: 'AUTO',
      triggerEvent: 'onBoost',
      location: 'RC',
      optional: false,
      conditions: [
        { type: 'boostedUnitNamed', name: 'Wyvern Strike, Tejas' },
      ],
      effects: [
        { type: 'boostedUnitPowerUp', amount: 4000, scope: 'battle' },
      ],
      description: 'Jarran\'s formation with Tejas! Boosted unit gets +4000 power!',
    },
  ],

  // #19 — Demonic Dragon Mage, Rakshasa (trigger unit with ability)
  // [AUTO](RC): During your main phase, opp RG retired → self +3000 (turn)
  'TD02/016': [
    {
      abilityId: 'TD02/016-0',
      timing: 'AUTO',
      triggerEvent: 'onOpponentRGRetired',
      location: 'RC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'turn' },
      ],
      description: 'Rakshasa gains +3000 power! (Opponent\'s rear-guard retired)',
    },
  ],
};

/**
 * Get ability definitions for a card.
 * Returns empty array if card has no abilities.
 */
export function getAbilitiesForCard(cardId: string): AbilityDef[] {
  return ABILITY_DATABASE[cardId] ?? [];
}

/**
 * Check if a card has any abilities.
 */
export function hasAbilities(cardId: string): boolean {
  const abilities = ABILITY_DATABASE[cardId];
  return !!abilities && abilities.length > 0;
}

/**
 * Check if a card has any ACT abilities.
 */
export function hasACTAbility(cardId: string): boolean {
  const abilities = ABILITY_DATABASE[cardId];
  return !!abilities && abilities.some(a => a.timing === 'ACT');
}

/**
 * Get all ACT abilities for a card.
 */
export function getACTAbilities(cardId: string): AbilityDef[] {
  return (ABILITY_DATABASE[cardId] ?? []).filter(a => a.timing === 'ACT');
}

/**
 * Get all CONT abilities for a card.
 */
export function getCONTAbilities(cardId: string): AbilityDef[] {
  return (ABILITY_DATABASE[cardId] ?? []).filter(a => a.timing === 'CONT');
}
