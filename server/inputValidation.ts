/**
 * Validates the raw shape of a CustomDeckComposition before game-rule validation.
 * Returns an error string if invalid, null if structurally valid.
 */
export function validateDeckShape(deck: unknown): string | null {
  if (typeof deck !== 'object' || deck === null) {
    return 'Invalid deck data';
  }

  const d = deck as Record<string, unknown>;

  if (typeof d.name !== 'string' || d.name.length > 100) {
    return 'Invalid deck name';
  }

  if (typeof d.starterVanguardId !== 'string' || d.starterVanguardId.length > 50) {
    return 'Invalid starter vanguard ID';
  }

  if (!Array.isArray(d.cards)) {
    return 'Invalid cards list';
  }

  if (d.cards.length > 60) {
    return 'Too many card entries';
  }

  for (const entry of d.cards) {
    if (typeof entry !== 'object' || entry === null) {
      return 'Invalid card entry';
    }
    const e = entry as Record<string, unknown>;
    if (typeof e.cardId !== 'string' || e.cardId.length > 50) {
      return 'Invalid card ID';
    }
    if (typeof e.count !== 'number' || !Number.isInteger(e.count) || e.count < 0 || e.count > 4) {
      return 'Invalid card count';
    }
  }

  return null;
}

/**
 * Sanitize a player name from an untrusted source.
 * Trims, strips dangerous characters, enforces max 20 chars.
 */
export function sanitizePlayerName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Guest';

  let name = raw.trim();
  name = name.replace(/[<>&"'\/\\]/g, '');
  name = name.substring(0, 20).trim();

  return name.length === 0 ? 'Guest' : name;
}
