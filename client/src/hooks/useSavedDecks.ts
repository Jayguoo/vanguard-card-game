import { useState, useCallback } from 'react';
import { CustomDeckComposition } from '../shared/types';

const STORAGE_KEY = 'vanguard-custom-decks';
export const MAX_CUSTOM_DECKS = 4;

export interface SavedDeck {
  id: string;
  name: string;
  createdAt: number;
  composition: CustomDeckComposition;
}

function loadDecks(): SavedDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistDecks(decks: SavedDeck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export function useSavedDecks() {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(loadDecks);

  const saveDeck = useCallback((composition: CustomDeckComposition, existingId?: string): SavedDeck | null => {
    const id = existingId ?? `deck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const deck: SavedDeck = {
      id,
      name: composition.name,
      createdAt: Date.now(),
      composition,
    };

    let blocked = false;
    setSavedDecks(prev => {
      const idx = prev.findIndex(d => d.id === id);
      // Block new decks if at limit
      if (idx < 0 && prev.length >= MAX_CUSTOM_DECKS) {
        blocked = true;
        return prev;
      }
      const next = idx >= 0
        ? prev.map(d => d.id === id ? deck : d)
        : [...prev, deck];
      persistDecks(next);
      return next;
    });

    if (blocked) return null;

    return deck;
  }, []);

  const deleteDeck = useCallback((id: string) => {
    setSavedDecks(prev => {
      const next = prev.filter(d => d.id !== id);
      persistDecks(next);
      return next;
    });
  }, []);

  return { savedDecks, saveDeck, deleteDeck };
}
