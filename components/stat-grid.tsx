import {resume} from '@/data/resume';

// Colour role: amber = metrics. Every headline number on the site uses this
// single accent so a reader learns "amber → measured result".
export const metricAccent = 'text-amber-600 dark:text-amber-400';

export default function StatGrid() {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
			{resume.stats.map((stat) => (
				<div
					key={stat.label}
					className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/40"
				>
					<p className={`text-2xl font-bold tracking-tight ${metricAccent}`}>{stat.value}</p>
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
				</div>
			))}
		</div>
	);
}
