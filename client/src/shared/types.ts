export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
  avatar?: string;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  isPrivate: boolean;
  customWords?: string[];
}

export interface Room {
  id: string;
  code: string;
  players: Player[];
  settings: RoomSettings;
  status: 'waiting' | 'playing' | 'ended';
  hostId: string;
}

export interface GameState {
  phase: 'waiting' | 'word-select' | 'drawing' | 'round-end' | 'game-end';
  round: number;
  totalRounds: number;
  drawerId: string;
  drawerName: string;
  word?: string;
  wordLength?: number;
  hint: string;
  timeLeft: number;
  scores: Record<string, number>;
  leaderboard?: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'chat' | 'guess' | 'correct' | 'system';
  timestamp: number;
}

export interface DrawStroke {
  x: number;
  y: number;
  color: string;
  size: number;
  type: 'start' | 'move' | 'end';
  tool: 'pen' | 'eraser';
}

export interface CreateRoomPayload {
  playerName: string;
  settings: Partial<RoomSettings>;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface GuessPayload {
  text: string;
}

export interface WordChosenPayload {
  word: string;
}