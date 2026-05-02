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

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const rooms = new Map<string, Room>();

app.get('/api/rooms/:code', (req: any, res: any) => {
  const room = [...rooms.values()].find(r => r.code === req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ code: room.code, playerCount: room.players.length, maxPlayers: room.settings.maxPlayers, status: room.status });
});

app.get('/health', (_req: any, res: any) => res.json({ status: 'ok', rooms: rooms.size }));

const messageHandler = new MessageHandler(io, rooms);
io.on('connection', (socket) => messageHandler.handle(socket));

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));