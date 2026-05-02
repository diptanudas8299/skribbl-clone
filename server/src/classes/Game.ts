import { Server } from 'socket.io';
import { Player } from './Player';
import { GameState, LeaderboardEntry } from '../../../shared/types';
import { getRandomWords, generateHint } from '../utils/wordUtils';

export class Game {
  private io: Server;
  private roomId: string;
  private players: Player[];
  private settings: { rounds: number; drawTime: number; wordCount: number; hints: number; customWords?: string[] };

  round: number = 0;
  phase: GameState['phase'] = 'waiting';
  currentWord: string = '';
  currentHint: string = '';
  drawerId: string = '';
  drawerIndex: number = -1;

  private roundTimer?: NodeJS.Timeout;
  private hintTimers: NodeJS.Timeout[] = [];
  private wordOptions: string[] = [];

  constructor(
    io: Server,
    roomId: string,
    players: Player[],
    settings: { rounds: number; drawTime: number; wordCount: number; hints: number; customWords?: string[] }
  ) {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.settings = settings;
  }

  start(): void {
    this.round = 0;
    this.drawerIndex = -1;
    this.nextRound();
  }

  nextRound(): void {
    this.clearTimers();
    this.round++;

    if (this.round > this.settings.rounds * this.players.length) {
      this.endGame();
      return;
    }

    this.drawerIndex = (this.drawerIndex + 1) % this.players.length;
    if (this.drawerIndex === 0 && this.round > this.players.length) {
      // All players done one cycle
    }

    const drawer = this.players[this.drawerIndex];
    if (!drawer) { this.endGame(); return; }

    this.drawerId = drawer.id;
    this.players.forEach(p => p.resetRound());
    drawer.isDrawing = true;

    this.phase = 'word-select';
    this.wordOptions = getRandomWords(this.settings.wordCount, this.settings.customWords);

    // Send word options only to drawer
    this.io.to(drawer.socketId).emit('round_start', {
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions: this.wordOptions,
      drawTime: this.settings.drawTime,
      round: this.round,
    });

    // Tell everyone else who is drawing
    this.io.to(this.roomId).except(drawer.socketId).emit('round_start', {
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions: [],
      drawTime: this.settings.drawTime,
      round: this.round,
    });

    // Auto-pick word after 15s if drawer doesn't choose
    this.roundTimer = setTimeout(() => {
      if (this.phase === 'word-select') {
        this.wordChosen(this.wordOptions[0]);
      }
    }, 15000);
  }

  wordChosen(word: string): void {
    this.clearTimers();
    this.currentWord = word;
    this.currentHint = word.split('').map(c => c === ' ' ? ' ' : '_').join(' ');
    this.phase = 'drawing';

    // Send actual word to drawer only
    const drawer = this.players[this.drawerIndex];
    if (drawer) {
      this.io.to(drawer.socketId).emit('game_state', this.getStateForDrawer());
    }

    // Send blank hint to guessers
    this.io.to(this.roomId).except(drawer?.socketId ?? '').emit('game_state', this.getStateForGuesser());

    this.io.to(this.roomId).emit('chat_message', {
      id: Date.now().toString(),
      playerId: 'system',
      playerName: 'System',
      text: `${drawer?.name ?? 'Drawer'} is drawing now!`,
      type: 'system',
      timestamp: Date.now(),
    });

    // Schedule hints
    if (this.settings.hints > 0) {
      const interval = Math.floor(this.settings.drawTime / (this.settings.hints + 1));
      for (let h = 1; h <= this.settings.hints; h++) {
        const timer = setTimeout(() => {
          this.revealHint(h);
        }, interval * h * 1000);
        this.hintTimers.push(timer);
      }
    }

    // Round end timer
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.settings.drawTime * 1000);
  }

  private revealHint(count: number): void {
    this.currentHint = generateHint(this.currentWord, count);
    const drawer = this.players[this.drawerIndex];
    this.io.to(this.roomId).except(drawer?.socketId ?? '').emit('hint_update', {
      hint: this.currentHint,
    });
  }

  handleGuess(playerId: string, text: string): boolean {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isDrawing || player.hasGuessed || this.phase !== 'drawing') return false;

    const correct = text.trim().toLowerCase() === this.currentWord.trim().toLowerCase();

    if (correct) {
      player.hasGuessed = true;
      player.guessTime = Date.now();

      // Points: faster = more points (max 500, min 50)
      const elapsed = (this.settings.drawTime * 1000 - this.getRemainingTime()) / 1000;
      const points = Math.max(50, Math.round(500 * (1 - elapsed / this.settings.drawTime)));
      player.addScore(points);

      // Drawer gets points too
      const drawer = this.players[this.drawerIndex];
      if (drawer) drawer.addScore(Math.round(points / 2));

      this.io.to(this.roomId).emit('guess_result', {
        correct: true,
        playerId,
        playerName: player.name,
        points,
        scores: this.getScores(),
      });

      // End round if everyone guessed
      const guessers = this.players.filter(p => !p.isDrawing);
      if (guessers.every(p => p.hasGuessed)) {
        setTimeout(() => this.endRound(), 2000);
      }

      return true;
    }

    return false;
  }

  endRound(): void {
    this.clearTimers();
    this.phase = 'round-end';

    this.io.to(this.roomId).emit('round_end', {
      word: this.currentWord,
      scores: this.getScores(),
    });

    // Next round after 5s
    setTimeout(() => {
      if (this.round >= this.settings.rounds * this.players.length) {
        this.endGame();
      } else {
        this.nextRound();
      }
    }, 5000);
  }

  endGame(): void {
    this.phase = 'game-end';
    const leaderboard: LeaderboardEntry[] = [...this.players]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ playerId: p.id, playerName: p.name, score: p.score, rank: i + 1 }));

    this.io.to(this.roomId).emit('game_over', {
      winner: leaderboard[0],
      leaderboard,
    });
  }

  private getScores(): Record<string, number> {
    return Object.fromEntries(this.players.map(p => [p.id, p.score]));
  }

  private getRemainingTime(): number {
    // Approximate — production would use a timestamp-based approach
    return 0;
  }

  getStateForDrawer(): GameState {
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.settings.rounds,
      drawerId: this.drawerId,
      drawerName: this.players[this.drawerIndex]?.name ?? '',
      word: this.currentWord,
      hint: this.currentWord.split('').map(c => c === ' ' ? ' ' : c).join(' '),
      timeLeft: this.settings.drawTime,
      scores: this.getScores(),
    };
  }

  getStateForGuesser(): GameState {
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.settings.rounds,
      drawerId: this.drawerId,
      drawerName: this.players[this.drawerIndex]?.name ?? '',
      wordLength: this.currentWord.length,
      hint: this.currentHint,
      timeLeft: this.settings.drawTime,
      scores: this.getScores(),
    };
  }

  private clearTimers(): void {
    if (this.roundTimer) clearTimeout(this.roundTimer);
    this.hintTimers.forEach(t => clearTimeout(t));
    this.hintTimers = [];
  }

  destroy(): void {
    this.clearTimers();
  }
}
