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
  | 'onAttackHitsVG'      // this unit's attack hits the opponent's vanguard
  | 'onAllyRGHitsVG'      // any of your rear-guard's attack hits the opponent's vanguard (Gold Rutile)
  | 'onBoostedAttackHits' // an attack hits during battle this unit boosted
  | 'onOpponentRGRetired' // an opponent's rear-guard is retired (during your main phase)
  | 'onRiddenOver'        // another unit rides over this unit (Battleraizer FVG)
  | 'onAttackHits'        // this unit's attack hits any target (VG or RG) — Apollon
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

export interface CostRestSelf {
  type: 'restSelf';
}

export interface CostSoulBlast {
  type: 'soulBlast';
  amount: number;
}

export interface CostCompound {
  type: 'compound';
  costs: AbilityCost[];
}

export type AbilityCost =
  | CostCounterBlast
  | CostDiscardFromHand
  | CostPutSelfToSoul
  | CostRestSelf
  | CostSoulBlast
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

export interface CondRiddenOverByClan {
  type: 'riddenOverByClan';
  clan: Clan;
}

export interface CondHandSizeAtLeast {
  type: 'handSizeAtLeast';
  amount: number;
}

export interface CondBoostsVanguardOfClan {
  type: 'boostsVanguardOfClan';
  clan: Clan;
}

export type AbilityCondition =
  | CondSoulContainsName
  | CondVanguardClan
  | CondHandSizeGreater
  | CondDriveCheckGradeAndClan
  | CondNoOtherClanUnits
  | CondBoostedUnitNamed
  | CondVanguardGrade
  | CondRiddenOverByClan
  | CondHandSizeAtLeast
  | CondBoostsVanguardOfClan;

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

export interface EffectUnflipDamage {
  type: 'unflipDamage';
  amount: number;
}

export interface EffectStandAllyRG {
  type: 'standAllyRG';
  clanRestriction?: Clan;
}

export interface EffectCallSelfToRC {
  type: 'callSelfToRC';
}

export interface EffectBoostedUnitPowerUpThenReturnToDeck {
  type: 'boostedUnitPowerUpThenReturnToDeck';
  amount: number;
}

export interface EffectDrawThenReturnToDeck {
  type: 'drawThenReturnToDeck';
  drawAmount: number;
  returnAmount: number;
}

export interface EffectEachPlayerDraw {
  type: 'eachPlayerDraw';
  amount: number;
}

export interface EffectReturnAllClanRGsToHand {
  type: 'returnAllClanRGsToHand';
  clan: Clan;
}

