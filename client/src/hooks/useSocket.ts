import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Card,
  PublicGameRoom,
  RoomResponse,
} from '../shared/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Use environment variable for production, fallback to localhost for dev
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface GameState {
  room: PublicGameRoom | null;
  myHand: Card[];
  myId: string | null;
  isMyTurn: boolean;
  isConnected: boolean;
  error: string | null;
}

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    myHand: [],
    myId: null,
    isMyTurn: false,
    isConnected: false,
    error: null,
  });

  // Connect to server on mount
  useEffect(() => {
    const socket: TypedSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setGameState((prev) => ({
        ...prev,
        isConnected: true,
        myId: socket.id || null,
      }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setGameState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    });

    // Room events
    socket.on('room:update', (room) => {
      setGameState((prev) => ({
        ...prev,
        room,
        isMyTurn: room.currentPlayerId === prev.myId,
      }));
    });

    socket.on('room:playerJoined', (player) => {
      console.log(`${player.name} joined the room`);
    });

    socket.on('room:playerLeft', (playerId) => {
      console.log(`Player ${playerId} left the room`);
    });

    // Game events
    socket.on('game:started', (room) => {
      setGameState((prev) => ({
        ...prev,
        room,
        isMyTurn: room.currentPlayerId === prev.myId,
      }));
    });

    socket.on('game:yourHand', (cards) => {
      setGameState((prev) => ({
        ...prev,
        myHand: cards,
      }));
    });

    socket.on('game:turnChanged', (currentPlayerId) => {
      setGameState((prev) => ({
        ...prev,
        isMyTurn: currentPlayerId === prev.myId,
      }));
    });

    socket.on('game:cardPlayed', (playerId, card) => {
      console.log(`Player ${playerId} played ${card.value} of ${card.suit}`);
    });

    socket.on('game:cardDrawn', (playerId, cardCount) => {
      console.log(`Player ${playerId} drew a card (now has ${cardCount})`);
    });

    socket.on('game:ended', (winnerId) => {
      console.log(`Game ended! Winner: ${winnerId}`);
    });

    socket.on('error', (message) => {
      console.error('Server error:', message);
      setGameState((prev) => ({
        ...prev,
        error: message,
      }));

      // Clear error after 3 seconds
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          error: null,
        }));
      }, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Room actions
  const createRoom = useCallback((playerName: string): Promise<RoomResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      socketRef.current.emit('room:create', playerName, (response) => {
        if (response.success && response.room) {
          setGameState((prev) => ({
            ...prev,
            room: response.room!,
            myId: response.playerId || prev.myId,
          }));
        }
        resolve(response);
      });
    });
  }, []);

  const joinRoom = useCallback(
    (roomId: string, playerName: string): Promise<RoomResponse> => {
      return new Promise((resolve) => {
        if (!socketRef.current) {
          resolve({ success: false, error: 'Not connected' });
          return;
        }

        socketRef.current.emit('room:join', roomId, playerName, (response) => {
          if (response.success && response.room) {
            setGameState((prev) => ({
              ...prev,
              room: response.room!,
              myId: response.playerId || prev.myId,
            }));
          }
          resolve(response);
        });
      });
    },
    []
  );

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
    setGameState((prev) => ({
      ...prev,
      room: null,
      myHand: [],
      isMyTurn: false,
    }));
  }, []);

  // Game actions
  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start');
  }, []);

  const playCard = useCallback((cardId: string) => {
    socketRef.current?.emit('game:playCard', cardId);
  }, []);

  const drawCard = useCallback(() => {
    socketRef.current?.emit('game:drawCard');
  }, []);

  const endTurn = useCallback(() => {
    socketRef.current?.emit('game:endTurn');
  }, []);

  return {
    gameState,
    actions: {
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      playCard,
      drawCard,
      endTurn,
    },
  };
}
