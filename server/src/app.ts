import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Room } from './classes/Room';
import { MessageHandler } from './classes/MessageHandler';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// In-memory room store (use Redis for production scaling)
const rooms = new Map<string, Room>();

// REST endpoint to check if a room code is valid
app.get('/api/rooms/:code', (req, res) => {
  const room = [...rooms.values()].find(
    r => r.code === req.params.code.toUpperCase()
  );
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    code: room.code,
    playerCount: room.players.length,
    maxPlayers: room.settings.maxPlayers,
    status: room.status,
  });
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', rooms: rooms.size }));

// Socket.IO connection
const messageHandler = new MessageHandler(io, rooms);
io.on('connection', (socket) => messageHandler.handle(socket));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
