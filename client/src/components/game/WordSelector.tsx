import { Socket } from 'socket.io-client';
import { useGameStore } from '../../store/gameStore';

interface Props { socket: Socket; }

export function WordSelector({ socket }: Props) {
  const { wordOptions, setWordOptions } = useGameStore();

  if (!wordOptions.length) return null;

  const choose = (word: string) => {
    socket.emit('word_chosen', { word });
    setWordOptions([]); // ✅ immediately hide overlay so canvas is usable
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10, borderRadius: 12,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32,
        textAlign: 'center', maxWidth: 400,
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Choose a word to draw!</h2>
        <p style={{ color: '#6b7280', margin: '0 0 20px', fontSize: 14 }}>
          You have 15 seconds to pick
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {wordOptions.map(w => (
            <button
              key={w}
              onClick={() => choose(w)}
              style={{
                padding: '12px 22px', background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 16,
                fontWeight: 700, cursor: 'pointer', transition: 'transform .1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
