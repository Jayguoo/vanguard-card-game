import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  PublicVanguardGameState,
  GameAction,
  FieldPosition,
  RearGuardPosition,
  PublicCardInstance,
  FRONT_ROW_POSITIONS,
  BACK_ROW_POSITIONS,
  BOOST_COLUMN_REVERSE,
  BOOST_COLUMN_MAP,
} from '../shared/types';
import { CARD_DATABASE } from '../shared/cardDatabase';
import { getAbilitiesForCard, getACTAbilities, canPayAbilityCost } from '../shared/abilityDefinitions';
import { PlayerField } from './field/PlayerField';
import { DamageZone } from './field/DamageZone';
import { DropZone } from './field/DropZone';
import { HandArea } from './cards/HandArea';
import { VanguardCard, CardBack } from './cards/VanguardCard';
import { ActionPanel } from './battle/ActionPanel';
import { TriggerReveal } from './battle/TriggerReveal';
import { BattleArrow } from './battle/BattleArrow';
import { RPSOverlay } from './battle/RPSOverlay';
import { AbilityOverlay } from './battle/AbilityOverlay';
import { DrawAnimation } from './battle/DrawAnimation';
import { PhaseBar } from './ui/PhaseBar';
import { RearGuardMenu, RearGuardMenuOption, getColumnPartner } from './field/RearGuardMenu';
import './VanguardGame.css';

function formatPositionLabel(pos: FieldPosition): string {
  const labels: Record<FieldPosition, string> = {
    'vanguard': 'Vanguard',
    'front-left': 'Front Left',
    'front-right': 'Front Right',
    'back-left': 'Back Left',
    'back-center': 'Back Center',
    'back-right': 'Back Right',
  };
  return labels[pos] ?? pos;
}

interface VanguardGameProps {
  gameState: PublicVanguardGameState;
  myId: string;
  onAction: (action: GameAction) => Promise<void>;
  onLeave: () => void;
  error: string | null;
}

