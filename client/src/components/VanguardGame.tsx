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
} from '../shared/types';
import { CARD_DATABASE } from '../shared/cardDatabase';
import { PlayerField } from './field/PlayerField';
import { DamageZone } from './field/DamageZone';
import { DropZone } from './field/DropZone';
import { HandArea } from './cards/HandArea';
import { VanguardCard, CardBack } from './cards/VanguardCard';
import { ActionPanel } from './battle/ActionPanel';
import { TriggerReveal } from './battle/TriggerReveal';
import { BattleArrow } from './battle/BattleArrow';
import { RPSOverlay } from './battle/RPSOverlay';
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
  const [triggerEffectTarget, setTriggerEffectTarget] = useState<string | null>(null);

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

  // Auto-scroll when phase changes
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;
    setPendingAction(null);
    setTriggerEffectTarget(null);

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
      } else if (phase === 'game-over') {
        // No scroll needed, overlay covers everything
      } else {
        scrollTo(actionAreaRef);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [phase, isDefender, scrollTo]);

  // Determine highlighted cards in hand based on phase
  const highlightedCardIds = useMemo(() => {
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
    if (phase === 'main-phase' && isMyTurn && selectedCardId) {
      // Highlight empty RC positions where the card can be called
      const positions: FieldPosition[] = [];
      for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
        positions.push(pos);
      }
      return positions;
    }

    if (phase === 'battle-phase' && isMyTurn) {
      // Highlight standing attackers
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
  }, [phase, isMyTurn, isDefender, selectedCardId, myState, battle]);

  // Highlighted opponent positions (attack targets)
  const opponentHighlightedPositions = useMemo((): FieldPosition[] => {
    if (phase === 'battle-attack-step' || (phase === 'battle-phase' && isMyTurn && selectedPosition)) {
      const positions: FieldPosition[] = [];
      if (opponentState.vanguardCircle) positions.push('vanguard');
      for (const pos of FRONT_ROW_POSITIONS as RearGuardPosition[]) {
        if (opponentState.rearGuards[pos]) positions.push(pos);
      }
      return positions;
    }
    return [];
  }, [phase, isMyTurn, selectedPosition, opponentState]);

  // Handle hand card click
  const handleHandCardClick = useCallback(async (card: PublicCardInstance) => {
    // Always show preview when clicking a hand card (close zone preview)
    setPreviewCard(prev => {
      const next = prev?.instanceId === card.instanceId ? null : card;
      if (next) setZonePreview(null);
      return next;
    });

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

    // Trigger assignment - clicking hand cards does nothing
  }, [phase, isMyTurn, isDefender, myState, onAction, scrollTo]);

  // Handle my field circle click
  const handleMyCircleClick = useCallback(async (position: FieldPosition) => {
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

    if (phase === 'battle-phase' && isMyTurn) {
      // Select attacker (selection only — no action dispatched)
      setPendingAction(null);
      setSelectedPosition(prev => prev === position ? null : position);
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
  }, [phase, isMyTurn, isDefender, selectedCardId, battle, myState, triggerEffectTarget, onAction, scrollTo]);

  // Handle opponent field click (for attack target selection)
  const handleOpponentCircleClick = useCallback(async (position: FieldPosition) => {
    if (phase === 'battle-phase' && isMyTurn && selectedPosition) {
      const attackerCard = selectedPosition === 'vanguard'
        ? myState.vanguardCircle
        : myState.rearGuards[selectedPosition as RearGuardPosition];
      const targetCard = position === 'vanguard'
        ? opponentState.vanguardCircle
        : opponentState.rearGuards[position as RearGuardPosition];
      const attackerDef = attackerCard ? CARD_DATABASE[attackerCard.cardId] : null;
      const targetDef = targetCard ? CARD_DATABASE[targetCard.cardId] : null;
      setPendingAction({
        action: {
          type: 'attack:declare',
          attackerPosition: selectedPosition,
          targetPosition: position,
        },
        description: `Attack ${targetDef?.name ?? 'unit'} with ${attackerDef?.name ?? 'unit'}?`,
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
  }, [phase, isMyTurn, isDefender, selectedPosition, myState, opponentState, scrollTo]);

  // Handle intercept from my field during guard step + always show preview
  const handleMyCardClick = useCallback(async (position: FieldPosition, card: PublicCardInstance) => {
    // Clicking vanguard shows the soul zone preview
    if (position === 'vanguard') {
      setPreviewCard(null);
      setZonePreview(prev =>
        prev?.zoneKey === 'my-soul' ? null : { label: 'Soul', zoneKey: 'my-soul' }
      );
      return;
    }
    setPreviewCard(prev => {
      const next = prev?.instanceId === card.instanceId ? null : card;
      if (next) setZonePreview(null);
      return next;
    });
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
  }, [phase, isDefender, isMyTurn, selectedCardId, scrollTo]);

  // Handle right-click on my rear-guard for context menu
  const handleMyFieldRightClick = useCallback((position: FieldPosition, card: PublicCardInstance, e: React.MouseEvent) => {
    // Always show preview (close zone preview)
    setPreviewCard(prev => {
      const next = prev?.instanceId === card.instanceId ? null : card;
      if (next) setZonePreview(null);
      return next;
    });

    // Only show context menu for rear-guards during main phase on my turn
    if (position === 'vanguard') return;
    if (phase !== 'main-phase' || !isMyTurn) return;

    setRgMenu({ position: position as RearGuardPosition, x: e.clientX, y: e.clientY });
  }, [phase, isMyTurn]);

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
    // Don't clear selection for phases where selection is still useful
    if (phase === 'ride-phase') {
      setSelectedCardId(null);
    }
  }, [phase, triggerEffectTarget]);

  // Auto-open damage zone when heal damage choice is pending
  const healPending = battle?.healDamageChoicePending ?? false;
  const prevHealPendingRef = useRef(false);
  useEffect(() => {
    if (healPending && !prevHealPendingRef.current) {
      setPreviewCard(null);
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
            {Array.from({ length: opponentState.handCount }, (_, i) => (
              <div key={i} className="vg-game__opponent-hand-card" style={{ marginLeft: i > 0 ? '-40px' : '0' }}>
                <CardBack size="medium" />
              </div>
            ))}
          </div>
        </div>

        {/* Opponent side - mirrored (their deck/drop on left, damage on right) */}
        <div className="vg-game__player-side vg-game__opponent-side">
          <div className="vg-game__side-zone vg-game__side-zone--left">
            <DropZone cards={opponentState.dropZone} label="Drop" isOpponent onClick={() => { setPreviewCard(null); setZonePreview({ label: `${opponentState.name}'s Drop Zone`, zoneKey: 'opp-drop' }); }} />
            <CardBack size="medium" count={opponentState.deckCount} />
          </div>
          <div className="vg-game__field-area">
            <PlayerField
              playerState={opponentState}
              isOpponent={true}
              onCircleClick={handleOpponentCircleClick}
              onCardClick={(_pos, card) => setPreviewCard(prev => {
                const next = prev?.instanceId === card.instanceId ? null : card;
                if (next) setZonePreview(null);
                return next;
              })}
              highlightedPositions={opponentHighlightedPositions}
              powerOverrides={opponentPowerOverrides}
            />
          </div>
          <div className="vg-game__side-zone vg-game__side-zone--right">
            <DamageZone cards={opponentState.damageZone} label="Damage" onClick={() => { setPreviewCard(null); setZonePreview({ label: `${opponentState.name}'s Damage Zone`, zoneKey: 'opp-damage' }); }} />
          </div>
        </div>

        {/* Guard Zone - between the two fields */}
        <div className="vg-game__guard-zone" ref={guardZoneRef}>
          {battle && battle.guardians.length > 0 ? (
            <div className="vg-game__guardians">
              {battle.guardians.map((card) => (
                <div key={card.instanceId} className="vg-game__guardian-card">
                  <VanguardCard card={card} size="small" showPowerOverlay={false} />
                </div>
              ))}
            </div>
          ) : (
            <div className="vg-game__guard-zone-label">GUARD ZONE</div>
          )}
        </div>

        {/* My side - Damage left, Deck+Drop right */}
        <div className="vg-game__player-side vg-game__my-side" ref={myFieldRef}>
          <div className="vg-game__side-zone vg-game__side-zone--left">
            <DamageZone cards={myState.damageZone} label="Damage" onClick={() => { setPreviewCard(null); setZonePreview({ label: 'My Damage Zone', zoneKey: 'my-damage' }); }} />
          </div>
          <div className="vg-game__field-area">
            <PlayerField
              playerState={myState}
              isOpponent={false}
              onCircleClick={handleMyCircleClick}
              onCardClick={handleMyCardClick}
              onCardRightClick={handleMyFieldRightClick}
              highlightedPositions={highlightedPositions}
              selectedPosition={selectedPosition}
              powerOverrides={myPowerOverrides}
            />
          </div>
          <div className="vg-game__side-zone vg-game__side-zone--right">
            <CardBack size="medium" count={myState.deckCount} onClick={() => { setPreviewCard(null); setZonePreview(prev => prev?.zoneKey === 'my-deck' ? null : { label: 'My Deck', zoneKey: 'my-deck' }); }} />
            <DropZone cards={myState.dropZone} label="Drop" onClick={() => { setPreviewCard(null); setZonePreview({ label: 'My Drop Zone', zoneKey: 'my-drop' }); }} />
          </div>
        </div>

        {/* Hand */}
        <div className="vg-game__hand-area" ref={handAreaRef}>
          <HandArea
            cards={myState.hand}
            selectedCardId={selectedCardId}
            highlightedCardIds={phase === 'setup-mulligan' ? mulliganCards : highlightedCardIds}
            onCardClick={handleHandCardClick}
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
        />
      </div>

      {/* Card preview panel */}
      {previewCard && (() => {
        const def = CARD_DATABASE[previewCard.cardId];
        if (!def) return null;
        return (
          <div className="vg-game__card-preview" onClick={() => setPreviewCard(null)}>
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
                  <span>Power {def.power + previewCard.turnPowerModifier}</span>
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
        <div className="vg-game__zone-preview" onClick={() => !healPending && setZonePreview(null)}>
          <div className="vg-game__zone-preview-inner" onClick={(e) => e.stopPropagation()}>
            <div className="vg-game__zone-preview-header">
              <span className="vg-game__zone-preview-title">{zonePreview.label} ({resolvedZonePreviewCards.length})</span>
              {!healPending && (
                <button className="vg-game__zone-preview-close" onClick={() => setZonePreview(null)}>✕</button>
              )}
            </div>
            <div className="vg-game__zone-preview-list">
              {resolvedZonePreviewCards.length === 0 ? (
                <div className="vg-game__zone-preview-empty">No cards</div>
              ) : (
                resolvedZonePreviewCards.map((card) => {
                  const def = CARD_DATABASE[card.cardId];
                  if (!def) return null;
                  return (
                    <div
                      key={card.instanceId}
                      className={`vg-game__zone-preview-card ${healPending ? 'vg-game__zone-preview-card--clickable' : ''}`}
                      onClick={healPending ? () => handleHealDamageChoice(card) : undefined}
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

      {/* Damage flash overlay */}
      {showDamageFlash && (
        <div className="vg-game__damage-flash" />
      )}

      {/* RPS overlay */}
      <RPSOverlay gameState={gameState} onAction={handleAction} />

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
