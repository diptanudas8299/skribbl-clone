import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useTimer() {
  const { timeLeft, setTimeLeft, gameState } = useGameStore();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (gameState?.phase === 'drawing' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(Math.max(0, useGameStore.getState().timeLeft - 1));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState?.phase, gameState?.round]);

  return timeLeft;
}
