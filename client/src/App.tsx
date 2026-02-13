import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby';
import { DeckSelect } from './components/DeckSelect';
import { VanguardGame } from './components/VanguardGame';
import './App.css';

function App() {
  const { appState, actions } = useSocket();

  // Show lobby if not in a room
  if (!appState.room) {
    return (
      <Lobby
        isConnected={appState.isConnected}
        onCreateRoom={actions.createRoom}
        onJoinRoom={actions.joinRoom}
      />
    );
  }

  // Show deck selection phase
  if (appState.room.roomState === 'deck-select' || appState.room.roomState === 'waiting') {
    return (
      <DeckSelect
        room={appState.room}
        myId={appState.myId || ''}
        onSelectDeck={actions.selectDeck}
        onReady={actions.readyUp}
        onStartGame={actions.startGame}
        onLeave={actions.leaveRoom}
      />
    );
  }

  // Show game if we have game state
  if (appState.gameState && (appState.room.roomState === 'playing' || appState.room.roomState === 'finished')) {
    return (
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
  }

  // Loading state
  return (
    <div className="vg-loading">
      <div className="vg-loading__spinner" />
      <p>Loading game...</p>
    </div>
  );
}

export default App;
