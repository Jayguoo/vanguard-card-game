import React, { useEffect, useRef } from 'react';
import './Playmat.css';

interface PlaymatProps {
  children: React.ReactNode;
  className?: string;
}

export const Playmat = React.memo(React.forwardRef<HTMLDivElement, PlaymatProps>(
  ({ children, className = '' }, forwardedRef) => {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const surfaceRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const viewport = viewportRef.current;
      const surface = surfaceRef.current;
      if (!viewport || !surface) return;

      const updateScale = () => {
        const availableWidth = Math.max(viewport.clientWidth - 16, 1);
        const availableHeight = Math.max(viewport.clientHeight - 12, 1);
        const scale = Math.max(0.62, Math.min(availableWidth / 1280, availableHeight / 720, 1.5));
        viewport.style.setProperty('--playmat-scale', scale.toFixed(4));
      };

      const observer = new ResizeObserver(updateScale);
      observer.observe(viewport);
      updateScale();
      return () => observer.disconnect();
    }, []);

    const setSurfaceRef = (node: HTMLDivElement | null) => {
      surfaceRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    return (
      <div className="playmat-viewport" ref={viewportRef}>
        <div className="playmat-stage">
          <div className={`playmat ${className}`.trim()} ref={setSurfaceRef}>
            {children}
          </div>
        </div>
      </div>
    );
  },
));
Playmat.displayName = 'Playmat';

interface ZoneProps {
  label: string;
  count?: number;
  variant?: 'damage' | 'deck' | 'drop' | 'trigger' | 'utility';
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Zone = React.memo<ZoneProps>(({
  label,
  count,
  variant = 'utility',
  children,
  onClick,
  className = '',
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };

  return (
    <section
      className={`playmat-zone playmat-zone--${variant} ${onClick ? 'playmat-zone--interactive' : ''} ${className}`.trim()}
      aria-label={`${label}${count === undefined ? '' : `, ${count} cards`}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <header className="playmat-zone__header">
        <span>{label}</span>
        {count !== undefined && <strong>{count}</strong>}
      </header>
      {children && <div className="playmat-zone__content">{children}</div>}
    </section>
  );
});
Zone.displayName = 'Zone';

interface PlayerHUDProps {
  name: string;
  avatarImage?: string;
  side: 'self' | 'opponent';
  isTurn: boolean;
  turnNumber: number;
  damage: number;
  hand: number;
  deck: number;
  soul: number;
}

export const PlayerHUD = React.memo<PlayerHUDProps>(({ 
  name,
  avatarImage,
  side,
  isTurn,
  turnNumber,
  damage,
  hand,
  deck,
  soul,
}) => {
  const avatarLabel = name.trim().charAt(0).toUpperCase() || 'V';

  return (
    <section className={`player-hud player-hud--${side} ${isTurn ? 'player-hud--active' : ''}`}>
      <div className="player-hud__avatar" aria-hidden="true">
        {avatarImage ? (
          <img className="player-hud__avatar-image" src={avatarImage} alt="" draggable={false} />
        ) : avatarLabel}
      </div>
      <div className="player-hud__panel">
        <div className="player-hud__identity">
          <span className="player-hud__signal" aria-hidden="true" />
          <strong>{side === 'self' ? 'YOU' : name}</strong>
          <span>{isTurn ? `TURN ${turnNumber} ACTIVE` : 'STANDBY'}</span>
        </div>
        <dl className="player-hud__telemetry">
          <div><dt>DAMAGE</dt><dd>{damage}/6</dd></div>
          <div><dt>DECK</dt><dd>{deck}</dd></div>
          <div><dt>HAND</dt><dd>{hand}</dd></div>
          <div><dt>SOUL</dt><dd>{soul}</dd></div>
        </dl>
      </div>
    </section>
  );
});
PlayerHUD.displayName = 'PlayerHUD';

interface InteractionOverlayProps {
  title: string;
  metric?: string;
  variant?: 'idle' | 'battle' | 'guard' | 'trigger' | 'ability';
  children: React.ReactNode;
}

export const InteractionOverlay = React.memo(React.forwardRef<HTMLDivElement, InteractionOverlayProps>(
  ({ title, metric, variant = 'idle', children }, ref) => (
    <section className={`interaction-overlay interaction-overlay--${variant}`} ref={ref}>
      <header className="interaction-overlay__header">
        <span>{title}</span>
        {metric && <strong>{metric}</strong>}
      </header>
      <div className="interaction-overlay__content">{children}</div>
    </section>
  ),
));
InteractionOverlay.displayName = 'InteractionOverlay';
