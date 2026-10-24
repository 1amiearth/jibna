import { useState } from 'react';

/**
 * One-open-at-a-time sheet state. Switching waits for the previous Modal to dismiss —
 * iOS drops a Modal presented while another is still animating out.
 */
export function useSheets<T extends string>() {
  const [open, setOpen] = useState<T | null>(null);
  const switchTo = (next: T | null) => {
    if (open === null) return setOpen(next);
    setOpen(null);
    if (next) setTimeout(() => setOpen(next), 350);
  };
  return { open, show: switchTo, close: () => setOpen(null), is: (name: T) => open === name };
}
