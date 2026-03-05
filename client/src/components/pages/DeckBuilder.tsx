import { useState, useMemo } from 'react';
import { CustomDeckComposition, CardDefinition, Clan, TriggerType } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import { SavedDeck, MAX_CUSTOM_DECKS } from '../../hooks/useSavedDecks';
import './DeckBuilder.css';

interface DeckBuilderProps {
  onClose: () => void;
  onSave: (composition: CustomDeckComposition, existingId?: string) => SavedDeck | null;
  onUse: (composition: CustomDeckComposition) => void;
  editingDeck?: SavedDeck | null;
  savedDeckCount?: number;
}

type GradeFilter = 'all' | 0 | 1 | 2 | 3;
type ClanFilter = 'all' | Clan;
type TriggerFilter = 'all' | 'none' | TriggerType;

interface DeckEntry {
  cardId: string;
  count: number;
}

const ALL_CARDS = Object.values(CARD_DATABASE);

const CLAN_LABELS: Record<string, string> = {
  'royal-paladin': 'RP',
  'kagero': 'KG',
  'nova-grappler': 'NG',
  'oracle-think-tank': 'OTT',
  'spike-brothers': 'SB',
  'tachikaze': 'TK',
  'nubatama': 'NB',
  'dark-irregulars': 'DI',
  'granblue': 'GB',
  'megacolony': 'MC',
  'bermuda-triangle': 'BT',
  'great-nature': 'GN',
  'pale-moon': 'PM',
  'murakumo': 'MK',
};

