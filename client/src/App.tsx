import React from 'react';
import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import './App.css';

function App() {
  const { gameState, actions } = useSocket();

  // Show lobby if not in a room
  if (!gameState.room) {
    return (
      <Lobby
        isConnected={gameState.isConnected}
        onCreateRoom={actions.createRoom}
        onJoinRoom={actions.joinRoom}
      />
    );
  }

  // Show game room
  return (
    <GameRoom
      room={gameState.room}
      myHand={gameState.myHand}
      myId={gameState.myId}
      isMyTurn={gameState.isMyTurn}
      error={gameState.error}
      onStartGame={actions.startGame}
      onPlayCard={actions.playCard}
      onDrawCard={actions.drawCard}
      onEndTurn={actions.endTurn}
      onLeaveRoom={actions.leaveRoom}
    />
  );
}

export default App;
