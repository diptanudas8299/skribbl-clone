import { useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { DrawStroke } from '../shared/types';
import { useGameStore } from '../store/gameStore';

interface UseCanvasOptions {
  socket: Socket;
  isDrawer: boolean;
}

export function useCanvas({ socket, isDrawer }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMouseDown = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const currentColor = useRef('#000000');
  const currentSize = useRef(4);
  const currentTool = useRef<'pen' | 'eraser'>('pen');
  const animFrameRef = useRef<number>();
  const pendingStroke = useRef<DrawStroke | null>(null);
  const { pushStroke, popStroke, clearStrokes } = useGameStore();

  const getCtx = () => canvasRef.current?.getContext('2d');

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    pushStroke(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }, [pushStroke]);

  const drawStroke = useCallback((stroke: DrawStroke) => {
    const ctx = getCtx();
    if (!ctx) return;

    if (stroke.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
    } else if (stroke.type === 'move') {
      ctx.lineTo(stroke.x, stroke.y);
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.size * 3 : stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, []);

  // Receive remote strokes
  useEffect(() => {
    socket.on('draw_stroke', drawStroke);
    socket.on('canvas_clear', () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      clearStrokes();
    });
    socket.on('draw_undo', () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const snap = popStroke();
      if (snap) {
        ctx.putImageData(snap, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
    return () => {
      socket.off('draw_stroke');
      socket.off('canvas_clear');
      socket.off('draw_undo');
    };
  }, [socket, drawStroke, popStroke, clearStrokes]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const emitThrottled = useCallback(() => {
    if (pendingStroke.current) {
      socket.emit('draw_stroke', pendingStroke.current);
      pendingStroke.current = null;
    }
    animFrameRef.current = requestAnimationFrame(emitThrottled);
  }, [socket]);

  useEffect(() => {
    if (isDrawer) {
      animFrameRef.current = requestAnimationFrame(emitThrottled);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDrawer, emitThrottled]);

  const attachEvents = useCallback((canvas: HTMLCanvasElement) => {
    if (!isDrawer) return;

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isMouseDown.current = true;
      saveSnapshot();
      const pos = getPos(e, canvas);
      lastPos.current = pos;
      const stroke: DrawStroke = {
        ...pos,
        color: currentColor.current,
        size: currentSize.current,
        type: 'start',
        tool: currentTool.current,
      };
      drawStroke(stroke);
      socket.emit('draw_stroke', stroke);
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isMouseDown.current) return;
      const pos = getPos(e, canvas);
      const stroke: DrawStroke = {
        ...pos,
        color: currentColor.current,
        size: currentSize.current,
        type: 'move',
        tool: currentTool.current,
      };
      drawStroke(stroke);
      pendingStroke.current = stroke;
      lastPos.current = pos;
    };

    const onEnd = () => {
      isMouseDown.current = false;
      lastPos.current = null;
      socket.emit('draw_stroke', { type: 'end', x: 0, y: 0, color: '', size: 0, tool: 'pen' });
    };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);

    return () => {
      canvas.removeEventListener('mousedown', onStart);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onEnd);
      canvas.removeEventListener('mouseleave', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
    };
  }, [isDrawer, drawStroke, socket, saveSnapshot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return attachEvents(canvas);
  }, [attachEvents]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    clearStrokes();
    socket.emit('canvas_clear');
  }, [socket, clearStrokes]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const snap = popStroke();
    if (snap) {
      ctx.putImageData(snap, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    socket.emit('draw_undo');
  }, [socket, popStroke]);

  const setColor = (c: string) => { currentColor.current = c; };
  const setSize = (s: number) => { currentSize.current = s; };
  const setTool = (t: 'pen' | 'eraser') => { currentTool.current = t; };

  return { canvasRef, clearCanvas, undo, setColor, setSize, setTool };
}
