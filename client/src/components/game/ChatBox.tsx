import { useRef, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useGameStore } from '../../store/gameStore';
import { ChatMessage } from '@shared/types';

interface Props { socket: Socket; isDrawer: boolean; }

export function ChatBox({ socket, isDrawer }: Props) {
  const { chatMessages } = useGameStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (!isDrawer) {
      socket.emit('guess', { text });
    } else {
      socket.emit('chat', { text });
    }
    setInput('');
  };

  const msgColor = (type: ChatMessage['type']) => {
    if (type === 'correct') return '#d1fae5';
    if (type === 'system') return '#ede9fe';
    return '#fff';
  };

  const msgTextColor = (type: ChatMessage['type']) => {
    if (type === 'correct') return '#065f46';
    if (type === 'system') return '#5b21b6';
    return '#111827';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
      <div style={{
        flex: 1, overflowY: 'auto', padding: 10, display: 'flex',
        flexDirection: 'column', gap: 4,
      }}>
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            style={{
              background: msgColor(msg.type),
              color: msgTextColor(msg.type),
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: msg.type === 'correct' ? 700 : 400,
            }}
          >
            {msg.type !== 'system' && (
              <span style={{ fontWeight: 600 }}>{msg.playerName}: </span>
            )}
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: '1px solid #e5e7eb' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={isDrawer ? 'Chat...' : 'Type your guess...'}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={send}
          style={{
            padding: '8px 14px', background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
