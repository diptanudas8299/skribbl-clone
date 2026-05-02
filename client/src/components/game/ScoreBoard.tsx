import { useGameStore } from '../../store/gameStore';

export function ScoreBoard() {
  const { players, myId } = useGameStore();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>Players</h3>
      {sorted.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 8,
            background: p.id === myId ? '#ede9fe' : '#f9fafb',
            border: p.id === myId ? '1.5px solid #6366f1' : '1px solid #e5e7eb',
          }}
        >
          <span style={{ fontWeight: 700, color: '#9ca3af', fontSize: 13, minWidth: 18 }}>
            {i + 1}.
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: p.isDrawing ? 700 : 400 }}>
            {p.isDrawing ? '✏️ ' : ''}{p.name}
            {p.isHost ? ' 👑' : ''}
            {p.hasGuessed && !p.isDrawing ? ' ✅' : ''}
          </span>
          <span style={{ fontWeight: 700, color: '#6366f1', fontSize: 14 }}>{p.score}</span>
        </div>
      ))}
    </div>
  );
}
