# 🃏 Real-Time Multiplayer Card Game

A real-time multiplayer card game built with React, Socket.io, and TypeScript.

## Features

- **Real-time gameplay**: Actions are instantly synchronized across all players
- **Room system**: Create or join game rooms with 6-character codes
- **Turn-based mechanics**: Players take turns playing or drawing cards
- **Simple rules**: Match cards by suit or value (like Crazy Eights/Uno)

## Project Structure

```
card-game/
├── shared/              # Shared types between client and server
│   └── types.ts
├── server/              # Node.js + Socket.io backend
│   ├── index.ts         # Main server with socket handlers
│   ├── gameLogic.ts     # Card game rules and deck utilities
│   └── roomManager.ts   # Room creation and player management
└── client/              # React + Vite frontend
    └── src/
        ├── hooks/
        │   └── useSocket.ts      # Socket.io connection hook
        └── components/
            ├── Lobby.tsx         # Room create/join UI
            ├── GameRoom.tsx      # Main game interface
            └── Card.tsx          # Card display component
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Two terminal windows (one for server, one for client)

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Install Client Dependencies

```bash
cd client
npm install
```

### 3. Start the Server

```bash
cd server
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   🃏 Card Game Server Running          ║
║   Port: 3001                           ║
╚════════════════════════════════════════╝
```

### 4. Start the Client

In a new terminal:

```bash
cd client
npm run dev
```

The game will open at `http://localhost:5173`

## How to Play

1. **Create a Room**: Enter your name and click "Create Room"
2. **Share the Code**: Give the 6-character room code to friends
3. **Friends Join**: They enter the code and their name to join
4. **Start Game**: Host clicks "Start Game" (needs 2+ players)
5. **Take Turns**:
   - Click a card to select it, click again to play
   - Cards must match the top card's suit OR value
   - Click "Draw Card" if you can't play
   - Click "End Turn" to pass

## Game Rules

- Each player starts with 7 cards
- Match cards by **suit** (♥♦♣♠) or **value** (2-10, J, Q, K, A)
- First player to empty their hand wins!

## Architecture

### Socket Events

**Client → Server:**
- `room:create` - Create a new game room
- `room:join` - Join an existing room
- `room:leave` - Leave the current room
- `game:start` - Start the game (host only)
- `game:playCard` - Play a card from hand
- `game:drawCard` - Draw a card from deck
- `game:endTurn` - End your turn

**Server → Client:**
- `room:update` - Room state changed
- `room:playerJoined` - New player joined
- `room:playerLeft` - Player left
- `game:started` - Game has begun
- `game:yourHand` - Your private hand
- `game:turnChanged` - It's someone's turn
- `game:cardPlayed` - Card was played
- `game:ended` - Game is over

## Extending the Game

### Add New Card Games

1. Create new game logic in `server/gameLogic.ts`
2. Add new socket events for game-specific actions
3. Update the client to handle new rules

### Add Features

Ideas for extension:
- [ ] Spectator mode
- [ ] Chat system
- [ ] Player statistics
- [ ] Custom rules (draw 2, skip, reverse)
- [ ] Persistent accounts with database

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, Socket.io |
| Styling | CSS (no framework) |
| Build | Vite (client), tsx (server) |

## License

MIT - Feel free to use and modify!
