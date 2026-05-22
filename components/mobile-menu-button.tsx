"use client";

import { useEffect, useState } from "react";
import { Command } from "lucide-react";

export default function MobileMenuButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on touch/mobile — hide when keyboard is used
    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    window.addEventListener("touchstart", show, { once: true });
    window.addEventListener("keydown", hide, { once: true });

    // Default: show on small screens
    setVisible(window.innerWidth < 640);

    return () => {
      window.removeEventListener("touchstart", show);
      window.removeEventListener("keydown", hide);
    };
  }, []);

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true, bubbles: true }));
  };

  if (!visible) return null;

  return (
    <button
      onClick={openPalette}
      aria-label="Open menu"
      className="sm:hidden fixed bottom-5 right-4 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg active:scale-95 transition-transform"
    >
      <Command size={18} />
    </button>
  );
}
