import { Server, Socket } from 'socket.io';
import { Room } from './Room';
import { Player } from './Player';
import { DrawStroke, ChatMessage } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class MessageHandler {
  private io: Server;
  private rooms: Map<string, Room>;
  private playerRoomMap: Map<string, string>; // socketId -> roomId

  constructor(io: Server, rooms: Map<string, Room>) {
    this.io = io;
    this.rooms = rooms;
    this.playerRoomMap = new Map();
  }

  handle(socket: Socket): void {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('create_room', (payload) => this.onCreateRoom(socket, payload));
    socket.on('join_room', (payload) => this.onJoinRoom(socket, payload));
    socket.on('start_game', () => this.onStartGame(socket));
    socket.on('word_chosen', (payload) => this.onWordChosen(socket, payload));
    socket.on('draw_stroke', (payload) => this.onDrawStroke(socket, payload));
    socket.on('canvas_clear', () => this.onCanvasClear(socket));
    socket.on('draw_undo', () => this.onDrawUndo(socket));
    socket.on('guess', (payload) => this.onGuess(socket, payload));
    socket.on('chat', (payload) => this.onChat(socket, payload));
    socket.on('update_settings', (payload) => this.onUpdateSettings(socket, payload));
    socket.on('disconnect', () => this.onDisconnect(socket));
  }

  private onCreateRoom(socket: Socket, payload: { playerName: string; settings?: object }): void {
    const player = new Player(socket.id, payload.playerName || 'Player', true);
    const room = new Room(this.io, player, payload.settings || {});

    this.rooms.set(room.id, room);
    this.playerRoomMap.set(socket.id, room.id);
    socket.join(room.id);

    socket.emit('room_created', { room: room.toJSON() });
    console.log(`Room created: ${room.code} by ${player.name}`);
  }

  private onJoinRoom(socket: Socket, payload: { roomCode: string; playerName: string }): void {
    const room = [...this.rooms.values()].find(r => r.code === payload.roomCode?.toUpperCase());

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.status !== 'waiting') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    const player = new Player(socket.id, payload.playerName || 'Player', false);
    const joined = room.addPlayer(player);

    if (!joined) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    this.playerRoomMap.set(socket.id, room.id);
    socket.join(room.id);
    socket.emit('room_joined', { room: room.toJSON() });
    console.log(`${player.name} joined room ${room.code}`);
  }

  private onStartGame(socket: Socket): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    const started = room.startGame(socket.id);
    if (!started) {
      socket.emit('error', { message: 'Cannot start game. Need at least 2 players or you are not the host.' });
    }
  }

  private onWordChosen(socket: Socket, payload: { word: string }): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    room.handleWordChosen(socket.id, payload.word);
  }

  private onDrawStroke(socket: Socket, stroke: DrawStroke): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    // Broadcast to everyone else in the room
    socket.to(room.id).emit('draw_stroke', stroke);
  }

  private onCanvasClear(socket: Socket): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    socket.to(room.id).emit('canvas_clear');
  }

  private onDrawUndo(socket: Socket): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    socket.to(room.id).emit('draw_undo');
  }

  private onGuess(socket: Socket, payload: { text: string }): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room || !payload.text?.trim()) return;

    const correct = room.handleGuess(socket.id, payload.text);

    if (!correct) {
      // Broadcast as regular chat to everyone
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const msg: ChatMessage = {
        id: uuidv4(),
        playerId: socket.id,
        playerName: player.name,
        text: payload.text,
        type: 'guess',
        timestamp: Date.now(),
      };
      this.io.to(room.id).emit('chat_message', msg);
    }
  }

  private onChat(socket: Socket, payload: { text: string }): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room || !payload.text?.trim()) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const msg: ChatMessage = {
      id: uuidv4(),
      playerId: socket.id,
      playerName: player.name,
      text: payload.text,
      type: 'chat',
      timestamp: Date.now(),
    };
    this.io.to(room.id).emit('chat_message', msg);
  }

  private onUpdateSettings(socket: Socket, payload: object): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room || room.hostId !== socket.id) return;
    Object.assign(room.settings, payload);
    this.io.to(room.id).emit('settings_updated', { settings: room.settings });
  }

  private onDisconnect(socket: Socket): void {
    const roomId = this.playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(socket.id);
      if (room.isEmpty()) {
        this.rooms.delete(roomId);
        console.log(`Room ${room.code} deleted (empty)`);
      }
    }
    this.playerRoomMap.delete(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);
  }

  private getPlayerRoom(socketId: string): Room | undefined {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }
}
