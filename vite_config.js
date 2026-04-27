import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import os from 'node:os';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';

function controllerRelayPlugin() {
  const rooms = new Map();

  function getPreferredNetworkAddress() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const [interfaceName, addresses] of Object.entries(interfaces)) {
      for (const address of addresses ?? []) {
        if (address.family !== 'IPv4' || address.internal) continue;

        const normalizedName = interfaceName.toLowerCase();
        const isPrivateAddress =
          address.address.startsWith('192.168.') ||
          address.address.startsWith('10.') ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(address.address);

        const looksWireless = /wi-?fi|wlan|wireless/.test(normalizedName);
        const looksPhysicalLan = /ethernet|en\d/.test(normalizedName);
        const looksVirtual = /virtual|vmware|vbox|hyper-v|loopback|wsl|vethernet|tailscale/.test(normalizedName);

        let score = 0;
        if (isPrivateAddress) score += 10;
        if (looksWireless) score += 50;
        if (looksPhysicalLan) score += 20;
        if (looksVirtual) score -= 100;

        candidates.push({
          address: address.address,
          score
        });
      }
    }

    candidates.sort((left, right) => right.score - left.score);
    return candidates[0]?.address ?? null;
  }

  function getOrCreateRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        game: null,
        controllers: new Set()
      });
    }

    return rooms.get(roomId);
  }

  function cleanupRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.game == null && room.controllers.size === 0) {
      rooms.delete(roomId);
    }
  }

  function safeSend(socket, payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }

  return {
    name: 'controller-relay',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });

      server.middlewares.use('/controller-origin', (req, res) => {
        const requestHost = req.headers.host ?? 'localhost:5173';
        const port = requestHost.split(':')[1] ?? '5173';
        const preferredAddress = getPreferredNetworkAddress();
        const origin = preferredAddress
          ? `https://${preferredAddress}:${port}`
          : `https://${requestHost}`;

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ origin }));
      });

      server.httpServer?.on('upgrade', (request, socket, head) => {
        const requestUrl = new URL(request.url ?? '/', `https://${request.headers.host}`);
        if (requestUrl.pathname !== '/controller-relay') {
          return;
        }

        wss.handleUpgrade(request, socket, head, (wsSocket) => {
          wss.emit('connection', wsSocket, request);
        });
      });

      wss.on('connection', (socket, request) => {
        const requestUrl = new URL(request.url ?? '/', `https://${request.headers.host}`);
        const role = requestUrl.searchParams.get('role');
        const roomId = requestUrl.searchParams.get('room');

        if (!roomId || (role !== 'game' && role !== 'controller')) {
          safeSend(socket, { type: 'error', message: 'Invalid role or room' });
          socket.close();
          return;
        }

        const room = getOrCreateRoom(roomId);

        if (role === 'game') {
          if (room.game && room.game !== socket) {
            safeSend(room.game, { type: 'system', message: 'Game session replaced by a new connection' });
            room.game.close();
          }

          room.game = socket;
          safeSend(socket, { type: 'paired', room: roomId, controllerCount: room.controllers.size });

          for (const controller of room.controllers) {
            safeSend(controller, { type: 'game_joined', room: roomId });
          }
        }

        if (role === 'controller') {
          room.controllers.add(socket);
          safeSend(socket, { type: 'paired', room: roomId, gamePresent: room.game != null });

          if (room.game) {
            safeSend(room.game, { type: 'controller_count', count: room.controllers.size });
          }
        }

        socket.on('message', (message) => {
          let payload;
          try {
            payload = JSON.parse(message.toString());
          } catch {
            return;
          }

          if (role === 'controller' && room.game) {
            if (payload.type === 'motion') {
              safeSend(room.game, {
                type: 'motion',
                room: roomId,
                pitch: payload.pitch,
                roll: payload.roll,
                quaternion: payload.quaternion,
                motionIntensity: payload.motionIntensity,
                timestamp: payload.timestamp
              });
            }

            if (payload.type === 'calibrate') {
              safeSend(room.game, {
                type: 'calibrate',
                room: roomId
              });
            }
          }
        });

        socket.on('close', () => {
          if (role === 'game' && room.game === socket) {
            room.game = null;
            for (const controller of room.controllers) {
              safeSend(controller, { type: 'system', message: 'Game disconnected' });
            }
          }

          if (role === 'controller') {
            room.controllers.delete(socket);
            if (room.game) {
              safeSend(room.game, { type: 'controller_count', count: room.controllers.size });
            }
          }

          cleanupRoom(roomId);
        });
      });

      server.httpServer?.once('close', () => {
        wss.close();
      });
    }
  };
}

export default defineConfig({
  plugins: [basicSsl(), controllerRelayPlugin()],
  server: {
    host: true,
    https: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});