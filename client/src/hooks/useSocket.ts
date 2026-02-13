import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  PublicGameRoom,
  PublicVanguardGameState,
  RoomResponse,
  DeckId,
  GameAction,
  ActionResult,
} from '../shared/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface AppState {
  room: PublicGameRoom | null;
  gameState: PublicVanguardGameState | null;
  myId: string | null;
  isConnected: boolean;
  error: string | null;
}

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [appState, setAppState] = useState<AppState>({
    room: null,
    gameState: null,
    myId: null,
    isConnected: false,
    error: null,
  });

  useEffect(() => {
    const socket: TypedSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setAppState(prev => ({
        ...prev,
        isConnected: true,
        myId: socket.id || null,
      }));
    });

    socket.on('disconnect', () => {
      setAppState(prev => ({ ...prev, isConnected: false }));
    });

    // Room events
    socket.on('room:update', (room) => {
      setAppState(prev => ({ ...prev, room }));
    });

    socket.on('room:playerJoined', (player) => {
      console.log(`${player.name} joined the room`);
    });

    socket.on('room:playerLeft', (playerId) => {
      console.log(`Player ${playerId} left the room`);
    });

    // Deck selection events
    socket.on('deck:playerSelected', (playerId, deckId) => {
      console.log(`Player ${playerId} selected deck ${deckId}`);
    });

    socket.on('deck:playerReady', (playerId) => {
      console.log(`Player ${playerId} is ready`);
    });

    socket.on('deck:allReady', () => {
      console.log('All players ready!');
    });

    // Game state updates
    socket.on('game:stateUpdate', (state) => {
      setAppState(prev => ({ ...prev, gameState: state }));
    });

    // Errors
    socket.on('error', (message) => {
      console.error('Server error:', message);
      setAppState(prev => ({ ...prev, error: message }));
      setTimeout(() => {
        setAppState(prev => ({ ...prev, error: null }));
      }, 3000);
    });

    return () => { socket.disconnect(); };
  }, []);

  // Room actions
  const createRoom = useCallback((playerName: string): Promise<RoomResponse> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('room:create', playerName, response => {
        if (response.success && response.room) {
          setAppState(prev => ({
            ...prev,
            room: response.room!,
            myId: response.playerId || prev.myId,
          }));
        }
        resolve(response);
      });
    });
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string): Promise<RoomResponse> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('room:join', roomId, playerName, response => {
        if (response.success && response.room) {
          setAppState(prev => ({
            ...prev,
            room: response.room!,
            myId: response.playerId || prev.myId,
          }));
        }
        resolve(response);
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
    setAppState(prev => ({
      ...prev,
      room: null,
      gameState: null,
    }));
  }, []);

  // Deck selection
  const selectDeck = useCallback((deckId: DeckId) => {
    socketRef.current?.emit('deck:select', deckId);
  }, []);

  const readyUp = useCallback(() => {
    socketRef.current?.emit('deck:ready');
  }, []);

  // Game start
  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start');
  }, []);

  // Game action
  const sendAction = useCallback((action: GameAction): Promise<ActionResult> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('game:action', action, result => {
        resolve(result);
      });
    });
  }, []);

  return {
    appState,
    actions: {
      createRoom,
      joinRoom,
      leaveRoom,
      selectDeck,
      readyUp,
      startGame,
      sendAction,
    },
  };
}
