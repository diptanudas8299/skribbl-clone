import { useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useCanvas } from '../../hooks/useCanvas';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#a16207', '#6b7280', '#1d4ed8', '#15803d', '#b91c1c',
  '#7c3aed',
];

const SIZES = [2, 4, 8, 14, 22];

interface Props {
  socket: Socket;
  isDrawer: boolean;
}

export function DrawingCanvas({ socket, isDrawer }: Props) {
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeSize, setActiveSize] = useState(4);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');

  const { canvasRef, clearCanvas, undo, setColor, setSize, setTool } = useCanvas({
    socket,
    isDrawer,
  });

  const handleColor = (c: string) => {
    setActiveColor(c);
    setColor(c);
    setActiveTool('pen');
    setTool('pen');
  };

  const handleSize = (s: number) => {
    setActiveSize(s);
    setSize(s);
  };

  const handleTool = (t: 'pen' | 'eraser') => {
    setActiveTool(t);
    setTool(t);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isDrawer && (
        <div style={toolbarStyle}>
          {/* Colors */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 180 }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => handleColor(c)}
                style={{
                  width: 24, height: 24, borderRadius: 4,
                  background: c, border: activeColor === c && activeTool === 'pen'
                    ? '3px solid #6366f1' : '2px solid #d1d5db',
                  cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>

          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch' }} />

          {/* Sizes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => handleSize(s)}
                style={{
                  width: s + 8, height: s + 8, borderRadius: '50%',
                  background: activeSize === s ? '#6366f1' : '#374151',
                  border: 'none', cursor: 'pointer',
                }}
              />
            ))}
          </div>

          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch' }} />

          {/* Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => handleTool('pen')}
              style={toolBtnStyle(activeTool === 'pen')}
              title="Pen"
            >✏️</button>
            <button
              onClick={() => handleTool('eraser')}
              style={toolBtnStyle(activeTool === 'eraser')}
              title="Eraser"
            >🧹</button>
            <button onClick={undo} style={toolBtnStyle(false)} title="Undo">↩️</button>
            <button onClick={clearCanvas} style={toolBtnStyle(false)} title="Clear">🗑️</button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{
          border: '2px solid #e5e7eb',
          borderRadius: 12,
          background: '#fff',
          width: '100%',
          maxWidth: 800,
          cursor: isDrawer ? (activeTool === 'eraser' ? 'cell' : 'crosshair') : 'default',
          touchAction: 'none',
        }}
      />
    </div>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: '8px 12px',
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const toolBtnStyle = (active: boolean): React.CSSProperties => ({
  width: 36, height: 36, borderRadius: 8,
  background: active ? '#ede9fe' : '#fff',
  border: active ? '2px solid #6366f1' : '1px solid #d1d5db',
  cursor: 'pointer', fontSize: 18, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
});
