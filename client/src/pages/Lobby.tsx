import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { useEffect } from 'react';

export function Lobby() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { room, players, myId } = useGameStore();

  useEffect(() => {
    if (!room) { navigate('/'); return; }
    socket.on('round_start', () => navigate('/game'));
    return () => { socket.off('round_start'); };
  }, [room]);

  if (!room) return null;

  const isHost = room.hostId === myId;
  const shareLink = `${window.location.origin}?code=${room.code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Invite link copied!');
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: '#6366f1' }}>
          🎮 Game Lobby
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          <div style={codeBadge}>Room: {room.code}</div>
          <button onClick={copyLink} style={copyBtn}>📋 Copy Invite</button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {/* Settings summary */}
          <div style={infoBox}>
            <div style={infoItem}><span>⏱</span><span>{room.settings.drawTime}s draw time</span></div>
            <div style={infoItem}><span>🔄</span><span>{room.settings.rounds} rounds</span></div>
            <div style={infoItem}><span>💡</span><span>{room.settings.hints} hints</span></div>
            <div style={infoItem}><span>📝</span><span>{room.settings.wordCount} word choices</span></div>
          </div>

          {/* Player list */}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#6b7280' }}>
              Players ({players.length}/{room.settings.maxPlayers})
            </h3>
            {players.map(p => (
              <div key={p.id} style={playerRow(p.id === myId)}>
                <span style={{ fontSize: 18 }}>{p.isHost ? '👑' : '🎨'}</span>
                <span style={{ flex: 1, fontWeight: p.id === myId ? 700 : 400 }}>
                  {p.name}{p.id === myId ? ' (you)' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            disabled={players.length < 2}
            onClick={() => socket.emit('start_game')}
            style={{
              ...primaryBtn,
              opacity: players.length < 2 ? 0.5 : 1,
              cursor: players.length < 2 ? 'not-allowed' : 'pointer',
            }}
          >
            {players.length < 2 ? 'Waiting for more players...' : '🚀 Start Game'}
          </button>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: 'linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)',
  padding: 16,
};
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: 36,
  width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
};
const codeBadge: React.CSSProperties = {
  background: '#ede9fe', color: '#6366f1', padding: '6px 16px',
  borderRadius: 20, fontWeight: 800, fontSize: 18, letterSpacing: 2,
};
const copyBtn: React.CSSProperties = {
  padding: '6px 14px', background: '#f3f4f6', border: '1px solid #d1d5db',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
const infoBox: React.CSSProperties = {
  background: '#f9fafb', borderRadius: 12, padding: '12px 16px',
  display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160,
};
const infoItem: React.CSSProperties = {
  display: 'flex', gap: 8, fontSize: 14, color: '#374151',
};
const playerRow = (isMe: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 10px', marginBottom: 6,
  background: isMe ? '#ede9fe' : '#f9fafb',
  border: isMe ? '1.5px solid #6366f1' : '1px solid #e5e7eb',
  borderRadius: 10, fontSize: 14,
});
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px 0', background: '#6366f1', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
};
