import React, { useState, useEffect, useCallback } from 'react';
import { PublicBattleState, FieldPosition } from '../../shared/types';
import './BattleArrow.css';

interface BattleArrowProps {
  battle: PublicBattleState | null;
  boardRef: React.RefObject<HTMLElement | null>;
  isMyTurn: boolean;
}

function getCircleCenter(
  boardEl: HTMLElement,
  position: FieldPosition,
  owner: 'self' | 'opponent'
): { x: number; y: number } | null {
  const el = boardEl.querySelector<HTMLElement>(
    `[data-position="${position}"][data-owner="${owner}"]`
  );
  if (!el) return null;
  const boardRect = boardEl.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return {
    x: elRect.left + elRect.width / 2 - boardRect.left,
    y: elRect.top + elRect.height / 2 - boardRect.top,
  };
}

export const BattleArrow: React.FC<BattleArrowProps> = ({ battle, boardRef, isMyTurn }) => {
  const [points, setPoints] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);

  const updatePoints = useCallback(() => {
    const boardEl = boardRef.current;
    if (!boardEl || !battle?.attackingPosition || !battle?.targetPosition) {
      setPoints(null);
      return;
    }

    // Attacker is on the turn player's field, target is on the other
    const attackerOwner = isMyTurn ? 'self' : 'opponent';
    const targetOwner = isMyTurn ? 'opponent' : 'self';
    const from = getCircleCenter(boardEl, battle.attackingPosition, attackerOwner);
    const to = getCircleCenter(boardEl, battle.targetPosition, targetOwner);

    if (from && to) {
      setPoints({ from, to });
    } else {
      setPoints(null);
    }
  }, [battle, boardRef]);

  useEffect(() => {
    updatePoints();
    window.addEventListener('resize', updatePoints);
    window.addEventListener('scroll', updatePoints, true);
    return () => {
      window.removeEventListener('resize', updatePoints);
      window.removeEventListener('scroll', updatePoints, true);
    };
  }, [updatePoints]);

  if (!points) return null;

  const { from, to } = points;

  // Calculate arrow direction for the arrowhead
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  // Shorten the line so the arrowhead doesn't overlap the card
  const shortenBy = 40;
  const nx = dx / len;
  const ny = dy / len;
  const endX = to.x - nx * shortenBy;
  const endY = to.y - ny * shortenBy;
  const startX = from.x + nx * shortenBy;
  const startY = from.y + ny * shortenBy;

  return (
    <svg className="battle-arrow" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 30 }}>
      <defs>
        <marker
          id="battle-arrowhead"
          markerWidth="12"
          markerHeight="10"
          refX="10"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L12,5 L0,10 L3,5 Z" fill="rgba(255, 60, 60, 0.9)" />
        </marker>
        <filter id="battle-arrow-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Glow line behind */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="rgba(255, 40, 40, 0.25)"
        strokeWidth="8"
        strokeLinecap="round"
        filter="url(#battle-arrow-glow)"
        className="battle-arrow__glow"
      />
      {/* Main arrow line */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="rgba(255, 60, 60, 0.85)"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd="url(#battle-arrowhead)"
        className="battle-arrow__line"
      />
    </svg>
  );
};
