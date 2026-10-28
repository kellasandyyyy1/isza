"use client";

import { useEffect, useRef, useState } from "react";

// True when any [data-clamp] line inside the element is cut short by its line clamp. Checked again whenever
// the element resizes or its text changes, so the "more" chevron shows only when there is more to read.
export function useClamped<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const check = () => {
      const lines = element.querySelectorAll<HTMLElement>("[data-clamp]");
      setClamped([...lines].some((line) => line.scrollHeight > line.clientHeight + 1));
    };
    // A ResizeObserver reports once as soon as it starts observing, so this also runs the first check.
    const resize = new ResizeObserver(check);
    resize.observe(element);
    const mutation = new MutationObserver(check);
    mutation.observe(element, { subtree: true, childList: true, characterData: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  return [ref, clamped] as const;
}
