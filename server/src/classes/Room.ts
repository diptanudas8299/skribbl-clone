import { Server } from 'socket.io';
import { Player } from './Player';
import { Game } from './Game';
import { RoomSettings, Room as IRoom } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hints: 2,
  isPrivate: false,
};

export class Room implements IRoom {
  id: string;
  code: string;
  players: Player[];
  settings: RoomSettings;
  status: 'waiting' | 'playing' | 'ended';
  hostId: string;
  private game: Game | null = null;
  private io: Server;

  constructor(io: Server, hostPlayer: Player, settings: Partial<RoomSettings> = {}) {
    this.io = io;
    this.id = uuidv4();
    this.code = this.generateCode();
    this.players = [hostPlayer];
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.status = 'waiting';
    this.hostId = hostPlayer.id;
  }

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  addPlayer(player: Player): boolean {
    if (this.players.length >= this.settings.maxPlayers) return false;
    if (this.status !== 'waiting') return false;
    this.players.push(player);
    this.broadcast('player_joined', {
      player: player.toJSON(),
      players: this.getPlayersJSON(),
    });
    return true;
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter(p => p.id !== playerId);

    // Transfer host if needed
    if (this.hostId === playerId && this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.players[0].isHost = true;
    }

    this.broadcast('player_left', {
      playerId,
      players: this.getPlayersJSON(),
    });

    // End game if not enough players
    if (this.status === 'playing' && this.players.length < 2) {
      this.game?.destroy();
      this.status = 'waiting';
      this.broadcast('game_state', { phase: 'waiting' });
    }
  }

  startGame(requesterId: string): boolean {
    if (requesterId !== this.hostId) return false;
    if (this.players.length < 2) return false;
    if (this.status === 'playing') return false;

    this.status = 'playing';
    this.game = new Game(this.io, this.id, this.players, {
      rounds: this.settings.rounds,
      drawTime: this.settings.drawTime,
      wordCount: this.settings.wordCount,
      hints: this.settings.hints,
      customWords: this.settings.customWords,
    });
    this.game.start();
    return true;
  }

  handleWordChosen(playerId: string, word: string): void {
    if (this.game?.drawerId === playerId) {
      this.game.wordChosen(word);
    }
  }

  handleGuess(playerId: string, text: string): boolean {
    return this.game?.handleGuess(playerId, text) ?? false;
  }

  broadcast(event: string, data: unknown): void {
    this.io.to(this.id).emit(event, data);
  }

  getPlayersJSON() {
    return this.players.map(p => p.toJSON());
  }

  toJSON(): IRoom {
    return {
      id: this.id,
      code: this.code,
      players: this.getPlayersJSON(),
      settings: this.settings,
      status: this.status,
      hostId: this.hostId,
    };
  }

  isEmpty(): boolean {
    return this.players.length === 0;
  }
}
