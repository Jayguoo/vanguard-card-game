import React, { useState, useEffect, useRef } from 'react';
import './DrawAnimation.css';

interface DrawAnimationProps {
  /** Which player drew — determines start/end positions */
  type: 'my-draw' | 'opponent-draw';
  /** Unique key to trigger a new animation */
  drawId: string;
  /** Called when animation completes */
  onComplete?: () => void;
}

/**
 * Renders a floating card back that flies from the deck position to the hand area.
 * Uses CSS custom properties to define start/end positions based on who is drawing.
 */
export const DrawAnimation: React.FC<DrawAnimationProps> = ({
  type,
  drawId,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);
  const prevDrawIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (drawId && drawId !== prevDrawIdRef.current) {
      prevDrawIdRef.current = drawId;
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 500); // Match animation duration

      return () => clearTimeout(timer);
    }
  }, [drawId, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`draw-animation draw-animation--${type}`}
      key={drawId}
    >
      <div className="draw-animation__card">
        <img
          src="/cards/card-back.webp"
          alt="Drawing card"
          className="draw-animation__card-image"
          draggable={false}
          style={type === 'opponent-draw' ? { transform: 'rotate(180deg)' } : undefined}
        />
      </div>
    </div>
  );
};
