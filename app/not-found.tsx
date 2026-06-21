import Link from "next/link";
import { Home, BookOpen } from "lucide-react";

export const metadata = {
  title: "Page not found",
  description: "The page you were looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center text-center py-16 sm:py-24">
      {/* terminal block */}
      <div className="w-full max-w-md text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="px-4 py-4 font-mono text-xs sm:text-sm leading-relaxed">
          <p className="text-slate-500 dark:text-slate-400">
            <span className="text-sky-500">{">_"}</span> cd /this-page
          </p>
          <p className="text-rose-500 dark:text-rose-400">
            bash: cd: /this-page: No such file or directory
          </p>
          <p className="text-slate-400 dark:text-slate-500 mt-1">
            exit status 404
          </p>
        </div>
      </div>

      <h1 className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm">
        The page you were looking for has moved, been removed or never existed.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
        >
          <Home size={14} /> Home
        </Link>
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
        >
          <BookOpen size={14} /> Read the blog
        </Link>
      </div>
    </div>
  );
}
