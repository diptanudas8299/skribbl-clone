import { create } from 'zustand';
import { Player, Room, GameState, ChatMessage } from '@shared/types';

interface GameStore {
  // Identity
  myId: string;
  myName: string;

  // Room
  room: Room | null;
  players: Player[];

  // Game
  gameState: GameState | null;
  wordOptions: string[];
  chatMessages: ChatMessage[];
  timeLeft: number;

  // Drawing
  isDrawing: boolean;
  strokeHistory: ImageData[];

  // Actions
  setMyId: (id: string) => void;
  setMyName: (name: string) => void;
  setRoom: (room: Room) => void;
  setPlayers: (players: Player[]) => void;
  setGameState: (state: GameState) => void;
  setWordOptions: (words: string[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setTimeLeft: (t: number) => void;
  setIsDrawing: (v: boolean) => void;
  pushStroke: (data: ImageData) => void;
  popStroke: () => ImageData | undefined;
  clearStrokes: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  myId: '',
  myName: '',
  room: null,
  players: [],
  gameState: null,
  wordOptions: [],
  chatMessages: [],
  timeLeft: 0,
  isDrawing: false,
  strokeHistory: [],

  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),
  setRoom: (room) => set({ room, players: room.players }),
  setPlayers: (players) => set({ players }),
  setGameState: (gameState) => set({ gameState }),
  setWordOptions: (wordOptions) => set({ wordOptions }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages.slice(-100), msg] })),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  pushStroke: (data) =>
    set((s) => ({ strokeHistory: [...s.strokeHistory, data] })),
  popStroke: () => {
    const history = get().strokeHistory;
    if (history.length === 0) return undefined;
    const last = history[history.length - 1];
    set({ strokeHistory: history.slice(0, -1) });
    return last;
  },
  clearStrokes: () => set({ strokeHistory: [] }),
  reset: () =>
    set({
      room: null,
      players: [],
      gameState: null,
      wordOptions: [],
      chatMessages: [],
      timeLeft: 0,
      isDrawing: false,
      strokeHistory: [],
    }),
}));
