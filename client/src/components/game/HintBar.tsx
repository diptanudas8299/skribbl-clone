import { useGameStore } from '../../store/gameStore';
import { useTimer } from '../../hooks/useTimer';

export function HintBar() {
  const { gameState, isDrawing } = useGameStore();
  const timeLeft = useTimer();

  if (!gameState || gameState.phase === 'waiting') return null;

  const timerColor = timeLeft > 30 ? '#22c55e' : timeLeft > 10 ? '#f97316' : '#ef4444';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', background: '#f9fafb', borderRadius: 10,
      border: '1px solid #e5e7eb', marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
        Round {gameState.round}/{gameState.totalRounds}
      </div>

      <div style={{ textAlign: 'center' }}>
        {isDrawing ? (
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 4, color: '#6366f1' }}>
            {gameState.word?.toUpperCase()}
          </span>
        ) : (
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 8, color: '#1f2937' }}>
            {gameState.hint}
          </span>
        )}
      </div>

      <div style={{
        fontSize: 22, fontWeight: 900, color: timerColor,
        minWidth: 50, textAlign: 'right',
      }}>
        {timeLeft}s
      </div>
    </div>
  );
}
