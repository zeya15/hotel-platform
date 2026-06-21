"use client";
import { useEffect, useRef, useState } from "react";

type AnimationType = "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-in";

const HIDDEN: Record<AnimationType, { opacity: number; transform: string }> = {
  "fade-up":    { opacity: 0, transform: "translateY(28px)" },
  "fade-in":    { opacity: 0, transform: "none" },
  "slide-left": { opacity: 0, transform: "translateX(32px)" },
  "slide-right":{ opacity: 0, transform: "translateX(-32px)" },
  "scale-in":   { opacity: 0, transform: "scale(0.94)" },
};

interface Props {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
}

export default function Reveal({
  children,
  animation = "fade-up",
  delay = 0,
  className = "",
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const { opacity, transform } = HIDDEN[animation];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : opacity,
        transform: visible ? "none" : transform,
        transition: `opacity 0.65s ease-out ${visible ? delay : 0}ms, transform 0.65s ease-out ${visible ? delay : 0}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
