import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { DrawingCanvas } from '../components/canvas/DrawingCanvas';
import { ChatBox } from '../components/game/ChatBox';
import { ScoreBoard } from '../components/game/ScoreBoard';
import { HintBar } from '../components/game/HintBar';
import { WordSelector } from '../components/game/WordSelector';

export function Game() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { room, gameState, isDrawing, wordOptions } = useGameStore();

  useEffect(() => {
    if (!room) navigate('/');
  }, [room]);

  if (!room) return null;

  const isGameOver = gameState?.phase === 'game-end';

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 900, fontSize: 20, color: '#6366f1' }}>🎨 Skribbl Clone</span>
        <HintBar />
        <span style={{ fontSize: 13, color: '#9ca3af' }}>Room: {room.code}</span>
      </div>

      {/* Main layout */}
      <div style={mainLayout}>
        {/* Left: Scoreboard */}
        <div style={sidePanel}>
          <ScoreBoard />
        </div>

        {/* Center: Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          {wordOptions.length > 0 && isDrawing && (
            <WordSelector socket={socket} />
          )}
          <DrawingCanvas socket={socket} isDrawer={isDrawing} />
        </div>

        {/* Right: Chat */}
        <div style={{ ...sidePanel, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <ChatBox socket={socket} isDrawer={isDrawing} />
        </div>
      </div>

      {/* Game Over overlay */}
      {isGameOver && (
        <div style={overlayStyle}>
          <div style={overlayCard}>
            <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>🏆 Game Over!</h1>
            {gameState?.leaderboard?.map((entry: any, i: number) => (
              <div key={entry.playerId} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 16px', borderRadius: 8, marginBottom: 6,
                background: i === 0 ? '#fef3c7' : '#f9fafb',
                fontWeight: i === 0 ? 800 : 400, fontSize: 16,
              }}>
                <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {entry.playerName}</span>
                <span>{entry.score} pts</span>
              </div>
            ))}
            <button
              onClick={() => { navigate('/'); window.location.reload(); }}
              style={{
                marginTop: 20, padding: '12px 32px', background: '#6366f1',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', background: '#f3f4f6',
  display: 'flex', flexDirection: 'column',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb',
  flexWrap: 'wrap', gap: 8,
};
const mainLayout: React.CSSProperties = {
  flex: 1, display: 'flex', gap: 12, padding: 12,
  maxWidth: 1400, margin: '0 auto', width: '100%',
};
const sidePanel: React.CSSProperties = {
  width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
};
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const overlayCard: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: 36,
  maxWidth: 420, width: '100%', textAlign: 'center',
};
