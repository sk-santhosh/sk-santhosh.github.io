"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger in ms, applied as a transition-delay. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
};

/**
 * Fades + lifts its children into view once, the first time they
 * intersect the viewport. Degrades to "always visible" when
 * IntersectionObserver is unavailable; reduced-motion users get the
 * content with no transition (see the `reveal` utility in globals.css).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: RevealProps) {
  const node = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  const setNode = useCallback((el: HTMLElement | null) => {
    node.current = el;
  }, []);

  useEffect(() => {
    const el = node.current;
    if (!el) return;

    // No observer support: show everything on the next frame.
    // (Reduced-motion is handled in CSS, so no JS branch is needed.)
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Polymorphic tag — ElementType keeps the ref assignable across the union.
  const Tag = as as ElementType;

  return (
    <Tag
      ref={setNode}
      data-shown={shown}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
