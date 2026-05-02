import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';

export function Home() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { setMyName } = useGameStore();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 2,
    isPrivate: false,
  });

  const create = () => {
    if (!name.trim()) return alert('Enter your name');
    setMyName(name.trim());
    socket.emit('create_room', { playerName: name.trim(), settings });
    socket.once('room_created', () => navigate('/lobby'));
  };

  const join = () => {
    if (!name.trim()) return alert('Enter your name');
    if (!code.trim()) return alert('Enter room code');
    setMyName(name.trim());
    socket.emit('join_room', { roomCode: code.trim(), playerName: name.trim() });
    socket.once('room_joined', () => navigate('/lobby'));
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 900, color: '#6366f1' }}>
          🎨 Skribbl Clone
        </h1>
        <p style={{ color: '#6b7280', margin: '0 0 24px' }}>Draw it. Guess it. Win it.</p>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          style={inputStyle}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
                background: tab === t ? '#6366f1' : '#f3f4f6',
                color: tab === t ? '#fff' : '#374151',
              }}
            >
              {t === 'create' ? '🏠 Create Room' : '🔗 Join Room'}
            </button>
          ))}
        </div>

        {tab === 'join' ? (
          <>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Room code (e.g. AB12CD)"
              maxLength={8}
              style={inputStyle}
            />
            <button onClick={join} style={primaryBtn}>Join Game</button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Max Players', key: 'maxPlayers', min: 2, max: 20 },
                { label: 'Rounds', key: 'rounds', min: 2, max: 10 },
                { label: 'Draw Time (s)', key: 'drawTime', min: 15, max: 240 },
                { label: 'Word Choices', key: 'wordCount', min: 1, max: 5 },
                { label: 'Hints', key: 'hints', min: 0, max: 5 },
              ].map(({ label, key, min, max }) => (
                <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range" min={min} max={max}
                      value={settings[key as keyof typeof settings] as number}
                      onChange={e => setSettings(s => ({ ...s, [key]: +e.target.value }))}
                    />
                    <span style={{ minWidth: 28, textAlign: 'right', fontWeight: 700, color: '#6366f1' }}>
                      {settings[key as keyof typeof settings]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={create} style={primaryBtn}>Create & Play</button>
          </>
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
  width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  textAlign: 'center',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, marginBottom: 14,
  border: '1.5px solid #d1d5db', fontSize: 15, boxSizing: 'border-box', outline: 'none',
};
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px 0', background: '#6366f1', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
  cursor: 'pointer', marginTop: 4,
};
