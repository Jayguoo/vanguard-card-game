import React, { useState } from 'react';
import { PublicCardInstance } from '../../shared/types';
import { VanguardCard } from '../cards/VanguardCard';
import './SoulViewer.css';

interface SoulViewerProps {
  count: number;
  cards?: PublicCardInstance[];
}

export const SoulViewer: React.FC<SoulViewerProps> = ({ count, cards }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (cards && cards.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const canExpand = cards && cards.length > 0;

  return (
    <div className="soul-viewer">
      <div
        className={`soul-viewer__counter ${canExpand ? 'soul-viewer__counter--clickable' : ''}`}
        onClick={handleClick}
        title={canExpand ? 'Click to view soul cards' : 'Soul'}
      >
        <span className="soul-viewer__icon">S</span>
        <span className="soul-viewer__count">{count}</span>
      </div>

      {isExpanded && cards && cards.length > 0 && (
        <div className="soul-viewer__overlay" onClick={() => setIsExpanded(false)}>
          <div
            className="soul-viewer__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="soul-viewer__header">
              <span className="soul-viewer__title">Soul ({cards.length})</span>
              <button
                className="soul-viewer__close"
                onClick={() => setIsExpanded(false)}
              >
                X
              </button>
            </div>
            <div className="soul-viewer__cards">
              {cards.map((card) => (
                <div key={card.instanceId} className="soul-viewer__card-item">
                  <VanguardCard
                    card={card}
                    size="small"
                    showPowerOverlay={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
