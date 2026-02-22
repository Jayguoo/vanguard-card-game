import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { useSavedDecks, SavedDeck } from './hooks/useSavedDecks';

import { AuthScreen } from './components/AuthScreen';
import { Lobby } from './components/Lobby';
import { DeckSelect } from './components/DeckSelect';
import { DeckBuilder } from './components/DeckBuilder';
import { VanguardGame } from './components/VanguardGame';
import { PingCounter } from './components/PingCounter';
import './App.css';

function App() {
  const { authState, handleAuthResponse, clearAuth, updateUser } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const { appState, actions } = useSocket(
    authState.token,
    (user) => updateUser(user),
    () => clearAuth(),
  );
  const { savedDecks, saveDeck, deleteDeck } = useSavedDecks();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<SavedDeck | null>(null);

  let screen: JSX.Element;

  // Show auth screen if not logged in and not guest
  if (!authState.isLoggedIn && !isGuest) {
    screen = (
      <AuthScreen
        isConnected={appState.isConnected}
        onRegister={async (username, password, fighterName) => {
          const response = await actions.registerAccount(username, password, fighterName);
          return handleAuthResponse(response);
        }}
        onLogin={async (username, password) => {
          const response = await actions.loginAccount(username, password);
          return handleAuthResponse(response);
        }}
        onPlayAsGuest={() => setIsGuest(true)}
      />
    );
  } else if (!appState.room) {
    // Show lobby if not in a room
    screen = (
      <>
        <Lobby
          isConnected={appState.isConnected}
          publicRooms={appState.publicRooms}
          onCreateRoom={actions.createRoom}
          onJoinRoom={actions.joinRoom}
          onFetchRoomList={actions.fetchRoomList}
          savedDecks={savedDecks}
          onOpenBuilder={() => { setEditingDeck(null); setBuilderOpen(true); }}
          onEditDeck={(deck) => { setEditingDeck(deck); setBuilderOpen(true); }}
          onDeleteDeck={deleteDeck}
          authUser={authState.user}
          onLogout={() => { clearAuth(); setIsGuest(false); }}
          friendActions={authState.isLoggedIn ? {
            listFriends: actions.listFriends,
            addFriend: actions.addFriend,
            removeFriend: actions.removeFriend,
          } : null}
        />
        {builderOpen && (
          <DeckBuilder
            onClose={() => setBuilderOpen(false)}
            onSave={(composition, existingId) => {
              const saved = saveDeck(composition, existingId);
              return saved;
            }}
            onUse={() => setBuilderOpen(false)}
            editingDeck={editingDeck}
            savedDeckCount={savedDecks.length}
          />
        )}
      </>
    );
  } else if (appState.room.roomState === 'deck-select' || appState.room.roomState === 'waiting') {
    // Show deck selection phase
    screen = (
      <>
        <DeckSelect
          room={appState.room}
          myId={appState.myId || ''}
          onSelectDeck={actions.selectDeck}
          onSubmitCustomDeck={actions.submitCustomDeck}
          onReady={actions.readyUp}
          onStartGame={actions.startGame}
          onLeave={actions.leaveRoom}
          savedDecks={savedDecks}
          onOpenBuilder={() => { setEditingDeck(null); setBuilderOpen(true); }}
          onEditDeck={(deck) => { setEditingDeck(deck); setBuilderOpen(true); }}
          onDeleteDeck={deleteDeck}
        />
        {builderOpen && (
          <DeckBuilder
            onClose={() => setBuilderOpen(false)}
            onSave={(composition, existingId) => {
              const saved = saveDeck(composition, existingId);
              return saved;
            }}
            onUse={async (composition) => {
              const result = await actions.submitCustomDeck(composition);
              if (result.success) {
                setBuilderOpen(false);
              }
            }}
            editingDeck={editingDeck}
            savedDeckCount={savedDecks.length}
          />
        )}
      </>
    );
  } else if (appState.gameState && (appState.room.roomState === 'playing' || appState.room.roomState === 'finished')) {
    // Show game
    screen = (
      <VanguardGame
        gameState={appState.gameState}
        myId={appState.myId || ''}
        onAction={async (action) => {
          const result = await actions.sendAction(action);
          if (!result.success && result.error) {
            console.error('Action failed:', result.error);
          }
        }}
        onLeave={actions.leaveRoom}
        error={appState.error}
      />
    );
  } else {
    // Loading state
    screen = (
      <div className="vg-loading">
        <div className="vg-loading__spinner" />
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <>
      <PingCounter latencyMs={appState.latencyMs} />
      {screen}
    </>
  );
}

export default App;
