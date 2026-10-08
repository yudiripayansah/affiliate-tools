'use client';

// true setelah hydrate di browser, false saat render server — tanpa setState di effect.
import { useSyncExternalStore } from 'react';

const noop = () => () => {};
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const subscribeMotion = (cb) => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
export const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => false);
