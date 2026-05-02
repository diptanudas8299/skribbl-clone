import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { ChatMessage, GameState, Player, Room } from '../shared/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, { autoConnect: false });
  }
  return socketInstance;
}

export function useSocket() {
  const socket = useRef<Socket>(getSocket());
  const store = useGameStore();

  useEffect(() => {
    const s = socket.current;
    if (!s.connected) s.connect();

    s.on('connect', () => {
      store.setMyId(s.id ?? '');
    });

    s.on('room_created', ({ room }: { room: Room }) => {
      store.setRoom(room);
    });

    s.on('room_joined', ({ room }: { room: Room }) => {
      store.setRoom(room);
    });

    s.on('player_joined', ({ players }: { players: Player[] }) => {
      store.setPlayers(players);
    });

    s.on('player_left', ({ players }: { players: Player[] }) => {
      store.setPlayers(players);
    });

    s.on('settings_updated', ({ settings }: { settings: Room['settings'] }) => {
      const room = useGameStore.getState().room;
      if (room) store.setRoom({ ...room, settings });
    });

    s.on('game_state', (state: GameState) => {
      store.setGameState(state);
      store.setTimeLeft(state.timeLeft);
      const myId = useGameStore.getState().myId;
      store.setIsDrawing(state.drawerId === myId);
      store.setWordOptions([]); // ✅ clear word selector overlay when game state syncs
    });

    s.on('round_start', (payload: {
      drawerId: string; drawerName: string;
      wordOptions: string[]; drawTime: number; round: number;
    }) => {
      store.setWordOptions(payload.wordOptions);
      store.clearStrokes();
      const myId = useGameStore.getState().myId;
      store.setIsDrawing(payload.drawerId === myId);
      store.addChatMessage({
        id: Date.now().toString(),
        playerId: 'system',
        playerName: 'System',
        text: `Round ${payload.round} — ${payload.drawerName} is drawing!`,
        type: 'system',
        timestamp: Date.now(),
      });
    });

    s.on('round_end', ({ word, scores }: { word: string; scores: Record<string, number> }) => {
      store.setWordOptions([]);
      store.addChatMessage({
        id: Date.now().toString(),
        playerId: 'system',
        playerName: 'System',
        text: `The word was: "${word}"`,
        type: 'system',
        timestamp: Date.now(),
      });
      // Update scores in players list
      const players = useGameStore.getState().players.map(p => ({
        ...p,
        score: scores[p.id] ?? p.score,
      }));
      store.setPlayers(players);
    });

    s.on('hint_update', ({ hint }: { hint: string }) => {
      const gs = useGameStore.getState().gameState;
      if (gs) store.setGameState({ ...gs, hint });
    });

    s.on('guess_result', (payload: {
      correct: boolean; playerId: string;
      playerName: string; points: number; scores: Record<string, number>;
    }) => {
      if (payload.correct) {
        store.addChatMessage({
          id: Date.now().toString(),
          playerId: payload.playerId,
          playerName: payload.playerName,
          text: `${payload.playerName} guessed the word! (+${payload.points} pts)`,
          type: 'correct',
          timestamp: Date.now(),
        });
        const players = useGameStore.getState().players.map(p => ({
          ...p,
          score: payload.scores[p.id] ?? p.score,
          hasGuessed: p.id === payload.playerId ? true : p.hasGuessed,
        }));
        store.setPlayers(players);
      }
    });

    s.on('game_over', (payload: { winner: { playerName: string }; leaderboard: unknown[] }) => {
      store.addChatMessage({
        id: Date.now().toString(),
        playerId: 'system',
        playerName: 'System',
        text: `Game over! 🏆 ${payload.winner?.playerName} wins!`,
        type: 'system',
        timestamp: Date.now(),
      });
      const gs = useGameStore.getState().gameState;
      if (gs) store.setGameState({ ...gs, phase: 'game-end', leaderboard: payload.leaderboard as any });
    });

    s.on('chat_message', (msg: ChatMessage) => {
      store.addChatMessage(msg);
    });

    s.on('error', ({ message }: { message: string }) => {
      alert(message);
    });

    return () => {
      s.off('connect');
      s.off('room_created');
      s.off('room_joined');
      s.off('player_joined');
      s.off('player_left');
      s.off('settings_updated');
      s.off('game_state');
      s.off('round_start');
      s.off('round_end');
      s.off('hint_update');
      s.off('guess_result');
      s.off('game_over');
      s.off('chat_message');
      s.off('error');
    };
  }, []);

  return socket.current;
}
