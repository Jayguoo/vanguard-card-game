# 🃏 VanguardS1 Card Game - Deployment Guide

Deploy your game so friends can play instantly with just a link!

## Quick Deploy (Free Hosting)

### Step 1: Deploy Server to Railway (Free tier available)

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository and the `card-game/server` folder
4. Railway will auto-detect the Dockerfile and deploy
5. Once deployed, go to **Settings** → **Networking** → **Generate Domain**
6. Copy your server URL (e.g., `https://card-game-server-production.up.railway.app`)

### Step 2: Deploy Client to Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New Project"** → Import your repository
3. Set the **Root Directory** to `card-game/client`
4. Add Environment Variable:
   - Name: `VITE_SERVER_URL`
   - Value: Your Railway server URL from Step 1
5. Click **Deploy**
6. Your game URL will be something like `https://your-game.vercel.app`

### Step 3: Update Server CORS

1. Go back to Railway dashboard
2. Add Environment Variable:
   - Name: `CLIENT_URL`  
   - Value: Your Vercel URL from Step 2
3. Railway will auto-redeploy

## 🎮 Play with Friends!

Share your Vercel URL with friends. They just:
1. Open the link
2. Enter their name
3. Create or join a room
4. Play!

---

## Alternative: Render.com (Also Free)

### Server on Render

1. Go to [render.com](https://render.com) and sign up
2. New → Web Service → Connect your repo
3. Root Directory: `card-game/server`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add env var: `CLIENT_URL=https://your-vercel-url.vercel.app`

---

## Local Network Play (No Deployment)

If you just want to play on the same WiFi network:

1. Start the server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. Find your local IP:
   - Windows: `ipconfig` → Look for IPv4 Address (e.g., `192.168.1.100`)
   - Mac: `ifconfig` → Look for `inet` under `en0`

3. Update `client/src/hooks/useSocket.ts`:
   ```ts
   const SERVER_URL = 'http://192.168.1.100:3001'; // Your local IP
   ```

4. Start the client:
   ```bash
   cd client
   npm install
   npm run dev -- --host
   ```

5. Friends on the same WiFi can open `http://192.168.1.100:5173`

---

## Troubleshooting

### "Connecting..." stuck
- Check if server is running (visit server URL + `/health`)
- Verify CORS: `CLIENT_URL` env var on server matches your client URL exactly

### "Room not found"
- Room codes are case-insensitive but expire when empty
- Make sure server didn't restart (rooms are in-memory)

### WebSocket errors
- Some networks block WebSocket. The game falls back to polling automatically.

---

## Environment Variables Summary

| Location | Variable | Value |
|----------|----------|-------|
| Vercel (Client) | `VITE_SERVER_URL` | `https://your-server.railway.app` |
| Railway (Server) | `CLIENT_URL` | `https://your-game.vercel.app` |
| Railway (Server) | `PORT` | Auto-set by Railway |
