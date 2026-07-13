import { useState, useEffect } from 'react';

interface ClockState {
  time: string;
  date: string;
  timestamp: number;
  iso: string;
}

export const useClock = (interval: number = 1000): ClockState => {
  const getClockState = (): ClockState => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      date: now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      timestamp: now.getTime(),
      iso: now.toISOString(),
    };
  };

  const [clock, setClock] = useState<ClockState>(getClockState);

  useEffect(() => {
    const ticker = setInterval(() => {
      setClock(getClockState());
    }, interval);
    return () => clearInterval(ticker);
  }, [interval]);

  return clock;
};
