import { Player as IPlayer } from '../shared/types';

export class Player implements IPlayer {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
  socketId: string;
  guessTime?: number;

  constructor(socketId: string, name: string, isHost = false) {
    this.id = socketId;
    this.socketId = socketId;
    this.name = name;
    this.score = 0;
    this.isHost = isHost;
    this.isDrawing = false;
    this.hasGuessed = false;
  }

  addScore(points: number): void {
    this.score += points;
  }

  resetRound(): void {
    this.isDrawing = false;
    this.hasGuessed = false;
    this.guessTime = undefined;
  }

  toJSON(): IPlayer {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isHost: this.isHost,
      isDrawing: this.isDrawing,
      hasGuessed: this.hasGuessed,
    };
  }
}