export interface EffectContinuousPowerUpDuringYourTurn {
  type: 'continuousPowerUpDuringYourTurn';
  amount: number;
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
  | EffectCanAttackBackRow
  | EffectUnflipDamage
  | EffectStandAllyRG
  | EffectCallSelfToRC
  | EffectBoostedUnitPowerUpThenReturnToDeck
  | EffectDrawThenReturnToDeck
  | EffectEachPlayerDraw
  | EffectReturnAllClanRGsToHand
  | EffectContinuousPowerUpDuringYourTurn;

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
  // [AUTO](VC/RC):[CB(1)] When this unit attacks, you may pay the cost. +3000 (battle)
  'TD01/002': [
    {
      abilityId: 'TD01/002-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'counterBlast', amount: 1 },
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'battle' },
      ],
      description: 'Bors attacks! Pay CB(1) for +3000 power?',
    },
  ],

  // #3a — Solitary Knight, Gancelot — ACT
  // [ACT](VC):[CB(2)] If "Blaster Blade" in soul → +5000/+1 crit (turn)
  // #3b — Gancelot — ACT (Hand) — put self on top of deck → search Blaster Blade
  // Note: Hand ACT ability not yet supported by engine, so only VC ACT is implemented
  'TD01/003': [
    {
      abilityId: 'TD01/003-0',
      timing: 'ACT',
      triggerEvent: 'mainPhaseACT',
      location: 'VC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [
        { type: 'soulContainsName', name: 'Blaster Blade' },
      ],
      effects: [
        { type: 'selfPowerUp', amount: 5000, scope: 'turn' },
        { type: 'selfCriticalUp', amount: 1, scope: 'turn' },
      ],
      description: 'Activate Gancelot? Pay CB(2) for +5000 power and +1 critical! (Blaster Blade in soul)',
    },
  ],

  // TD01/004 — Knight of Silence, Gallatin — no ability

  // #4a — Blaster Blade (VC ability)
  // [AUTO]:[CB(2)] On place VC → retire any opp RG
  // #4b — Blaster Blade (RC ability)
  // [AUTO]:[CB(2)] On place RC, if RP vanguard → retire opp G2+ RG
  'TD01/005': [
    {
      abilityId: 'TD01/005-0',
      timing: 'AUTO',
      triggerEvent: 'onPlaceVC',
      location: 'VC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [],
      effects: [
        { type: 'retireOpponentRG', gradeCondition: 'any' },
      ],
      description: 'Blaster Blade rides! Pay CB(2) to retire an opponent\'s rear-guard?',
    },
    {
      abilityId: 'TD01/005-1',
      timing: 'AUTO',
      triggerEvent: 'onPlaceRC',
      location: 'RC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [
        { type: 'vanguardClan', clan: 'royal-paladin' },
      ],
      effects: [
        { type: 'retireOpponentRG', gradeCondition: 'gte2' },
      ],
      description: 'Blaster Blade called! Pay CB(2) to retire an opponent\'s Grade 2+ rear-guard?',
    },
  ],

  // #5 — Knight of the Harp, Tristan
  // [AUTO](VC): Drive check reveals G3 RP → self +5000 (battle)
  'TD01/006': [
    {
      abilityId: 'TD01/006-0',
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
  // [AUTO](VC/RC):[Discard 1] When this unit attacks → self +4000 (turn)
  'TD01/011': [
    {
      abilityId: 'TD01/011-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'discardFromHand', amount: 1 },
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 4000, scope: 'turn' },
      ],
      description: 'Morgana attacks! Discard 1 card for +4000 power this turn?',
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

  // ========================================
  // TD03 - NOVA GRAPPLER
  // ========================================

  // #20a — Gold Rutile
  // [AUTO](VC): When your RG attack hits VG → unflip 1 damage
  // #20b — Gold Rutile
  // [AUTO](VC):[CB(2)] When this unit's attack hits VG → stand 1 NG RG
  'TD03/001': [
    {
      abilityId: 'TD03/001-0',
      timing: 'AUTO',
      triggerEvent: 'onAllyRGHitsVG',
      location: 'VC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'unflipDamage', amount: 1 },
      ],
      description: 'Gold Rutile\'s command! Unflip 1 damage! (Rear-guard hit the vanguard)',
    },
    {
      abilityId: 'TD03/001-1',
      timing: 'AUTO',
      triggerEvent: 'onAttackHitsVG',
      location: 'VC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [],
      effects: [
        { type: 'standAllyRG', clanRestriction: 'nova-grappler' },
      ],
      description: 'Gold Rutile\'s attack hits! Pay CB(2) to stand a Nova Grappler rear-guard?',
    },
  ],

  // #21 — Death Metal Droid
  // [AUTO](VC/RC):[CB(1)] On attack → self +3000 (battle)
  'TD03/002': [
    {
      abilityId: 'TD03/002-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'counterBlast', amount: 1 },
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'battle' },
      ],
      description: 'Death Metal Droid attacks! Pay CB(1) for +3000 power?',
    },
  ],

  // TD03/003 — Mr. Invincible — abilities too complex for current system
  // (start of main phase SC1 + unflip, and SB8+CB5 on hit to stand all)
  // Skipped for now — card works as a vanilla 10000 power G3

  // TD03/004 — King of Sword — no ability (vanilla 10k G2)

  // #22 — Super Electromagnetic Lifeform, Storm
  // [AUTO](VC/RC): Attack hits VG, if NG vanguard → unflip 1 damage
  'TD03/005': [
    {
      abilityId: 'TD03/005-0',
      timing: 'AUTO',
      triggerEvent: 'onAttackHitsVG',
      location: 'VCorRC',
      optional: false,
      conditions: [
        { type: 'vanguardClan', clan: 'nova-grappler' },
      ],
      effects: [
        { type: 'unflipDamage', amount: 1 },
      ],
      description: 'Storm\'s attack connects! Unflip 1 damage!',
    },
  ],

  // TD03/006 — NGM Prototype — intercept shield boost (not supported yet, skipped)
  // TD03/007 — Tough Boy — no ability (vanilla 8k G1)

  // #23 — Oasis Girl
  // [ACT](VC/RC):[CB(1)] Self +1000 (turn)
  'TD03/008': [
    {
      abilityId: 'TD03/008-0',
      timing: 'ACT',
      triggerEvent: 'mainPhaseACT',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'counterBlast', amount: 1 },
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 1000, scope: 'turn' },
      ],
      description: 'Activate Oasis Girl? Pay CB(1) for +1000 power this turn.',
    },
  ],

  // #24 — Screamin' and Dancin' Announcer, Shout
  // [ACT](RC):[Rest self & Discard 1] Draw 1
  'TD03/009': [
    {
      abilityId: 'TD03/009-0',
      timing: 'ACT',
      triggerEvent: 'mainPhaseACT',
      location: 'RC',
      optional: true,
      cost: {
        type: 'compound',
        costs: [
          { type: 'restSelf' },
          { type: 'discardFromHand', amount: 1 },
        ],
      },
      conditions: [],
      effects: [
        { type: 'draw', amount: 1 },
      ],
      description: 'Activate Shout? Rest him and discard 1 card to draw 1 card.',
    },
  ],

  // #25 — Queen of Heart
  // [AUTO](RC): Boosts "King of Sword" → boosted unit +4000 (battle)
  'TD03/010': [
    {
      abilityId: 'TD03/010-0',
      timing: 'AUTO',
      triggerEvent: 'onBoost',
      location: 'RC',
      optional: false,
      conditions: [
        { type: 'boostedUnitNamed', name: 'King of Sword' },
      ],
      effects: [
        { type: 'boostedUnitPowerUp', amount: 4000, scope: 'battle' },
      ],
      description: 'Queen of Heart\'s blessing! King of Sword gets +4000 power!',
    },
  ],

  // #26 — Battering Minotaur
  // [AUTO]: On attack → self +3000 (battle)
  'TD03/011': [
    {
      abilityId: 'TD03/011-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'battle' },
      ],
      description: 'Battering Minotaur charges! +3000 power!',
    },
  ],

  // #27 — Battleraizer (FVG)
  // [AUTO]: When another NG rides this → call self to RC
  // [AUTO](RC): When boosts → boosted unit +3000 (battle), then return to bottom of deck
  'TD03/015': [
    {
      abilityId: 'TD03/015-0',
      timing: 'AUTO',
      triggerEvent: 'onRiddenOver',
      location: 'VC',
      optional: true,
      conditions: [
        { type: 'riddenOverByClan', clan: 'nova-grappler' },
      ],
      effects: [
        { type: 'callSelfToRC' },
      ],
      description: 'A Nova Grappler rides over Battleraizer! Call Battleraizer to a rear-guard circle?',
    },
    {
      abilityId: 'TD03/015-1',
      timing: 'AUTO',
      triggerEvent: 'onBoost',
      location: 'RC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'boostedUnitPowerUpThenReturnToDeck', amount: 3000 },
      ],
      description: 'Battleraizer boosts! +3000 power, then returns to deck.',
    },
  ],

  // ========================================
  // TD04 - ORACLE THINK TANK
  // ========================================

  // #28 — Oracle Guardian, Apollon
  // [AUTO](VC):[CB(2)] When this unit's attack hits → draw 2, return 1 to deck
  // [AUTO](RC):[CB(2)] When this unit's attack hits → draw 1
  // Note: We implement these as two separate abilities differentiated by location
  'TD04/001': [
    {
      abilityId: 'TD04/001-0',
      timing: 'AUTO',
      triggerEvent: 'onAttackHits',
      location: 'VC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [],
      effects: [
        { type: 'drawThenReturnToDeck', drawAmount: 2, returnAmount: 1 },
      ],
      description: 'Apollon\'s attack hits from Vanguard! Pay CB(2) to draw 2 and return 1 to deck?',
    },
    {
      abilityId: 'TD04/001-1',
      timing: 'AUTO',
      triggerEvent: 'onAttackHits',
      location: 'RC',
      optional: true,
      cost: { type: 'counterBlast', amount: 2 },
      conditions: [],
      effects: [
        { type: 'draw', amount: 1 },
      ],
      description: 'Apollon\'s attack hits from Rear-Guard! Pay CB(2) to draw 1?',
    },
  ],

  // #29 — Goddess of Flower Divination, Sakuya
  // [CONT](VC): During your turn, hand ≥ 4 → +4000
  // [AUTO]: When placed on VC → return all OTT RGs to hand
  'TD04/002': [
    {
      abilityId: 'TD04/002-0',
      timing: 'CONT',
      triggerEvent: 'continuous',
      location: 'VC',
      optional: false,
      conditions: [
        { type: 'handSizeAtLeast', amount: 4 },
      ],
      effects: [
        { type: 'continuousPowerUpDuringYourTurn', amount: 4000 },
      ],
      description: 'Sakuya\'s divine power! +4000 when hand is 4 or more!',
    },
    {
      abilityId: 'TD04/002-1',
      timing: 'AUTO',
      triggerEvent: 'onPlaceVC',
      location: 'VC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'returnAllClanRGsToHand', clan: 'oracle-think-tank' },
      ],
      description: 'Sakuya rides! All Oracle Think Tank rear-guards return to hand!',
    },
  ],

  // #30 — Meteor Break Wizard
  // [AUTO](VC/RC):[CB(1)] When this unit attacks → self +3000 (battle)
  'TD04/003': [
    {
      abilityId: 'TD04/003-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: true,
      cost: { type: 'counterBlast', amount: 1 },
      conditions: [],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'battle' },
      ],
      description: 'Meteor Break Wizard attacks! Pay CB(1) for +3000 power?',
    },
  ],

  // TD04/004 — Oracle Guardian, Wiseman — vanilla (no abilities)
  // TD04/005 — Security Guardian — intercept shield boost (not fully supported, skipped)
  // TD04/006 — Sword Dancer Angel — onDraw event (too complex for current system, skipped)
  // TD04/007 — Oracle Guardian, Gemini — vanilla (no abilities)

  // #31 — Dark Cat
  // [AUTO]: On place VC/RC, if OTT VG → each player draws 1
  'TD04/008': [
    {
      abilityId: 'TD04/008-0',
      timing: 'AUTO',
      triggerEvent: 'onPlaceVCorRC',
      location: 'VCorRC',
      optional: false,
      conditions: [
        { type: 'vanguardClan', clan: 'oracle-think-tank' },
      ],
      effects: [
        { type: 'eachPlayerDraw', amount: 1 },
      ],
      description: 'Dark Cat arrives! Both players draw a card!',
    },
  ],

  // #32 — Weather Girl, Milk
  // [AUTO](RC): When boosts OTT VG, hand ≥ 4 → boosted unit +4000 (battle)
  'TD04/009': [
    {
      abilityId: 'TD04/009-0',
      timing: 'AUTO',
      triggerEvent: 'onBoost',
      location: 'RC',
      optional: false,
      conditions: [
        { type: 'boostsVanguardOfClan', clan: 'oracle-think-tank' },
        { type: 'handSizeAtLeast', amount: 4 },
      ],
      effects: [
        { type: 'boostedUnitPowerUp', amount: 4000, scope: 'battle' },
      ],
      description: 'Weather Girl Milk\'s forecast! OTT Vanguard gets +4000!',
    },
  ],

  // #33 — Battle Sister, Maple
  // [AUTO](VC/RC): On attack, hand ≥ 4 → self +3000 (battle)
  'TD04/010': [
    {
      abilityId: 'TD04/010-0',
      timing: 'AUTO',
      triggerEvent: 'onAttack',
      location: 'VCorRC',
      optional: false,
      conditions: [
        { type: 'handSizeAtLeast', amount: 4 },
      ],
      effects: [
        { type: 'selfPowerUp', amount: 3000, scope: 'battle' },
      ],
      description: 'Battle Sister Maple charges! +3000 power with a full hand!',
    },
  ],

  // #34 — Luck Bird
  // [AUTO]:[SB(2)] On place RC, if OTT VG → draw 1
  'TD04/011': [
    {
      abilityId: 'TD04/011-0',
      timing: 'AUTO',
      triggerEvent: 'onPlaceRC',
      location: 'RC',
      optional: true,
      cost: { type: 'soulBlast', amount: 2 },
      conditions: [
        { type: 'vanguardClan', clan: 'oracle-think-tank' },
      ],
      effects: [
        { type: 'draw', amount: 1 },
      ],
      description: 'Luck Bird arrives! Pay SB(2) to draw a card?',
    },
  ],

  // #35 — Lozenge Magus (FVG)
  // [AUTO]: When another OTT rides this → call self to RC
  // [AUTO](RC): When boosts → +3000, return to deck at end of battle
  'TD04/015': [
    {
      abilityId: 'TD04/015-0',
      timing: 'AUTO',
      triggerEvent: 'onRiddenOver',
      location: 'VC',
      optional: true,
      conditions: [
        { type: 'riddenOverByClan', clan: 'oracle-think-tank' },
      ],
      effects: [
        { type: 'callSelfToRC' },
      ],
      description: 'Oracle Think Tank rides over Lozenge Magus! Call Lozenge Magus to a rear-guard circle?',
    },
    {
      abilityId: 'TD04/015-1',
      timing: 'AUTO',
      triggerEvent: 'onBoost',
      location: 'RC',
      optional: false,
      conditions: [],
      effects: [
        { type: 'boostedUnitPowerUpThenReturnToDeck', amount: 3000 },
      ],
      description: 'Lozenge Magus boosts! +3000 power, then returns to deck.',
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

/**
 * Check if a player can pay an ability's cost given current game state.
 * Used client-side to hide skills that can't be activated.
 */
export function canPayAbilityCost(
  cost: AbilityCost | undefined,
  faceUpDamage: number,
  soulCount: number,
  handSize: number,
  unitIsRested: boolean,
): boolean {
  if (!cost) return true;

  switch (cost.type) {
    case 'counterBlast':
      return faceUpDamage >= cost.amount;
    case 'soulBlast':
      return soulCount >= cost.amount;
    case 'discardFromHand':
      return handSize >= cost.amount;
    case 'restSelf':
      return !unitIsRested;
    case 'putSelfToSoul':
      return true; // always payable if card is on field
    case 'compound':
      // Check all sub-costs, but accumulate consumed resources
      let cbLeft = faceUpDamage;
      let sbLeft = soulCount;
      let handLeft = handSize;
      let canRest = !unitIsRested;
      for (const sub of cost.costs) {
        switch (sub.type) {
          case 'counterBlast':
            if (cbLeft < sub.amount) return false;
            cbLeft -= sub.amount;
            break;
          case 'soulBlast':
            if (sbLeft < sub.amount) return false;
            sbLeft -= sub.amount;
            break;
          case 'discardFromHand':
            if (handLeft < sub.amount) return false;
            handLeft -= sub.amount;
            break;
          case 'restSelf':
            if (!canRest) return false;
            canRest = false;
            break;
          case 'putSelfToSoul':
            break; // always payable
        }
      }
      return true;
    default:
      return true;
  }
}
