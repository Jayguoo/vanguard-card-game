import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  PublicGameRoom,
  PublicRoomListItem,
  PublicVanguardGameState,
  RoomResponse,
  RoomVisibility,
  DeckId,
  CustomDeckComposition,
  GameAction,
  ActionResult,
  AuthResponse,
  AuthUser,
  FriendInfo,
} from '../shared/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// In production (served from same origin), use '' so Socket.IO connects to same host.
// In development, fall back to localhost:3001.
const SERVER_URL = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : '');

export interface AppState {
  room: PublicGameRoom | null;
  gameState: PublicVanguardGameState | null;
  myId: string | null;
  isConnected: boolean;
  error: string | null;
  publicRooms: PublicRoomListItem[];
  latencyMs: number | null;
}

export function useSocket(
  token: string | null,
  onAuthVerified?: (user: AuthUser) => void,
  onAuthExpired?: () => void,
) {
  const socketRef = useRef<TypedSocket | null>(null);
  const onAuthVerifiedRef = useRef(onAuthVerified);
  const onAuthExpiredRef = useRef(onAuthExpired);
  onAuthVerifiedRef.current = onAuthVerified;
  onAuthExpiredRef.current = onAuthExpired;
  const [appState, setAppState] = useState<AppState>({
    room: null,
    gameState: null,
    myId: null,
    isConnected: false,
    error: null,
    publicRooms: [],
    latencyMs: null,
  });

  useEffect(() => {
    const socket: TypedSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setAppState(prev => ({
        ...prev,
        isConnected: true,
        myId: socket.id || null,
      }));

      // Initial latency measurement
      const start = performance.now();
      socket.emit('latency:ping', Date.now(), () => {
        setAppState(prev => ({ ...prev, latencyMs: Math.round(performance.now() - start) }));
      });
    });

    // Recurring ping every 5 seconds
    const pingInterval = setInterval(() => {
      if (!socket.connected) return;
      const start = performance.now();
      socket.emit('latency:ping', Date.now(), () => {
        setAppState(prev => ({ ...prev, latencyMs: Math.round(performance.now() - start) }));
      });
    }, 5000);

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

    socket.on('room:listUpdate', (rooms) => {
      setAppState(prev => ({ ...prev, publicRooms: rooms }));
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

    // Friends status updates (handled by FriendsPanel via callback)
    socket.on('friends:statusUpdate', () => {
      // No-op here - FriendsPanel will refetch its own list
    });

    // Auth session verification
    socket.on('auth:verified', (user) => {
      onAuthVerifiedRef.current?.(user);
    });

    socket.on('auth:expired', () => {
      onAuthExpiredRef.current?.();
    });

    // Errors
    socket.on('error', (message) => {
      console.error('Server error:', message);
      setAppState(prev => ({ ...prev, error: message }));
      setTimeout(() => {
        setAppState(prev => ({ ...prev, error: null }));
      }, 3000);
    });

    return () => { clearInterval(pingInterval); socket.disconnect(); };
  }, [token]);

  // Room actions
  const createRoom = useCallback((playerName: string, options: { visibility: RoomVisibility; password?: string }): Promise<RoomResponse> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('room:create', playerName, options, response => {
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

  const joinRoom = useCallback((roomId: string, playerName: string, password: string | null): Promise<RoomResponse> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('room:join', roomId, playerName, password, response => {
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

  const fetchRoomList = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('room:list', (rooms) => {
      setAppState(prev => ({ ...prev, publicRooms: rooms }));
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

  const submitCustomDeck = useCallback((deck: CustomDeckComposition): Promise<{ success: boolean; error?: string }> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('deck:submitCustom', deck, resolve);
    });
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

  // Auth actions
  const registerAccount = useCallback((username: string, password: string, fighterName: string): Promise<AuthResponse> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('auth:register', username, password, fighterName, resolve);
    });
  }, []);

  const loginAccount = useCallback((username: string, password: string): Promise<AuthResponse> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('auth:login', username, password, resolve);
    });
  }, []);

  // Friends actions
  const listFriends = useCallback((): Promise<FriendInfo[]> => {
    return new Promise(resolve => {
      if (!socketRef.current) { resolve([]); return; }
      socketRef.current.emit('friends:list', resolve);
    });
  }, []);

  const addFriend = useCallback((username: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('friends:add', username, resolve);
    });
  }, []);

  const removeFriend = useCallback((friendUserId: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise(resolve => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }
      socketRef.current.emit('friends:remove', friendUserId, resolve);
    });
  }, []);

  return {
    appState,
    actions: {
      createRoom,
      joinRoom,
      leaveRoom,
      fetchRoomList,
      selectDeck,
      submitCustomDeck,
      readyUp,
      startGame,
      sendAction,
      registerAccount,
      loginAccount,
      listFriends,
      addFriend,
      removeFriend,
    },
  };
}
