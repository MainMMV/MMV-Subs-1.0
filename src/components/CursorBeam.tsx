import React, { useEffect, useState } from "react";

export const CursorBeam: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shouldEnable = finePointer.matches && !reducedMotion.matches;
    setEnabled(shouldEnable);

    if (!shouldEnable) return;

    let raf = 0;
    const updateBeam = (event: PointerEvent) => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--cursor-beam-x", `${event.clientX}px`);
        document.documentElement.style.setProperty("--cursor-beam-y", `${event.clientY}px`);
      });
    };

    window.addEventListener("pointermove", updateBeam, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", updateBeam);
    };
  }, []);

  return enabled ? <div className="cursor-beam" aria-hidden="true" /> : null;
};
