import React from 'react';
import { PublicAbilityPendingState, GameAction } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import './AbilityOverlay.css';

interface AbilityOverlayProps {
  pending: PublicAbilityPendingState;
  onAction: (action: GameAction) => Promise<void>;
}

export const AbilityOverlay: React.FC<AbilityOverlayProps> = ({
  pending,
  onAction,
}) => {
  const def = CARD_DATABASE[pending.cardId];
  if (!def) return null;

  return (
    <div className="ability-overlay">
      <div className="ability-overlay__backdrop" />
      <div className="ability-overlay__content">
        {/* Card display with golden glow */}
        <div className="ability-overlay__card-wrapper">
          <div className="ability-overlay__card-glow" />
          <img
            src={def.imagePath}
            alt={def.name}
            className="ability-overlay__card-image"
            draggable={false}
          />
        </div>

        {/* Card name */}
        <div className="ability-overlay__card-name">{def.name}</div>

        {/* Ability description */}
        <div className="ability-overlay__description">
          {pending.description}
        </div>

        {/* Cost info */}
        {pending.costDescription && (
          <div className="ability-overlay__cost">
            Cost: {pending.costDescription}
          </div>
        )}

        {/* Action buttons */}
        <div className="ability-overlay__buttons">
          <button
            className="ability-overlay__btn ability-overlay__btn--activate"
            onClick={() => onAction({ type: 'ability:confirm' })}
          >
            Activate
          </button>
          {pending.optional && (
            <button
              className="ability-overlay__btn ability-overlay__btn--decline"
              onClick={() => onAction({ type: 'ability:decline' })}
            >
              Decline
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
