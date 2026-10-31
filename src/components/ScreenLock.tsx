"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Locks the viewport on the home route only.
 *
 * Keyed off the pathname rather than the presence of a DOM node: during a
 * client-side navigation the router can keep the previous page mounted for
 * a beat, and a `:has()` rule on that node left the next page unscrollable.
 */
export default function ScreenLock() {
  const pathname = usePathname();

  useEffect(() => {
    const locked = pathname === "/";
    const root = document.documentElement;
    root.classList.toggle("screen-locked", locked);
    return () => root.classList.remove("screen-locked");
  }, [pathname]);

  return null;
}
