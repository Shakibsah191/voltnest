import { useEffect, useState } from 'react';

const MESSAGES = [
  'Delivery ৳50 in Rajshahi and Dhaka, ৳120 anywhere else',
  'Cash on Delivery available across Bangladesh',
  '18-month warranty on every VoltNest product',
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduceMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 5000);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="container flex h-9 items-center justify-center text-center text-xs sm:text-sm" aria-live="polite">
        {MESSAGES[index]}
      </p>
    </div>
  );
}
