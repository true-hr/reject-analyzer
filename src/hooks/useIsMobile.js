import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

function detectMobile() {
  if (typeof window === "undefined") return false;
  const isNarrow = window.innerWidth < MOBILE_BREAKPOINT;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return isNarrow && isCoarsePointer;
}

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(detectMobile);

  useEffect(() => {
    const mqWidth = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const mqPointer = window.matchMedia("(pointer: coarse)");
    const handler = () => setIsMobile(detectMobile());
    mqWidth.addEventListener("change", handler);
    mqPointer.addEventListener("change", handler);
    return () => {
      mqWidth.removeEventListener("change", handler);
      mqPointer.removeEventListener("change", handler);
    };
  }, []);

  return isMobile;
}
