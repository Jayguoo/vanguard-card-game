import React, { useEffect, useRef } from 'react';
import { RearGuardPosition, FRONT_ROW_POSITIONS, BACK_ROW_POSITIONS, BOOST_COLUMN_MAP, BOOST_COLUMN_REVERSE } from '../../shared/types';
import './RearGuardMenu.css';

export interface RearGuardMenuOption {
  label: string;
  action: () => void;
}

interface RearGuardMenuProps {
  x: number;
  y: number;
  options: RearGuardMenuOption[];
  onClose: () => void;
}

export const RearGuardMenu: React.FC<RearGuardMenuProps> = ({
  x,
  y,
  options,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use timeout to prevent the same right-click from closing it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (options.length === 0) return null;

  // Keep menu within viewport
  const style: React.CSSProperties = {
    left: x,
    top: y,
  };

  return (
    <div className="rg-menu-overlay" onContextMenu={(e) => e.preventDefault()}>
      <div className="rg-menu" ref={menuRef} style={style}>
        {options.map((opt, i) => (
          <button
            key={i}
            className="rg-menu__item"
            onClick={() => {
              opt.action();
              onClose();
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Get the column partner position for a rear-guard.
 * front-left ↔ back-left, front-right ↔ back-right
 * back-center has no front partner (vanguard is not movable)
 */
export function getColumnPartner(position: RearGuardPosition): RearGuardPosition | null {
  if (FRONT_ROW_POSITIONS.includes(position)) {
    // Front row → get back row partner
    const backPos = BOOST_COLUMN_REVERSE[position];
    return backPos ?? null;
  }
  if (BACK_ROW_POSITIONS.includes(position)) {
    // Back row → get front row partner
    const frontPos = BOOST_COLUMN_MAP[position];
    // back-center maps to 'vanguard', which is not a RearGuardPosition
    if (frontPos === 'vanguard') return null;
    return frontPos as RearGuardPosition;
  }
  return null;
}
