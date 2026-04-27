import { WebSocketServer } from 'ws';

const PORT = Number(process.env.CONTROLLER_WS_PORT || 8080);
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map();

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
  if (socket && socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

wss.on('connection', (socket, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const role = url.searchParams.get('role');
  const roomId = url.searchParams.get('room');

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

    // Tell any already-waiting controllers that the game is now present
    for (const controller of room.controllers) {
      safeSend(controller, { type: 'game_joined', room: roomId });
    }
  }

  if (role === 'controller') {
    room.controllers.add(socket);
    // Tell the phone whether the game is already in this room
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

wss.on('listening', () => {
  console.log(`[controller-relay] WebSocket relay listening on ws://0.0.0.0:${PORT}`);
});
