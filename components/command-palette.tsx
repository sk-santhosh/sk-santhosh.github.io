"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Home, BookOpen, User, Code2, Globe, Mail, ArrowUpRight, ArrowRight, Terminal } from "lucide-react";

const commands = [
  { label: "Home", action: "/", type: "nav", icon: Home },
  { label: "Blogs", action: "/blogs", type: "nav", icon: BookOpen },
  { label: "About", action: "/about", type: "nav", icon: User },
  { label: "GitHub", action: "https://github.com/sk-santhosh", type: "external", icon: Code2 },
  { label: "LinkedIn", action: "https://linkedin.com/in/sk-santhosh-j", type: "external", icon: Globe },
  { label: "Email", action: "mailto:santhosh@sentinelfox.com", type: "external", icon: Mail },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const run = (cmd: (typeof commands)[number]) => {
    close();
    if (cmd.type === "nav") router.push(cmd.action);
    else window.open(cmd.action, "_blank");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:pt-20 px-0 sm:px-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full sm:max-w-sm bg-white dark:bg-slate-900 sm:rounded-lg rounded-t-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Terminal size={14} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none bg-transparent"
          />
        </div>
        <ul className="py-1 max-h-72 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No results</li>
          )}
          {filtered.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <li key={cmd.label}>
                <button
                  onClick={() => run(cmd)}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 flex items-center justify-between group"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={15} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    {cmd.label}
                  </span>
                  {cmd.type === "external"
                    ? <ArrowUpRight size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                    : <ArrowRight size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                  }
                </button>
              </li>
            );
          })}
        </ul>
        <div className="sm:hidden h-4" />
      </div>
    </div>
  );
}