const AVAILABLE_CLANS: ClanFilter[] = ['all', ...([...new Set(ALL_CARDS.map(c => c.clan))].sort() as Clan[])];

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  onClose,
  onSave,
  onUse,
  editingDeck,
  savedDeckCount = 0,
}) => {
  // Deck state
  const [deckName, setDeckName] = useState(editingDeck?.composition.name ?? '');
  const [starterVanguardId, setStarterVanguardId] = useState<string | null>(
    editingDeck?.composition.starterVanguardId ?? null
  );
  const [deckCards, setDeckCards] = useState<DeckEntry[]>(
    editingDeck?.composition.cards ?? []
  );

  // Preview
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const previewDef = previewCardId ? CARD_DATABASE[previewCardId] : null;

  // Filters
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [clanFilter, setClanFilter] = useState<ClanFilter>('all');
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Card counts in deck
  const cardCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of deckCards) {
      map[entry.cardId] = entry.count;
    }
    return map;
  }, [deckCards]);

  // Filtered cards for the browser
  const filteredCards = useMemo(() => {
    return ALL_CARDS.filter(card => {
      if (gradeFilter !== 'all' && card.grade !== gradeFilter) return false;
      if (clanFilter !== 'all' && card.clan !== clanFilter) return false;
      if (triggerFilter === 'none' && card.triggerType) return false;
      if (triggerFilter !== 'all' && triggerFilter !== 'none' && card.triggerType !== triggerFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!card.name.toLowerCase().includes(q) && !card.cardId.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return a.name.localeCompare(b.name);
    });
  }, [gradeFilter, clanFilter, triggerFilter, searchQuery]);

  // Group filtered cards by grade for sectioned display, splitting G0 starters out
  const filteredByGrade = useMemo(() => {
    const groups: Record<string, CardDefinition[]> = { starters: [], 0: [], 1: [], 2: [], 3: [] };
    for (const card of filteredCards) {
      if (card.grade === 0 && (card.isStarterVanguard || !card.triggerType)) {
        groups.starters.push(card);
      } else {
        groups[card.grade].push(card);
      }
    }
    return groups;
  }, [filteredCards]);

  // Stats
  const mainDeckTotal = deckCards.reduce((sum, e) => sum + e.count, 0);
  const starterDef = starterVanguardId ? CARD_DATABASE[starterVanguardId] : null;
  const starterIsTrigger = !!starterDef?.triggerType;
  const expectedTriggers = starterIsTrigger ? 15 : 16;

  let triggerCount = 0;
  let healCount = 0;
  for (const entry of deckCards) {
    const def = CARD_DATABASE[entry.cardId];
    if (def?.triggerType) {
      triggerCount += entry.count;
      if (def.triggerType === 'heal') healCount += entry.count;
    }
  }

  // Validation
  const errors: string[] = [];
  if (!starterVanguardId) errors.push('Select a starter vanguard');
  if (mainDeckTotal !== 49) errors.push(`Main deck: ${mainDeckTotal}/49 cards`);
  if (triggerCount !== expectedTriggers) errors.push(`Triggers: ${triggerCount}/${expectedTriggers}`);
  if (healCount > 4) errors.push(`Heal triggers: ${healCount}/4 max`);

  const isValid = errors.length === 0;

  // Get count of a card in deck (including starter)
  function getCountInDeck(cardId: string): number {
    const inMain = cardCountMap[cardId] || 0;
    const isStarter = starterVanguardId === cardId ? 1 : 0;
    return inMain + isStarter;
  }

  // Add card to deck
  function addCard(card: CardDefinition) {
    // If it's a valid starter (grade 0 non-trigger) and we don't have one set, set it
    if (card.grade === 0 && !card.triggerType && !starterVanguardId) {
      setStarterVanguardId(card.cardId);
      return;
    }

    const currentCount = getCountInDeck(card.cardId);
    if (currentCount >= 4) return;

    setDeckCards(prev => {
      const existing = prev.find(e => e.cardId === card.cardId);
      if (existing) {
        return prev.map(e =>
          e.cardId === card.cardId ? { ...e, count: e.count + 1 } : e
        );
      }
      return [...prev, { cardId: card.cardId, count: 1 }];
    });
  }

  // Remove one copy from deck
  function removeCard(cardId: string) {
    setDeckCards(prev => {
      const existing = prev.find(e => e.cardId === cardId);
      if (!existing) return prev;
      if (existing.count <= 1) return prev.filter(e => e.cardId !== cardId);
      return prev.map(e =>
        e.cardId === cardId ? { ...e, count: e.count - 1 } : e
      );
    });
  }

  // Build composition
  function buildComposition(): CustomDeckComposition {
    return {
      name: deckName || 'Custom Deck',
      starterVanguardId: starterVanguardId!,
      cards: deckCards.filter(e => e.count > 0),
    };
  }

  function handleSave() {
    if (!starterVanguardId) return;
    onSave(buildComposition(), editingDeck?.id);
  }

  function handleUse() {
    if (!isValid) return;
    onUse(buildComposition());
  }

  function handleClear() {
    setStarterVanguardId(null);
    setDeckCards([]);
  }

  // Group deck cards by grade
  const deckByGrade = useMemo(() => {
    const groups: Record<number, { def: CardDefinition; count: number }[]> = { 0: [], 1: [], 2: [], 3: [] };
    for (const entry of deckCards) {
      const def = CARD_DATABASE[entry.cardId];
      if (def) {
        groups[def.grade].push({ def, count: entry.count });
      }
    }
    for (const grade of [0, 1, 2, 3]) {
      groups[grade].sort((a, b) => a.def.name.localeCompare(b.def.name));
    }
    return groups;
  }, [deckCards]);

  function statClass(current: number, target: number): string {
    if (current === target) return 'deck-builder__stat--ok';
    if (current > target) return 'deck-builder__stat--error';
    return 'deck-builder__stat--warn';
  }

  return (
    <div className="deck-builder">
      <div className="deck-builder__header">
        <div className="deck-builder__title">Deck Builder</div>
        <button className="deck-builder__close-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="deck-builder__body">
        {/* Left panel: Card Browser */}
        <div className="deck-builder__browser">
          <div className="deck-builder__filters">
            <div className="deck-builder__filter-group">
              <span className="deck-builder__filter-label">Grade</span>
              {(['all', 0, 1, 2, 3] as GradeFilter[]).map(g => (
                <button
                  key={String(g)}
                  className={`deck-builder__filter-btn ${gradeFilter === g ? 'deck-builder__filter-btn--active' : ''}`}
                  onClick={() => setGradeFilter(g)}
                >
                  {g === 'all' ? 'All' : `G${g}`}
                </button>
              ))}
            </div>

            <div className="deck-builder__filter-group">
              <span className="deck-builder__filter-label">Clan</span>
              {AVAILABLE_CLANS.map(c => (
                <button
                  key={c}
                  className={`deck-builder__filter-btn ${clanFilter === c ? 'deck-builder__filter-btn--active' : ''}`}
                  onClick={() => setClanFilter(c)}
                >
                  {c === 'all' ? 'All' : CLAN_LABELS[c] ?? c}
                </button>
              ))}
            </div>

            <div className="deck-builder__filter-group">
              <span className="deck-builder__filter-label">Trigger</span>
              {(['all', 'none', 'critical', 'draw', 'stand', 'heal'] as TriggerFilter[]).map(t => (
                <button
                  key={t}
                  className={`deck-builder__filter-btn ${triggerFilter === t ? 'deck-builder__filter-btn--active' : ''}`}
                  onClick={() => setTriggerFilter(t)}
                >
                  {t === 'all' ? 'All' : t === 'none' ? 'Non-T' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <input
              className="deck-builder__search"
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="deck-builder__card-sections">
            {(['starters', '0', '1', '2', '3'] as string[]).map(key => {
              const cards = filteredByGrade[key];
              if (!cards || cards.length === 0) return null;
              const label = key === 'starters' ? 'Starters' : `Grade ${key}`;
              return (
                <div key={key} className="deck-builder__card-section">
                  <div className="deck-builder__card-section-header">
                    {label}
                    <span className="deck-builder__card-section-count">{cards.length}</span>
                  </div>
                  <div className="deck-builder__card-grid">
                    {cards.map(card => {
                      const countInDeck = getCountInDeck(card.cardId);
                      const isMaxed = countInDeck >= 4;

                      return (
                        <div
                          key={card.cardId}
                          className={[
                            'deck-builder__card-tile',
                            isMaxed ? 'deck-builder__card-tile--maxed' : '',
                            (card.grade === 0 && !card.triggerType) ? 'deck-builder__card-tile--starter' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => { setPreviewCardId(card.cardId); if (!isMaxed) addCard(card); }}
                          title={`${card.name} (G${card.grade}) - ${card.clan}${card.triggerType ? ` [${card.triggerType}]` : ''}`}
                        >
                          <img src={card.imagePath} alt={card.name} draggable={false} />
                          {countInDeck > 0 && (
                            <div className="deck-builder__card-count-badge">
                              {countInDeck}/4
                            </div>
                          )}
                          <div className="deck-builder__card-grade-badge">G{card.grade}</div>
                          {card.triggerType && (
                            <div className={`deck-builder__card-trigger-badge deck-builder__card-trigger-badge--${card.triggerType}`}>
                              {card.triggerType === 'critical' ? 'CRIT' : card.triggerType.toUpperCase()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: Deck List */}
        <div className="deck-builder__deck-panel">
          <div className="deck-builder__deck-header">
            <input
              className="deck-builder__deck-name-input"
              type="text"
              placeholder="Deck name..."
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
            />
          </div>

          {/* Starter VG slot */}
          <div className="deck-builder__starter-slot">
            <div className="deck-builder__starter-label">Starter Vanguard</div>
            {starterDef ? (
              <div className="deck-builder__starter-card">
                <img src={starterDef.imagePath} alt={starterDef.name} draggable={false} />
                <span className="deck-builder__starter-card-name">{starterDef.name}</span>
                <button
                  className="deck-builder__starter-remove"
                  onClick={() => setStarterVanguardId(null)}
                >
                  x
                </button>
              </div>
            ) : (
              <div className="deck-builder__starter-empty">
                Click a Grade 0 starter to set
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="deck-builder__stats">
            <span className={`deck-builder__stat ${statClass(mainDeckTotal, 49)}`}>
              Cards: {mainDeckTotal}/49
            </span>
            <span className={`deck-builder__stat ${statClass(triggerCount, expectedTriggers)}`}>
              Triggers: {triggerCount}/{expectedTriggers}
            </span>
            <span className={`deck-builder__stat ${healCount > 4 ? 'deck-builder__stat--error' : healCount > 0 ? 'deck-builder__stat--ok' : ''}`}>
              Heals: {healCount}/4
            </span>
          </div>

          {/* Card preview (inside right panel) */}
          {previewDef && (
            <div className="deck-builder__preview">
              <img
                className="deck-builder__preview-img"
                src={previewDef.imagePath}
                alt={previewDef.name}
                draggable={false}
              />
              <div className="deck-builder__preview-info">
                <div className="deck-builder__preview-name">{previewDef.name}</div>
                <div className="deck-builder__preview-details">
                  <span>Grade {previewDef.grade}</span>
                  <span>{previewDef.clan.replace(/-/g, ' ')}</span>
                </div>
                <div className="deck-builder__preview-stats">
                  <span>Power: {previewDef.power}</span>
                  {previewDef.shield != null && <span>Shield: {previewDef.shield}</span>}
                </div>
                {previewDef.triggerType && (
                  <div className={`deck-builder__preview-trigger deck-builder__preview-trigger--${previewDef.triggerType}`}>
                    {previewDef.triggerType.toUpperCase()} TRIGGER
                  </div>
                )}
                {previewDef.abilityText && (
                  <div className="deck-builder__preview-ability">
                    {previewDef.abilityText}
                  </div>
                )}
                <div className="deck-builder__preview-copies">
                  {getCountInDeck(previewDef.cardId)}/4 in deck
                </div>
              </div>
            </div>
          )}

          {/* Deck card list */}
          <div className="deck-builder__deck-list">
            {([0, 1, 2, 3] as number[]).map(grade => {
              const cards = deckByGrade[grade];
              if (cards.length === 0) return null;
              const gradeTotal = cards.reduce((s, c) => s + c.count, 0);
              return (
                <div key={grade} className="deck-builder__grade-group">
                  <div className="deck-builder__grade-header">
                    Grade {grade} ({gradeTotal})
                  </div>
                  {cards.map(({ def, count }) => (
                    <div key={def.cardId} className="deck-builder__deck-entry">
                      <img
                        className="deck-builder__deck-entry-img"
                        src={def.imagePath}
                        alt={def.name}
                        draggable={false}
                      />
                      <div className="deck-builder__deck-entry-info">
                        <div className="deck-builder__deck-entry-name">{def.name}</div>
                        <div className="deck-builder__deck-entry-meta">
                          {def.triggerType ? `${def.triggerType} trigger` : def.clan.replace('-', ' ')}
                        </div>
                      </div>
                      <div className="deck-builder__deck-entry-count">
                        <button
                          className="deck-builder__count-btn"
                          onClick={() => removeCard(def.cardId)}
                        >
                          -
                        </button>
                        <span className="deck-builder__count-num">{count}</span>
                        <button
                          className="deck-builder__count-btn"
                          onClick={() => addCard(def)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {mainDeckTotal === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(160,160,190,0.4)', fontSize: 13 }}>
                Click cards on the left to add them to your deck
              </div>
            )}
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="deck-builder__errors">
              {errors.map((err, i) => (
                <div key={i} className="deck-builder__error-item">{err}</div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="deck-builder__actions">
            <button
              className="deck-builder__action-btn deck-builder__action-btn--clear"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              className="deck-builder__action-btn deck-builder__action-btn--save"
              onClick={handleSave}
              disabled={!starterVanguardId || (!editingDeck && savedDeckCount >= MAX_CUSTOM_DECKS)}
              title={!editingDeck && savedDeckCount >= MAX_CUSTOM_DECKS ? `Max ${MAX_CUSTOM_DECKS} custom decks` : undefined}
            >
              {!editingDeck && savedDeckCount >= MAX_CUSTOM_DECKS ? 'Slots Full' : 'Save'}
            </button>
            <button
              className="deck-builder__action-btn deck-builder__action-btn--use"
              onClick={handleUse}
              disabled={!isValid}
            >
              Use Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