export const VanguardGame: React.FC<VanguardGameProps> = ({
  gameState,
  myId,
  onAction,
  onLeave,
  error,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<FieldPosition | null>(null);
  const [mulliganCards, setMulliganCards] = useState<string[]>([]);
  const [previewCard, setPreviewCard] = useState<PublicCardInstance | null>(null);
  const [zonePreview, setZonePreview] = useState<{ label: string; cards?: PublicCardInstance[]; zoneKey?: string } | null>(null);
  const [rgMenu, setRgMenu] = useState<{ position: RearGuardPosition; x: number; y: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ action: GameAction; description: string } | null>(null);
  const [actSkillOverlay, setActSkillOverlay] = useState<{
    cardId: string;
    instanceId: string;
    abilities: { abilityIndex: number; description: string }[];
  } | null>(null);
  const [triggerEffectTarget, setTriggerEffectTarget] = useState<string | null>(null);
  const [pendingBoosterPosition, setPendingBoosterPosition] = useState<RearGuardPosition | null>(null);
  const [boostChoicePending, setBoostChoicePending] = useState(false); // true = waiting for player to choose boost before picking target
  const [abilityDiscardSelection, setAbilityDiscardSelection] = useState<string[]>([]);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [phaseAnnouncement, setPhaseAnnouncement] = useState<string | null>(null);
  const [phaseAnnouncementTurn, setPhaseAnnouncementTurn] = useState<string>('');

  const { phase, myState, opponentState, battle, turnPlayerId } = gameState;
  const isMyTurn = turnPlayerId === myId;
  const isDefender = battle && turnPlayerId !== myId;

  // During battle, show attack/defend power on the field cards
  const myPowerOverrides = useMemo<Partial<Record<FieldPosition, number>>>(() => {
    if (!battle?.attackingPosition) return {};
    if (isMyTurn) {
      return { [battle.attackingPosition]: battle.attackPower };
    }
    if (battle.targetPosition) {
      return { [battle.targetPosition]: battle.defendPower };
    }
    return {};
  }, [battle, isMyTurn]);

  const opponentPowerOverrides = useMemo<Partial<Record<FieldPosition, number>>>(() => {
    if (!battle?.targetPosition) return {};
    if (isMyTurn && battle.targetPosition) {
      return { [battle.targetPosition]: battle.defendPower };
    }
    if (!isMyTurn && battle.attackingPosition) {
      return { [battle.attackingPosition]: battle.attackPower };
    }
    return {};
  }, [battle, isMyTurn]);

  // Resolve zone preview cards dynamically so deck/zone contents stay fresh
  const resolvedZonePreviewCards = useMemo(() => {
    if (!zonePreview) return [];
    if (zonePreview.cards) return zonePreview.cards;
    switch (zonePreview.zoneKey) {
      case 'my-deck': return myState.deck ?? [];
      case 'my-soul': return myState.soul ?? [];
      case 'my-damage': return myState.damageZone;
      case 'my-drop': return myState.dropZone;
      case 'opp-damage': return opponentState.damageZone;
      case 'opp-drop': return opponentState.dropZone;
      default: return [];
    }
  }, [zonePreview, myState, opponentState]);

  // Refs for scroll-to-center and arrow overlay
  const boardRef = useRef<HTMLDivElement>(null);
  const myFieldRef = useRef<HTMLDivElement>(null);
  const guardZoneRef = useRef<HTMLDivElement>(null);
  const handAreaRef = useRef<HTMLDivElement>(null);
  const actionAreaRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Compute cost-checking values once for ACT ability filtering
  const faceUpDamage = useMemo(() =>
    myState.damageZone.filter(c => c.isFaceUp).length, [myState.damageZone]);
  const soulCount = myState.soul?.length ?? myState.soulCount ?? 0;
  const handSize = myState.hand?.length ?? 0;

  // Auto-scroll when phase changes
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;
    setPendingAction(null);
    setActSkillOverlay(null);
    setTriggerEffectTarget(null);
    setAbilityDiscardSelection([]);
    setBoostChoicePending(false);
    // Keep pendingBoosterPosition only during battle-boost-step (auto-boost effect needs it)
    if (phase !== 'battle-boost-step') {
      setPendingBoosterPosition(null);
    }

    // Small delay to let DOM update before scrolling
    const timer = setTimeout(() => {
      if (phase === 'setup-rps' || phase === 'setup-rps-result') {
        scrollTo(actionAreaRef);
      } else if (phase === 'setup-mulligan' || phase === 'setup-choose-vanguard') {
        scrollTo(handAreaRef);
      } else if (phase === 'ride-phase' || phase === 'main-phase') {
        scrollTo(myFieldRef);
      } else if (phase === 'battle-phase') {
        scrollTo(myFieldRef);
      } else if (phase === 'battle-guard-step') {
        if (isDefender) {
          scrollTo(guardZoneRef);
        } else {
          scrollTo(guardZoneRef);
        }
      } else if (phase.startsWith('battle-drive') || phase.startsWith('battle-damage')) {
        scrollTo(guardZoneRef);
      } else if (phase === 'battle-boost-step') {
        scrollTo(myFieldRef);
      } else if (phase === 'ability-pending') {
        scrollTo(actionAreaRef);
      } else if (phase === 'game-over') {
        // No scroll needed, overlay covers everything
      } else {
        scrollTo(actionAreaRef);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [phase, isDefender, scrollTo]);

  // Phase announcement popup
  const PHASE_LABELS: Record<string, string> = {
    'stand-phase': 'Stand Phase',
    'draw-phase': 'Draw Phase',
    'ride-phase': 'Ride Phase',
    'main-phase': 'Main Phase',
    'battle-phase': 'Battle Phase',
    'end-phase': 'End Phase',
  };

  useEffect(() => {
    const label = PHASE_LABELS[phase];
    if (!label) return;

    setPhaseAnnouncement(label);
    setPhaseAnnouncementTurn(isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN");

    const timer = setTimeout(() => setPhaseAnnouncement(null), 1500);
    return () => clearTimeout(timer);
  }, [phase, isMyTurn]);

  // Auto-send boost when entering boost step with a pre-selected booster
  useEffect(() => {
    if (phase === 'battle-boost-step' && isMyTurn && pendingBoosterPosition) {
      const pos = pendingBoosterPosition;
      setPendingBoosterPosition(null);
      onAction({ type: 'boost:declare', boosterPosition: pos });
    }
  }, [phase, isMyTurn, pendingBoosterPosition, onAction]);

  // Determine highlighted cards in hand based on phase
  const highlightedCardIds = useMemo(() => {
    // During ability discard selection, highlight selected cards
    if (phase === 'ability-pending' && gameState.abilityPending?.playerId === myId) {
      const pending = gameState.abilityPending;
      if (pending.type === 'select-discard') {
        return abilityDiscardSelection.length > 0
          ? abilityDiscardSelection
          : myState.hand.map(c => c.instanceId); // Highlight all hand cards as selectable
      }
      return [];
    }

    if (!isMyTurn && phase !== 'battle-guard-step' && phase !== 'battle-damage-trigger-assign') return [];
    const ids: string[] = [];

    if (phase === 'ride-phase' && isMyTurn) {
      // Highlight cards that can be ridden
      const vgGrade = myState.vanguardCircle
        ? CARD_DATABASE[myState.vanguardCircle.cardId]?.grade ?? 0
        : 0;
      for (const card of myState.hand) {
        const def = CARD_DATABASE[card.cardId];
        if (def && (def.grade === vgGrade || def.grade === vgGrade + 1)) {
          ids.push(card.instanceId);
        }
      }
    } else if (phase === 'main-phase' && isMyTurn) {
      // Highlight cards that can be called (grade 1-3, grade <= VG grade)
      const vgGrade = myState.vanguardCircle
        ? CARD_DATABASE[myState.vanguardCircle.cardId]?.grade ?? 0
        : 0;
      for (const card of myState.hand) {
        const def = CARD_DATABASE[card.cardId];
        if (def && def.grade > 0 && def.grade <= vgGrade) {
          ids.push(card.instanceId);
        }
      }
    } else if (phase === 'battle-guard-step' && isDefender) {
      // Highlight cards that can guard (shield > 0)
      for (const card of myState.hand) {
        const def = CARD_DATABASE[card.cardId];
        if (def && def.shield > 0) {
          ids.push(card.instanceId);
        }
      }
    }

    return ids;
  }, [phase, isMyTurn, isDefender, myState]);

  // Determine highlighted field positions
  const highlightedPositions = useMemo((): FieldPosition[] => {
    // Ability pending — highlight valid targets on my field
    if (phase === 'ability-pending' && gameState.abilityPending?.playerId === myId) {
      const pending = gameState.abilityPending;
      if (pending.type === 'select-target') {
        const positions: FieldPosition[] = [];

        // Position-based targets (e.g., callSelfToRC — empty RC positions)
        if (pending.validTargetPositions && pending.validTargetPositions.length > 0) {
          for (const pos of pending.validTargetPositions) {
            positions.push(pos as FieldPosition);
          }
        }

        // Card-based targets
        if (pending.validTargets) {
          for (const target of pending.validTargets) {
            if (myState.vanguardCircle?.instanceId === target.instanceId) positions.push('vanguard');
            for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
              if (myState.rearGuards[pos]?.instanceId === target.instanceId) positions.push(pos);
            }
          }
        }

        return positions;
      }
      return [];
    }

    if (phase === 'main-phase' && isMyTurn && selectedCardId) {
      // Highlight empty RC positions where the card can be called
      const positions: FieldPosition[] = [];
      for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
        positions.push(pos);
      }
      return positions;
    }

    if (phase === 'main-phase' && isMyTurn && !selectedCardId) {
      // Highlight units with ACT abilities that can be activated and paid for
      const positions: FieldPosition[] = [];
      if (myState.vanguardCircle) {
        const card = myState.vanguardCircle;
        const affordable = getACTAbilities(card.cardId).filter(a =>
          canPayAbilityCost(a.cost, faceUpDamage, soulCount, handSize, card.isRested));
        if (affordable.length > 0) positions.push('vanguard');
      }
      for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
        const card = myState.rearGuards[pos];
        if (card) {
          const affordable = getACTAbilities(card.cardId).filter(a =>
            canPayAbilityCost(a.cost, faceUpDamage, soulCount, handSize, card.isRested));
          if (affordable.length > 0) positions.push(pos);
        }
      }
      return positions;
    }

    if (phase === 'battle-phase' && isMyTurn) {
      // When boost choice is pending, highlight just the booster and the attacker
      if (boostChoicePending && selectedPosition) {
        const positions: FieldPosition[] = [selectedPosition];
        const boostPos = BOOST_COLUMN_REVERSE[selectedPosition] as RearGuardPosition | undefined;
        if (boostPos) positions.push(boostPos);
        return positions;
      }

      // When an attacker is selected (past boost choice), don't highlight my field — opponent targets shown
      if (selectedPosition && !boostChoicePending) {
        return [selectedPosition]; // Just highlight the selected attacker
      }

      // No attacker selected: highlight standing attackers + valid back-row boosters
      const positions: FieldPosition[] = [];
      if (myState.vanguardCircle && !myState.vanguardCircle.isRested) {
        positions.push('vanguard');
      }
      for (const pos of FRONT_ROW_POSITIONS as RearGuardPosition[]) {
        const card = myState.rearGuards[pos];
        if (card && !card.isRested) {
          positions.push(pos);
        }
      }
      // Also highlight back-row G0/G1 units that can boost a standing front-row unit
      for (const backPos of BACK_ROW_POSITIONS as RearGuardPosition[]) {
        const boosterCard = myState.rearGuards[backPos];
        if (!boosterCard || boosterCard.isRested) continue;
        const boosterDef = CARD_DATABASE[boosterCard.cardId];
        if (!boosterDef || boosterDef.grade > 1) continue;
        const frontPos = BOOST_COLUMN_MAP[backPos] as FieldPosition;
        if (frontPos === 'vanguard') {
          if (myState.vanguardCircle && !myState.vanguardCircle.isRested) {
            positions.push(backPos);
          }
        } else {
          const frontCard = myState.rearGuards[frontPos as RearGuardPosition];
          if (frontCard && !frontCard.isRested) {
            positions.push(backPos);
          }
        }
      }
      return positions;
    }

    if (phase === 'battle-boost-step' && isMyTurn && battle?.attackingPosition) {
      const boostPos = BOOST_COLUMN_REVERSE[battle.attackingPosition];
      if (boostPos && myState.rearGuards[boostPos]) {
        const card = myState.rearGuards[boostPos];
        if (card && !card.isRested) {
          const def = CARD_DATABASE[card.cardId];
          if (def && def.grade <= 1) {
            return [boostPos];
          }
        }
      }
    }

    // Highlight all my units during trigger assignment
    if ((phase === 'battle-drive-trigger-assign' && isMyTurn) ||
        (phase === 'battle-damage-trigger-assign' && isDefender)) {
      const positions: FieldPosition[] = [];
      if (myState.vanguardCircle) positions.push('vanguard');
      for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
        if (myState.rearGuards[pos]) positions.push(pos);
      }
      return positions;
    }

    return [];
  }, [phase, isMyTurn, isDefender, selectedCardId, selectedPosition, boostChoicePending, myState, battle]);

  // Highlighted opponent positions (attack targets + ability targets)
  const opponentHighlightedPositions = useMemo((): FieldPosition[] => {
    // Ability pending — highlight valid targets on opponent field
    if (phase === 'ability-pending' && gameState.abilityPending?.playerId === myId) {
      const pending = gameState.abilityPending;
      if (pending.type === 'select-target' && pending.validTargets) {
        const positions: FieldPosition[] = [];
        for (const target of pending.validTargets) {
          if (opponentState.vanguardCircle?.instanceId === target.instanceId) positions.push('vanguard');
          for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
            if (opponentState.rearGuards[pos]?.instanceId === target.instanceId) positions.push(pos);
          }
        }
        return positions;
      }
      return [];
    }

    if (phase === 'battle-attack-step' || (phase === 'battle-phase' && isMyTurn && selectedPosition && !boostChoicePending)) {
      const positions: FieldPosition[] = [];
      if (opponentState.vanguardCircle) positions.push('vanguard');
      for (const pos of FRONT_ROW_POSITIONS as RearGuardPosition[]) {
        if (opponentState.rearGuards[pos]) positions.push(pos);
      }
      return positions;
    }
    return [];
  }, [phase, isMyTurn, selectedPosition, boostChoicePending, opponentState]);

  // Determine which field positions have activatable abilities (for gold glow)
  const abilityGlowPositions = useMemo((): FieldPosition[] => {
    if (phase !== 'main-phase' || !isMyTurn || selectedCardId) return [];

    const positions: FieldPosition[] = [];
    if (myState.vanguardCircle) {
      const card = myState.vanguardCircle;
      const affordable = getACTAbilities(card.cardId).filter(a =>
        canPayAbilityCost(a.cost, faceUpDamage, soulCount, handSize, card.isRested));
      if (affordable.length > 0) positions.push('vanguard');
    }
    for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
      const card = myState.rearGuards[pos];
      if (card) {
        const affordable = getACTAbilities(card.cardId).filter(a =>
          canPayAbilityCost(a.cost, faceUpDamage, soulCount, handSize, card.isRested));
        if (affordable.length > 0) positions.push(pos);
      }
    }
    return positions;
  }, [phase, isMyTurn, selectedCardId, myState, faceUpDamage, soulCount, handSize]);

  // Determine valid drop target positions when dragging a card
  const dropTargetPositions = useMemo((): FieldPosition[] => {
    if (!draggingCardId) return [];
    const card = myState.hand.find(c => c.instanceId === draggingCardId);
    if (!card) return [];
    const def = CARD_DATABASE[card.cardId];
    if (!def) return [];

    if (phase === 'ride-phase' && isMyTurn) {
      const vgGrade = myState.vanguardCircle
        ? CARD_DATABASE[myState.vanguardCircle.cardId]?.grade ?? 0
        : 0;
      if (def.grade === vgGrade || def.grade === vgGrade + 1) {
        return ['vanguard'];
      }
    }

    if (phase === 'main-phase' && isMyTurn) {
      const vgGrade = myState.vanguardCircle
        ? CARD_DATABASE[myState.vanguardCircle.cardId]?.grade ?? 0
        : 0;
      if (def.grade > 0 && def.grade <= vgGrade) {
        return [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as FieldPosition[];
      }
    }

    return [];
  }, [draggingCardId, phase, isMyTurn, myState]);

  // Handle card hover — show preview on left side
  const handleCardHover = useCallback((card: PublicCardInstance | null) => {
    setPreviewCard(card);
  }, []);

  // Handle hand card click
  const handleHandCardClick = useCallback(async (card: PublicCardInstance) => {

    if (phase === 'setup-mulligan') {
      // Toggle exchange selection
      setMulliganCards(prev =>
        prev.includes(card.instanceId)
          ? prev.filter(id => id !== card.instanceId)
          : [...prev, card.instanceId]
      );
      return;
    }

    if (phase === 'ride-phase' && isMyTurn) {
      const def = CARD_DATABASE[card.cardId];
      const vgGrade = myState.vanguardCircle
        ? CARD_DATABASE[myState.vanguardCircle.cardId]?.grade ?? 0
        : 0;
      if (def && (def.grade === vgGrade || def.grade === vgGrade + 1)) {
        setPendingAction({
          action: { type: 'ride', cardInstanceId: card.instanceId },
          description: `Ride ${def.name}?`,
        });
        setSelectedCardId(card.instanceId);
        scrollTo(actionAreaRef);
        return;
      }
    }

    if (phase === 'main-phase' && isMyTurn) {
      setPendingAction(null);
      setSelectedCardId(prev => prev === card.instanceId ? null : card.instanceId);
      setSelectedPosition(null);
      scrollTo(myFieldRef);
      return;
    }

    if (phase === 'battle-guard-step' && isDefender) {
      const def = CARD_DATABASE[card.cardId];
      if (def && def.shield > 0) {
        setPendingAction({
          action: { type: 'guard:addGuardian', cardInstanceId: card.instanceId },
          description: `Guard with ${def.name} (Shield: ${def.shield})?`,
        });
        scrollTo(actionAreaRef);
      }
      return;
    }

    // Ability pending — discard selection
    if (phase === 'ability-pending' && gameState.abilityPending?.playerId === myId) {
      const pending = gameState.abilityPending;
      if (pending.type === 'select-discard') {
        // Toggle card selection for discard
        setAbilityDiscardSelection(prev => {
          const newSelection = prev.includes(card.instanceId)
            ? prev.filter(id => id !== card.instanceId)
            : [...prev, card.instanceId];

          // Auto-submit when we reach the required count
          const required = pending.minSelections ?? 1;
          if (newSelection.length === required) {
            onAction({ type: 'ability:selectDiscard', cardInstanceIds: newSelection });
            return [];
          }
          return newSelection;
        });
        return;
      }
    }

    // Trigger assignment - clicking hand cards does nothing
  }, [phase, isMyTurn, isDefender, myState, gameState.abilityPending, myId, onAction, scrollTo]);

  // Handle my field circle click
  const handleMyCircleClick = useCallback(async (position: FieldPosition) => {
    // Ability pending — select target from my field
    if (phase === 'ability-pending' && gameState.abilityPending?.playerId === myId) {
      const pending = gameState.abilityPending;
      if (pending.type === 'select-target') {
        // Position-based targets (e.g., callSelfToRC — select an empty RC position)
        if (pending.validTargetPositions?.includes(position)) {
          await onAction({ type: 'ability:selectTarget', targetInstanceId: position });
          return;
        }

        // Card-based targets
        const unitCard = position === 'vanguard'
          ? myState.vanguardCircle
          : myState.rearGuards[position as RearGuardPosition];
        if (unitCard && pending.validTargets?.some(t => t.instanceId === unitCard.instanceId)) {
          await onAction({ type: 'ability:selectTarget', targetInstanceId: unitCard.instanceId });
        }
      }
      return;
    }

    if (phase === 'main-phase' && isMyTurn && selectedCardId) {
      if (position !== 'vanguard') {
        const selectedCard = myState.hand.find(c => c.instanceId === selectedCardId);
        const cardDef = selectedCard ? CARD_DATABASE[selectedCard.cardId] : null;
        const posLabel = formatPositionLabel(position);
        setPendingAction({
          action: { type: 'call', cardInstanceId: selectedCardId, position: position as RearGuardPosition },
          description: `Call ${cardDef?.name ?? 'unit'} to ${posLabel}?`,
        });
        setSelectedPosition(position);
        scrollTo(actionAreaRef);
      }
      return;
    }

    // Main phase: clicking on a unit (VG or RG) with affordable ACT abilities — offer activation
    if (phase === 'main-phase' && isMyTurn && !selectedCardId) {
      const unitCard = position === 'vanguard'
        ? myState.vanguardCircle
        : myState.rearGuards[position as RearGuardPosition];
      if (unitCard) {
        const affordable = getACTAbilities(unitCard.cardId).filter(a =>
          canPayAbilityCost(a.cost, faceUpDamage, soulCount, handSize, unitCard.isRested));
        if (affordable.length > 0) {
          const allAbilities = getAbilitiesForCard(unitCard.cardId);
          setActSkillOverlay({
            cardId: unitCard.cardId,
            instanceId: unitCard.instanceId,
            abilities: affordable.map(act => ({
              abilityIndex: allAbilities.indexOf(act),
              description: act.description,
            })),
          });
          return;
        }
        // Preview is now handled by hover, no click-toggle needed
      }
      return;
    }

    if (phase === 'battle-phase' && isMyTurn) {
      setPendingAction(null);

      // If boost choice is pending and player clicks the booster position to accept
      if (boostChoicePending && selectedPosition) {
        const boostPos = BOOST_COLUMN_REVERSE[selectedPosition] as RearGuardPosition | undefined;
        if (boostPos && position === boostPos) {
          // Player clicked the booster — accept boost, now pick a target
          setPendingBoosterPosition(boostPos);
          setBoostChoicePending(false);
          return;
        }
        // Clicking elsewhere while boost choice pending — ignore (use buttons)
        return;
      }

      // Clicking a back-row booster: auto-select the front-row attacker in that column + offer boost
      if ((BACK_ROW_POSITIONS as string[]).includes(position)) {
        const boosterCard = myState.rearGuards[position as RearGuardPosition];
        const boosterDef = boosterCard ? CARD_DATABASE[boosterCard.cardId] : null;
        if (boosterCard && !boosterCard.isRested && boosterDef && boosterDef.grade <= 1) {
          const frontPos = BOOST_COLUMN_MAP[position] as FieldPosition;
          const frontCard = frontPos === 'vanguard'
            ? myState.vanguardCircle
            : myState.rearGuards[frontPos as RearGuardPosition];
          if (frontCard && !frontCard.isRested) {
            setSelectedPosition(frontPos);
            setPendingBoosterPosition(position as RearGuardPosition);
            setBoostChoicePending(false); // Already chose boost by clicking booster
            return;
          }
        }
      }

      // Clicking a front-row/vanguard attacker: check for available booster first
      if (position === 'vanguard' || (FRONT_ROW_POSITIONS as string[]).includes(position)) {
        const unitCard = position === 'vanguard'
          ? myState.vanguardCircle
          : myState.rearGuards[position as RearGuardPosition];
        if (!unitCard || unitCard.isRested) return;

        // Deselect if clicking the same position
        if (selectedPosition === position && !boostChoicePending) {
          setSelectedPosition(null);
          setPendingBoosterPosition(null);
          setBoostChoicePending(false);
          return;
        }

        // Select the attacker
        setSelectedPosition(position);
        setPendingBoosterPosition(null);

        // Check if there's a valid booster in the same column
        const boostPos = BOOST_COLUMN_REVERSE[position] as RearGuardPosition | undefined;
        if (boostPos) {
          const boosterCard = myState.rearGuards[boostPos];
          const boosterDef = boosterCard ? CARD_DATABASE[boosterCard.cardId] : null;
          if (boosterCard && !boosterCard.isRested && boosterDef && boosterDef.grade <= 1) {
            // Valid booster available — ask the player first
            setBoostChoicePending(true);
            scrollTo(actionAreaRef);
            return;
          }
        }

        // No valid booster — go straight to target selection
        setBoostChoicePending(false);
        return;
      }

      return;
    }

    if (phase === 'battle-boost-step' && isMyTurn) {
      const boostPos = battle?.attackingPosition ? BOOST_COLUMN_REVERSE[battle.attackingPosition] : null;
      if (boostPos && position === boostPos) {
        const boostCard = myState.rearGuards[boostPos];
        const boostDef = boostCard ? CARD_DATABASE[boostCard.cardId] : null;
        setPendingAction({
          action: { type: 'boost:declare', boosterPosition: position as RearGuardPosition },
          description: `Boost with ${boostDef?.name ?? 'unit'} (+${boostDef?.power ?? 0})?`,
        });
        scrollTo(actionAreaRef);
      }
      return;
    }

    // Trigger assignment - two-step for critical/stand, single-step for draw/heal
    if ((phase === 'battle-drive-trigger-assign' && isMyTurn) ||
        (phase === 'battle-damage-trigger-assign' && isDefender)) {
      const unitCard = position === 'vanguard'
        ? myState.vanguardCircle
        : myState.rearGuards[position as RearGuardPosition];
      if (unitCard) {
        const unitDef = CARD_DATABASE[unitCard.cardId];
        const triggerDef = battle?.triggerToAssign ? CARD_DATABASE[battle.triggerToAssign.cardId] : null;
        const triggerType = triggerDef?.triggerType;
        const isSplittable = triggerType === 'critical' || triggerType === 'stand';

        if (isSplittable && triggerEffectTarget === null) {
          // Step 1: Pick the unit for the special effect (critical or stand)
          setTriggerEffectTarget(unitCard.instanceId);
          setPendingAction(null); // Clear any previous pending
          setSelectedPosition(position);
          // No action dispatched yet — wait for step 2
          return;
        }

        if (isSplittable && triggerEffectTarget !== null) {
          // Step 2: Pick the unit for +5000 power
          const effectCard = (() => {
            // Find the effect target card by instanceId
            if (myState.vanguardCircle?.instanceId === triggerEffectTarget) return myState.vanguardCircle;
            for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
              const rc = myState.rearGuards[pos];
              if (rc?.instanceId === triggerEffectTarget) return rc;
            }
            return null;
          })();
          const effectDef = effectCard ? CARD_DATABASE[effectCard.cardId] : null;
          const effectLabel = triggerType === 'critical' ? 'Critical' : 'Stand';
          const desc = triggerEffectTarget === unitCard.instanceId
            ? `Give ${effectLabel} +1 and +5000 power to ${unitDef?.name ?? 'unit'}?`
            : `${effectLabel} → ${effectDef?.name ?? 'unit'}, Power +5000 → ${unitDef?.name ?? 'unit'}?`;
          setPendingAction({
            action: {
              type: 'trigger:assignPower',
              targetInstanceId: unitCard.instanceId,
              effectTargetInstanceId: triggerEffectTarget,
            },
            description: desc,
          });
          setSelectedPosition(position);
          scrollTo(actionAreaRef);
          return;
        }

        // Single-step for draw/heal (no split needed)
        let desc = `Give +5000 power to ${unitDef?.name ?? 'unit'}?`;
        setPendingAction({
          action: { type: 'trigger:assignPower', targetInstanceId: unitCard.instanceId },
          description: desc,
        });
        setSelectedPosition(position);
        scrollTo(actionAreaRef);
      }
      return;
    }
  }, [phase, isMyTurn, isDefender, selectedCardId, selectedPosition, boostChoicePending, battle, myState, triggerEffectTarget, onAction, scrollTo]);

  // Handle opponent field click (for attack target selection + ability targeting)
  const handleOpponentCircleClick = useCallback(async (position: FieldPosition) => {
    // Ability pending — select target from opponent field
    if (phase === 'ability-pending' && gameState.abilityPending?.playerId === myId) {
      const pending = gameState.abilityPending;
      if (pending.type === 'select-target') {
        const unitCard = position === 'vanguard'
          ? opponentState.vanguardCircle
          : opponentState.rearGuards[position as RearGuardPosition];
        if (unitCard && pending.validTargets?.some(t => t.instanceId === unitCard.instanceId)) {
          await onAction({ type: 'ability:selectTarget', targetInstanceId: unitCard.instanceId });
        }
      }
      return;
    }

    if (phase === 'battle-phase' && isMyTurn && selectedPosition && !boostChoicePending) {
      const attackerCard = selectedPosition === 'vanguard'
        ? myState.vanguardCircle
        : myState.rearGuards[selectedPosition as RearGuardPosition];
      const targetCard = position === 'vanguard'
        ? opponentState.vanguardCircle
        : opponentState.rearGuards[position as RearGuardPosition];
      const attackerDef = attackerCard ? CARD_DATABASE[attackerCard.cardId] : null;
      const targetDef = targetCard ? CARD_DATABASE[targetCard.cardId] : null;
      // Include boost info if a booster was pre-selected
      let desc = `Attack ${targetDef?.name ?? 'unit'} with ${attackerDef?.name ?? 'unit'}`;
      if (pendingBoosterPosition) {
        const boosterCard = myState.rearGuards[pendingBoosterPosition];
        const boosterDef = boosterCard ? CARD_DATABASE[boosterCard.cardId] : null;
        desc += ` boosted by ${boosterDef?.name ?? 'unit'}`;
      }
      desc += '?';
      setPendingAction({
        action: {
          type: 'attack:declare',
          attackerPosition: selectedPosition,
          targetPosition: position,
        },
        description: desc,
      });
      scrollTo(actionAreaRef);
      return;
    }

    // Guard step - intercept with front row Grade 2
    if (phase === 'battle-guard-step' && isDefender) {
      // The opponent's field click doesn't make sense for guarding
      // Intercept uses MY field
      return;
    }
  }, [phase, isMyTurn, isDefender, selectedPosition, boostChoicePending, myState, opponentState, pendingBoosterPosition, scrollTo]);

  // Handle intercept from my field during guard step + vanguard soul toggle
  const handleMyCardClick = useCallback(async (position: FieldPosition, card: PublicCardInstance) => {
    // Clicking vanguard toggles the soul list
    if (position === 'vanguard') {
      if (zonePreview?.zoneKey === 'my-soul') {
        setZonePreview(null);
      } else {
        setZonePreview({ label: 'Soul', zoneKey: 'my-soul' });
      }
      return;
    }
    if (phase === 'battle-guard-step' && isDefender) {
      const def = CARD_DATABASE[card.cardId];
      if (def && def.grade === 2 && FRONT_ROW_POSITIONS.includes(position as RearGuardPosition)) {
        setPendingAction({
          action: { type: 'guard:intercept', position: position as RearGuardPosition },
          description: `Intercept with ${def.name} (Shield: ${def.shield})?`,
        });
        scrollTo(actionAreaRef);
      }
    }
    // Show rear-guard context menu on left-click during main phase
    if (phase === 'main-phase' && isMyTurn && !selectedCardId) {
      const el = document.querySelector<HTMLElement>(
        `[data-position="${position}"][data-owner="self"]`
      );
      if (el) {
        const rect = el.getBoundingClientRect();
        setRgMenu({ position: position as RearGuardPosition, x: rect.right + 4, y: rect.top });
      }
    }
  }, [phase, isDefender, isMyTurn, selectedCardId, scrollTo, zonePreview]);

  // Handle right-click on my rear-guard for context menu
  const handleMyFieldRightClick = useCallback((position: FieldPosition, _card: PublicCardInstance, e: React.MouseEvent) => {
    // Only show context menu for rear-guards during main phase on my turn
    if (position === 'vanguard') return;
    if (phase !== 'main-phase' || !isMyTurn) return;

    setRgMenu({ position: position as RearGuardPosition, x: e.clientX, y: e.clientY });
  }, [phase, isMyTurn]);

  // Drag-and-drop handlers for ride/call
  const handleDragStart = useCallback((card: PublicCardInstance) => {
    setDraggingCardId(card.instanceId);
    setPendingAction(null);
    setSelectedCardId(null);
    setSelectedPosition(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingCardId(null);
  }, []);

  const handleFieldDrop = useCallback(async (position: FieldPosition) => {
    if (!draggingCardId) return;

    const card = myState.hand.find(c => c.instanceId === draggingCardId);
    if (!card) return;
    const def = CARD_DATABASE[card.cardId];
    if (!def) return;

    if (phase === 'ride-phase' && isMyTurn && position === 'vanguard') {
      const vgGrade = myState.vanguardCircle
        ? CARD_DATABASE[myState.vanguardCircle.cardId]?.grade ?? 0
        : 0;
      if (def.grade === vgGrade || def.grade === vgGrade + 1) {
        await onAction({ type: 'ride', cardInstanceId: draggingCardId });
      }
    } else if (phase === 'main-phase' && isMyTurn && position !== 'vanguard') {
      const vgGrade = myState.vanguardCircle
        ? CARD_DATABASE[myState.vanguardCircle.cardId]?.grade ?? 0
        : 0;
      if (def.grade > 0 && def.grade <= vgGrade) {
        await onAction({ type: 'call', cardInstanceId: draggingCardId, position: position as RearGuardPosition });
      }
    }

    setDraggingCardId(null);
  }, [draggingCardId, phase, isMyTurn, myState, onAction]);

  // Build context menu options for the selected rear-guard
  const rgMenuOptions = useMemo((): RearGuardMenuOption[] => {
    if (!rgMenu) return [];
    const pos = rgMenu.position;
    const options: RearGuardMenuOption[] = [];

    // Get column partner
    const partner = getColumnPartner(pos);

    if (partner) {
      const partnerCard = myState.rearGuards[partner];
      if (partnerCard) {
        // Both positions occupied → Swap
        const partnerDef = CARD_DATABASE[partnerCard.cardId];
        options.push({
          label: `Swap with ${partnerDef?.name ?? partner}`,
          action: () => onAction({ type: 'swapRearGuards', posA: pos, posB: partner }),
        });
      } else {
        // Partner empty → Move
        const isFront = FRONT_ROW_POSITIONS.includes(pos);
        options.push({
          label: isFront ? 'Move to Back' : 'Move to Front',
          action: () => onAction({ type: 'moveRearGuard', from: pos, to: partner }),
        });
      }
    }

    // ACT ability activation (only affordable ones)
    const unitCard = myState.rearGuards[pos];
    if (unitCard) {
      const affordable = getACTAbilities(unitCard.cardId).filter(a =>
        canPayAbilityCost(a.cost, faceUpDamage, soulCount, handSize, unitCard.isRested));
      affordable.forEach((ability) => {
        const abilities = getAbilitiesForCard(unitCard.cardId);
        const abilityIndex = abilities.indexOf(ability);
        options.push({
          label: `Activate: ${ability.description.split('?')[0].split('!')[0].substring(0, 30)}...`,
          action: () => onAction({ type: 'ability:activate', instanceId: unitCard.instanceId, abilityIndex }),
        });
      });
    }

    // Retire is always available
    options.push({
      label: 'Retire',
      action: () => onAction({ type: 'retireRearGuard', position: pos }),
    });

    return options;
  }, [rgMenu, myState, onAction]);

  // Handle action from ActionPanel (for direct button actions like End Turn, No Guard, etc.)
  const handleAction = useCallback(async (action: GameAction) => {
    if (action.type === 'setup:submitMulligan') {
      // 'Keep Hand' passes empty cardIds; 'Exchange' passes selected mulliganCards
      const cardIds = action.cardIds.length === 0 ? [] : mulliganCards;
      await onAction({ type: 'setup:submitMulligan', cardIds });
      setMulliganCards([]);
    } else {
      await onAction(action);
    }
    setSelectedCardId(null);
    setSelectedPosition(null);
    setPendingAction(null);
  }, [onAction, mulliganCards]);

  // Confirm the pending action
  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction) return;
    await onAction(pendingAction.action);
    setPendingAction(null);
    setSelectedCardId(null);
    setSelectedPosition(null);
    setTriggerEffectTarget(null);
    setBoostChoicePending(false);
  }, [pendingAction, onAction]);

  // Cancel the pending action
  const handleCancelAction = useCallback(() => {
    // If we're in step 2 of split trigger, go back to step 1
    if (triggerEffectTarget !== null) {
      setTriggerEffectTarget(null);
      setPendingAction(null);
      setSelectedPosition(null);
      return;
    }
    setPendingAction(null);
    setPendingBoosterPosition(null);
    setBoostChoicePending(false);
    // Don't clear selection for phases where selection is still useful
    if (phase === 'ride-phase') {
      setSelectedCardId(null);
    }
    // In battle phase, cancel should deselect attacker too
    if (phase === 'battle-phase') {
      setSelectedPosition(null);
    }
  }, [phase, triggerEffectTarget]);

  // Auto-open search results when ability search-select is pending
  const searchPending = phase === 'ability-pending' && gameState.abilityPending?.type === 'search-select' && gameState.abilityPending?.playerId === myId;
  const prevSearchPendingRef = useRef(false);
  useEffect(() => {
    if (searchPending && !prevSearchPendingRef.current) {
      const pending = gameState.abilityPending!;
      setZonePreview({
        label: 'Search Results — Choose a card',
        cards: pending.searchResults ?? [],
      });
    }
    if (!searchPending && prevSearchPendingRef.current) {
      setZonePreview(null);
    }
    prevSearchPendingRef.current = searchPending;
  }, [searchPending, gameState.abilityPending]);

  // Handle clicking a search result card
  const handleSearchSelect = useCallback(async (card: PublicCardInstance) => {
    await onAction({ type: 'ability:searchSelect', cardInstanceId: card.instanceId });
    setZonePreview(null);
  }, [onAction]);

  // Auto-open damage zone when heal damage choice is pending
  const healPending = battle?.healDamageChoicePending ?? false;
  const prevHealPendingRef = useRef(false);
  useEffect(() => {
    if (healPending && !prevHealPendingRef.current) {
      setZonePreview({ label: 'Choose a card to heal', zoneKey: 'my-damage' });
    }
    if (!healPending && prevHealPendingRef.current) {
      // Heal choice resolved — close the zone preview
      setZonePreview(null);
    }
    prevHealPendingRef.current = healPending;
  }, [healPending]);

  // Handle clicking a damage card during heal choice
  const handleHealDamageChoice = useCallback(async (card: PublicCardInstance) => {
    await onAction({ type: 'trigger:chooseHealDamage', damageInstanceId: card.instanceId });
    setZonePreview(null);
  }, [onAction]);

  // Trigger reveal — show for drive check, damage check, and trigger assignment
  // triggerToAssign is set for trigger cards; triggerZone holds the card during check phases (including vanilla)
  const triggerRevealCard = useMemo(() => {
    if (battle?.triggerToAssign) return battle.triggerToAssign;
    // During check phases, the revealed card is in the checking player's triggerZone
    if (phase === 'battle-drive-check' || phase === 'battle-drive-trigger-assign') {
      return isMyTurn ? myState.triggerZone : opponentState.triggerZone;
    }
    if (phase === 'battle-damage-check' || phase === 'battle-damage-trigger-assign') {
      return isMyTurn ? opponentState.triggerZone : myState.triggerZone;
    }
    return null;
  }, [battle?.triggerToAssign, phase, isMyTurn, myState.triggerZone, opponentState.triggerZone]);
  const triggerRevealContext: 'drive' | 'damage' | null = useMemo(() => {
    if (battle?.triggerContext) return battle.triggerContext;
    if (phase === 'battle-drive-check' || phase === 'battle-drive-trigger-assign') return 'drive';
    if (phase === 'battle-damage-check' || phase === 'battle-damage-trigger-assign') return 'damage';
    return null;
  }, [battle?.triggerContext, phase]);
  const [showTriggerOverlay, setShowTriggerOverlay] = useState(false);
  const [triggerExiting, setTriggerExiting] = useState(false);
  const triggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTriggerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = triggerRevealCard?.instanceId ?? null;
    if (currentId && currentId !== prevTriggerIdRef.current) {
      // New trigger appeared — show overlay
      prevTriggerIdRef.current = currentId;
      setShowTriggerOverlay(true);
      setTriggerExiting(false);

      // Clear any previous timer
      if (triggerTimerRef.current) clearTimeout(triggerTimerRef.current);

      // Auto-dismiss after 3 seconds
      triggerTimerRef.current = setTimeout(() => {
        setTriggerExiting(true);
        // Wait for exit animation then hide
        setTimeout(() => {
          setShowTriggerOverlay(false);
          setTriggerExiting(false);
        }, 250);
      }, 3000);
    }

    if (!currentId) {
      // Trigger resolved — hide immediately
      prevTriggerIdRef.current = null;
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
        triggerTimerRef.current = null;
      }
      setShowTriggerOverlay(false);
      setTriggerExiting(false);
    }

    return () => {
      if (triggerTimerRef.current) clearTimeout(triggerTimerRef.current);
    };
  }, [triggerRevealCard]);

  // Damage flash effect
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const prevMyDamageCountRef = useRef(myState.damageZone.length);

  useEffect(() => {
    const currentDamage = myState.damageZone.length;
    if (currentDamage > prevMyDamageCountRef.current) {
      setShowDamageFlash(true);
      const timer = setTimeout(() => setShowDamageFlash(false), 500);
      prevMyDamageCountRef.current = currentDamage;
      return () => clearTimeout(timer);
    }
    prevMyDamageCountRef.current = currentDamage;
  }, [myState.damageZone.length]);

  // Draw animation — detect when hand size increases from deck
  const [myDrawId, setMyDrawId] = useState<string>('');
  const [oppDrawId, setOppDrawId] = useState<string>('');
  const prevMyHandCountRef = useRef(myState.hand.length);
  const prevOppHandCountRef = useRef(opponentState.handCount);
  const prevMyDeckCountRef = useRef(myState.deckCount);
  const prevOppDeckCountRef = useRef(opponentState.deckCount);

  useEffect(() => {
    const myHandNow = myState.hand.length;
    const myDeckNow = myState.deckCount;
    // Detect my draw: hand increased AND deck decreased (not from adding cards via search/etc)
    if (myHandNow > prevMyHandCountRef.current && myDeckNow < prevMyDeckCountRef.current) {
      setMyDrawId(`my-${Date.now()}`);
    }
    prevMyHandCountRef.current = myHandNow;
    prevMyDeckCountRef.current = myDeckNow;
  }, [myState.hand.length, myState.deckCount]);

  const [oppNewCardCount, setOppNewCardCount] = useState(0);

  useEffect(() => {
    const oppHandNow = opponentState.handCount;
    const oppDeckNow = opponentState.deckCount;
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Detect opponent draw: hand increased AND deck decreased
    if (oppHandNow > prevOppHandCountRef.current && oppDeckNow < prevOppDeckCountRef.current) {
      setOppDrawId(`opp-${Date.now()}`);
      setOppNewCardCount(oppHandNow - prevOppHandCountRef.current);
      timer = setTimeout(() => setOppNewCardCount(0), 600);
    }
    prevOppHandCountRef.current = oppHandNow;
    prevOppDeckCountRef.current = oppDeckNow;
    return () => { if (timer) clearTimeout(timer); };
  }, [opponentState.handCount, opponentState.deckCount]);

  return (
    <div className="vg-game">
      {/* Header */}
      <div className="vg-game__header">
        <PhaseBar
          phase={phase}
          isMyTurn={isMyTurn}
          turnPlayerName={opponentState.name}
        />
        <button className="vg-game__leave-btn" onClick={onLeave}>Leave</button>
      </div>

      {/* Error display */}
      {error && <div className="vg-game__error">{error}</div>}

      {/* Main game area */}
      <div className="vg-game__board" ref={boardRef}>
        <BattleArrow battle={battle} boardRef={boardRef} isMyTurn={isMyTurn} />
        {/* Opponent info + hand (above field) */}
        <div className="vg-game__opponent-header">
          <div className="vg-game__opponent-hand">
            {Array.from({ length: opponentState.handCount }, (_, i) => {
              // The last N cards are newly drawn (animate them)
              const isNewCard = oppNewCardCount > 0 && i >= opponentState.handCount - oppNewCardCount;
              return (
                <div
                  key={i}
                  className={`vg-game__opponent-hand-card ${isNewCard ? 'vg-game__opponent-hand-card--entering' : ''}`}
                  style={{ zIndex: i }}
                >
                  <CardBack size="medium" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Opponent side - mirrored (their deck/drop on left, damage on right) */}
        <div className="vg-game__player-side vg-game__opponent-side">
          <div className="vg-game__side-zone vg-game__side-zone--left">
            <DropZone cards={opponentState.dropZone} label="Drop" isOpponent onClick={() => { setZonePreview({ label: `${opponentState.name}'s Drop Zone`, zoneKey: 'opp-drop' }); }} />
            <CardBack size="medium" count={opponentState.deckCount} isOpponent />
          </div>
          <div className="vg-game__field-area">
            <PlayerField
              playerState={opponentState}
              isOpponent={true}
              onCircleClick={handleOpponentCircleClick}
              onCardHover={handleCardHover}
              highlightedPositions={opponentHighlightedPositions}
              powerOverrides={opponentPowerOverrides}
            />
          </div>
          <div className="vg-game__side-zone vg-game__side-zone--right">
            <DamageZone cards={opponentState.damageZone} label="Damage" onClick={() => { setZonePreview({ label: `${opponentState.name}'s Damage Zone`, zoneKey: 'opp-damage' }); }} />
          </div>
        </div>

        {/* Middle zone - matches player-side layout for alignment */}
        <div className="vg-game__middle-zone" ref={guardZoneRef}>
          <div className="vg-game__side-zone vg-game__side-zone--left">
            <div className="vg-game__trigger-zone-pile">
              <div className="vg-game__trigger-zone-pile-slot">
                {opponentState.triggerZone ? (
                  <div className={`vg-game__trigger-zone-pile-card ${CARD_DATABASE[opponentState.triggerZone.cardId]?.triggerType ? `vg-game__trigger-zone-pile-card--${CARD_DATABASE[opponentState.triggerZone.cardId]?.triggerType}` : ''}`}>
                    <VanguardCard card={opponentState.triggerZone} size="medium" showPowerOverlay={false} />
                  </div>
                ) : (
                  <div className="vg-game__trigger-zone-pile-empty">
                    <span className="vg-game__trigger-zone-pile-empty-text">Trigger</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Guard Zone - aligned with field area center */}
          <div className="vg-game__field-area">
            <div className={`vg-game__guard-zone ${battle && battle.guardians.length > 0 ? 'vg-game__guard-zone--active' : ''}`}>
              {battle && battle.guardians.length > 0 ? (
                <>
                  <div className="vg-game__guard-zone-header">Guard Zone</div>
                  <div className="vg-game__guardians">
                    {battle.guardians.map((card) => (
                      <div key={card.instanceId} className="vg-game__guardian-card">
                        <VanguardCard card={card} size="medium" showPowerOverlay={false} showShieldOverlay={true} />
                      </div>
                    ))}
                  </div>
                  <div className="vg-game__guard-zone-total">
                    Shield: {battle.guardians.reduce((sum, c) => sum + (CARD_DATABASE[c.cardId]?.shield ?? 0), 0)}
                  </div>
                </>
              ) : (
                <div className="vg-game__gc-circle">
                  <div className="vg-game__gc-circle-inner">
                    <span className="vg-game__gc-circle-subtext">Guardian Circle</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="vg-game__side-zone vg-game__side-zone--right">
            <div className="vg-game__trigger-zone-pile">
              <div className="vg-game__trigger-zone-pile-slot">
                {myState.triggerZone ? (
                  <div className={`vg-game__trigger-zone-pile-card ${CARD_DATABASE[myState.triggerZone.cardId]?.triggerType ? `vg-game__trigger-zone-pile-card--${CARD_DATABASE[myState.triggerZone.cardId]?.triggerType}` : ''}`}>
                    <VanguardCard card={myState.triggerZone} size="medium" showPowerOverlay={false} />
                  </div>
                ) : (
                  <div className="vg-game__trigger-zone-pile-empty">
                    <span className="vg-game__trigger-zone-pile-empty-text">Trigger</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My side - Damage left, Deck+Drop right */}
        <div className="vg-game__player-side vg-game__my-side" ref={myFieldRef}>
          <div className="vg-game__side-zone vg-game__side-zone--left">
            <DamageZone cards={myState.damageZone} label="Damage" onClick={() => { setZonePreview({ label: 'My Damage Zone', zoneKey: 'my-damage' }); }} />
          </div>
          <div className="vg-game__field-area">
            <PlayerField
              playerState={myState}
              isOpponent={false}
              onCircleClick={handleMyCircleClick}
              onCardClick={handleMyCardClick}
              onCardRightClick={handleMyFieldRightClick}
              onCardHover={handleCardHover}
              highlightedPositions={highlightedPositions}
              abilityGlowPositions={abilityGlowPositions}
              selectedPosition={selectedPosition}
              powerOverrides={myPowerOverrides}
              dropTargetPositions={dropTargetPositions}
              onDrop={handleFieldDrop}
            />
          </div>
          <div className="vg-game__side-zone vg-game__side-zone--right">
            <CardBack size="medium" count={myState.deckCount} onClick={() => { setZonePreview(prev => prev?.zoneKey === 'my-deck' ? null : { label: 'My Deck', zoneKey: 'my-deck' }); }} />
            <DropZone cards={myState.dropZone} label="Drop" onClick={() => { setZonePreview({ label: 'My Drop Zone', zoneKey: 'my-drop' }); }} />
          </div>
        </div>

        {/* Hand */}
        <div className="vg-game__hand-area" ref={handAreaRef}>
          <HandArea
            cards={myState.hand}
            selectedCardId={selectedCardId}
            highlightedCardIds={phase === 'setup-mulligan' ? mulliganCards : highlightedCardIds}
            onCardClick={handleHandCardClick}
            onCardHover={handleCardHover}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>

      </div>

      {/* Action panel - fixed right side */}
      <div className="vg-game__action-area" ref={actionAreaRef}>
        <ActionPanel
          gameState={gameState}
          myId={myId}
          selectedCardId={selectedCardId}
          selectedPosition={selectedPosition}
          onAction={handleAction}
          pendingAction={pendingAction}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
          triggerEffectTarget={triggerEffectTarget}
          boostChoicePending={boostChoicePending}
          boosterName={(() => {
            if (!boostChoicePending || !selectedPosition) return undefined;
            const boostPos = BOOST_COLUMN_REVERSE[selectedPosition] as RearGuardPosition | undefined;
            if (!boostPos) return undefined;
            const card = myState.rearGuards[boostPos];
            return card ? CARD_DATABASE[card.cardId]?.name : undefined;
          })()}
          boosterPower={(() => {
            if (!boostChoicePending || !selectedPosition) return undefined;
            const boostPos = BOOST_COLUMN_REVERSE[selectedPosition] as RearGuardPosition | undefined;
            if (!boostPos) return undefined;
            const card = myState.rearGuards[boostPos];
            return card ? CARD_DATABASE[card.cardId]?.power : undefined;
          })()}
          onAcceptBoost={() => {
            if (!selectedPosition) return;
            const boostPos = BOOST_COLUMN_REVERSE[selectedPosition] as RearGuardPosition | undefined;
            if (boostPos) {
              setPendingBoosterPosition(boostPos);
            }
            setBoostChoicePending(false);
          }}
          onDeclineBoost={() => {
            setPendingBoosterPosition(null);
            setBoostChoicePending(false);
          }}
        />
      </div>

      {/* Card preview panel */}
      {previewCard && (() => {
        const def = CARD_DATABASE[previewCard.cardId];
        if (!def) return null;
        return (
          <div
            className="vg-game__card-preview"
          >
            <div className="vg-game__card-preview-inner">
              <img
                src={def.imagePath}
                alt={def.name}
                className="vg-game__card-preview-image"
                draggable={false}
              />
              <div className="vg-game__card-preview-info">
                <div className="vg-game__card-preview-name">{def.name}</div>
                <div className="vg-game__card-preview-stats">
                  <span>Grade {def.grade}</span>
                  <span>Power {def.power + previewCard.turnPowerModifier + previewCard.battlePowerModifier + previewCard.continuousPowerModifier}</span>
                  {def.shield > 0 && <span>Shield {def.shield}</span>}
                </div>
                {def.triggerType && (
                  <div className="vg-game__card-preview-trigger">
                    {def.triggerType.toUpperCase()} Trigger
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Zone list preview panel */}
      {zonePreview && (
        <div
          className={`vg-game__zone-preview ${previewCard ? 'vg-game__zone-preview--beside-card' : ''}`}
          onClick={() => {
            if (healPending || searchPending) return;
            setZonePreview(null);
          }}
        >
          <div className="vg-game__zone-preview-inner" onClick={(e) => e.stopPropagation()}>
            <div className="vg-game__zone-preview-header">
              <span className="vg-game__zone-preview-title">{zonePreview.label} ({resolvedZonePreviewCards.length})</span>
              {!healPending && !searchPending && (
                <button className="vg-game__zone-preview-close" onClick={() => {
                  setZonePreview(null);
                }}>✕</button>
              )}
            </div>
            <div className="vg-game__zone-preview-list">
              {resolvedZonePreviewCards.length === 0 ? (
                <div className="vg-game__zone-preview-empty">No cards</div>
              ) : zonePreview.zoneKey === 'my-deck' ? (
                // Deck view: grouped by card with counts, sorted by grade
                (() => {
                  const grouped: { cardId: string; count: number }[] = [];
                  const countMap: Record<string, number> = {};
                  for (const card of resolvedZonePreviewCards) {
                    countMap[card.cardId] = (countMap[card.cardId] || 0) + 1;
                  }
                  for (const cardId of Object.keys(countMap)) {
                    grouped.push({ cardId, count: countMap[cardId] });
                  }
                  grouped.sort((a, b) => {
                    const defA = CARD_DATABASE[a.cardId];
                    const defB = CARD_DATABASE[b.cardId];
                    if (!defA || !defB) return 0;
                    if (defA.grade !== defB.grade) return defA.grade - defB.grade;
                    return defA.name.localeCompare(defB.name);
                  });
                  return grouped.map(({ cardId, count }) => {
                    const def = CARD_DATABASE[cardId];
                    if (!def) return null;
                    return (
                      <div
                        key={cardId}
                        className="vg-game__zone-preview-card"
                      >
                        <img
                          src={def.imagePath}
                          alt={def.name}
                          className="vg-game__zone-preview-card-image"
                          draggable={false}
                        />
                        <div className="vg-game__zone-preview-card-info">
                          <span className="vg-game__zone-preview-card-name">{def.name}</span>
                          <span className="vg-game__zone-preview-card-stats">G{def.grade} / {def.power}</span>
                          <span className="vg-game__zone-preview-card-count">x{count}</span>
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                resolvedZonePreviewCards.map((card) => {
                  const def = CARD_DATABASE[card.cardId];
                  if (!def) return null;
                  const isClickable = healPending || searchPending;
                  const handleClick = healPending
                    ? () => handleHealDamageChoice(card)
                    : searchPending
                      ? () => handleSearchSelect(card)
                      : undefined;
                  return (
                    <div
                      key={card.instanceId}
                      className={`vg-game__zone-preview-card ${isClickable ? 'vg-game__zone-preview-card--clickable' : ''}`}
                      onClick={handleClick}
                    >
                      <img
                        src={def.imagePath}
                        alt={def.name}
                        className="vg-game__zone-preview-card-image"
                        draggable={false}
                      />
                      <div className="vg-game__zone-preview-card-info">
                        <span className="vg-game__zone-preview-card-name">{def.name}</span>
                        <span className="vg-game__zone-preview-card-stats">G{def.grade} / {def.power}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rear-guard context menu */}
      {rgMenu && (
        <RearGuardMenu
          x={rgMenu.x}
          y={rgMenu.y}
          options={rgMenuOptions}
          onClose={() => setRgMenu(null)}
        />
      )}

      {/* Trigger reveal overlay — shows for 3 seconds then auto-dismisses */}
      {showTriggerOverlay && triggerRevealCard && (
        <TriggerReveal
          card={triggerRevealCard}
          triggerContext={triggerRevealContext}
          isExiting={triggerExiting}
        />
      )}

      {/* Draw animations */}
      {myDrawId && (
        <DrawAnimation type="my-draw" drawId={myDrawId} />
      )}
      {oppDrawId && (
        <DrawAnimation type="opponent-draw" drawId={oppDrawId} />
      )}

      {/* Damage flash overlay */}
      {showDamageFlash && (
        <div className="vg-game__damage-flash" />
      )}

      {/* Ability activation overlay — shows card prominently when may-activate is pending */}
      {phase === 'ability-pending' &&
        gameState.abilityPending?.type === 'may-activate' &&
        gameState.abilityPending.playerId === myId && (
          <AbilityOverlay
            pending={gameState.abilityPending}
            onAction={handleAction}
          />
      )}

      {/* ACT skill activation overlay */}
      {actSkillOverlay && (() => {
        const def = CARD_DATABASE[actSkillOverlay.cardId];
        if (!def) return null;
        const { abilities } = actSkillOverlay;
        return (
          <div className="ability-overlay">
            <div className="ability-overlay__backdrop" onClick={() => setActSkillOverlay(null)} />
            <div className="ability-overlay__content">
              <div className="ability-overlay__card-wrapper">
                <div className="ability-overlay__card-glow" />
                <img
                  src={def.imagePath}
                  alt={def.name}
                  className="ability-overlay__card-image"
                  draggable={false}
                />
              </div>
              <div className="ability-overlay__card-name">{def.name}</div>
              {abilities.length === 1 ? (
                <>
                  <div className="ability-overlay__description">
                    [ACT] {abilities[0].description}
                  </div>
                  <div className="ability-overlay__buttons">
                    <button
                      className="ability-overlay__btn ability-overlay__btn--activate"
                      onClick={() => {
                        handleAction({
                          type: 'ability:activate',
                          instanceId: actSkillOverlay.instanceId,
                          abilityIndex: abilities[0].abilityIndex,
                        });
                        setActSkillOverlay(null);
                      }}
                    >
                      Activate
                    </button>
                    <button
                      className="ability-overlay__btn ability-overlay__btn--decline"
                      onClick={() => setActSkillOverlay(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="ability-overlay__description" style={{ marginBottom: 4 }}>
                    Choose a skill to activate:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
                    {abilities.map((ab, i) => (
                      <button
                        key={i}
                        className="ability-overlay__btn ability-overlay__btn--activate"
                        style={{ textTransform: 'none', fontSize: 13, padding: '10px 20px', textAlign: 'left', letterSpacing: 0 }}
                        onClick={() => {
                          handleAction({
                            type: 'ability:activate',
                            instanceId: actSkillOverlay.instanceId,
                            abilityIndex: ab.abilityIndex,
                          });
                          setActSkillOverlay(null);
                        }}
                      >
                        [ACT] {ab.description}
                      </button>
                    ))}
                  </div>
                  <div className="ability-overlay__buttons" style={{ marginTop: 8 }}>
                    <button
                      className="ability-overlay__btn ability-overlay__btn--decline"
                      onClick={() => setActSkillOverlay(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* RPS overlay */}
      <RPSOverlay gameState={gameState} onAction={handleAction} />

      {/* Phase announcement overlay */}
      {phaseAnnouncement && (
        <div className="vg-game__phase-announcement">
          <div className="vg-game__phase-announcement-content">
            <div className="vg-game__phase-announcement-label">{phaseAnnouncementTurn}</div>
            <div className="vg-game__phase-announcement-text">{phaseAnnouncement}</div>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {phase === 'game-over' && (
        <div className="vg-game__overlay">
          <div className="vg-game__game-over">
            <h1>{gameState.winner === myId ? 'VICTORY!' : 'DEFEAT'}</h1>
            <p>{gameState.winner === myId ? 'You won the cardfight!' : `${opponentState.name} wins!`}</p>
            <button onClick={onLeave}>Return to Lobby</button>
          </div>
        </div>
      )}

    </div>
  );
};
