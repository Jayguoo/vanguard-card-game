import { Card, GameRoom, Player } from '../shared/types';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Creates a fresh 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        suit,
        value,
        id: `card-${id++}`,
      });
    }
  }

  return deck;
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Deal cards to all players
 */
export function dealCards(room: GameRoom, cardsPerPlayer: number = 7): void {
  room.deck = shuffleDeck(createDeck());

  for (const player of room.players) {
    player.hand = room.deck.splice(0, cardsPerPlayer);
  }

  // Place first card on discard pile
  const firstCard = room.deck.shift();
  if (firstCard) {
    room.discardPile = [firstCard];
  }
}

/**
 * Draw a card from the deck
 */
export function drawCard(room: GameRoom, player: Player): Card | null {
  if (room.deck.length === 0) {
    // Reshuffle discard pile (except top card) into deck
    if (room.discardPile.length > 1) {
      const topCard = room.discardPile.pop()!;
      room.deck = shuffleDeck(room.discardPile);
      room.discardPile = [topCard];
    } else {
      return null; // No cards left
    }
  }

  const card = room.deck.shift();
  if (card) {
    player.hand.push(card);
  }
  return card || null;
}

/**
 * Play a card from player's hand to discard pile
 */
export function playCard(room: GameRoom, player: Player, cardId: string): Card | null {
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);

  if (cardIndex === -1) {
    return null;
  }

  const [card] = player.hand.splice(cardIndex, 1);
  room.discardPile.push(card);

  return card;
}

/**
 * Check if a card can be played (simple matching rules - same suit or value)
 */
export function canPlayCard(card: Card, topCard: Card | undefined): boolean {
  if (!topCard) return true;
  return card.suit === topCard.suit || card.value === topCard.value;
}

/**
 * Get the top card of the discard pile
 */
export function getTopCard(room: GameRoom): Card | undefined {
  return room.discardPile[room.discardPile.length - 1];
}

/**
 * Move to the next player's turn
 */
export function nextTurn(room: GameRoom): string {
  room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
  return room.players[room.currentPlayerIndex].id;
}

/**
 * Check if a player has won (no cards left)
 */
export function checkWinner(room: GameRoom): Player | null {
  return room.players.find((p) => p.hand.length === 0) || null;
}

/**
 * Get current player
 */
export function getCurrentPlayer(room: GameRoom): Player {
  return room.players[room.currentPlayerIndex];
}
