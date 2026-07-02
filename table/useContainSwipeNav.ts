import { useEffect, type RefObject } from 'react';

function isHorizontallyScrollable(el: HTMLElement): boolean {
  if (el.scrollWidth <= el.clientWidth) return false;
  const overflowX = getComputedStyle(el).overflowX;
  return overflowX === 'auto' || overflowX === 'scroll';
}

function canScrollX(el: HTMLElement, deltaX: number): boolean {
  return deltaX < 0 ? el.scrollLeft > 0 : Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;
}

function canConsumeHorizontal(target: EventTarget | null, boundary: HTMLElement, deltaX: number): boolean {
  let node = target instanceof HTMLElement ? target : null;
  while (node) {
    if (isHorizontallyScrollable(node) && canScrollX(node, deltaX)) return true;
    if (node === boundary) break;
    node = node.parentElement;
  }
  return false;
}

// Avale le swipe-back horizontal quand le pointeur est sur `ref`, sans toucher la nav ailleurs.
// Listener natif non-passif requis pour que preventDefault s'applique au geste.
export function useContainSwipeNav<T extends HTMLElement>(ref: RefObject<T | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (canConsumeHorizontal(event.target, el, event.deltaX)) return;
      event.preventDefault();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [ref]);
}
