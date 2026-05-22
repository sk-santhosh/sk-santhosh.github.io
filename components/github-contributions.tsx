import {resume} from '@/data/resume';

type Contribution = {date: string; count: number; level: 0 | 1 | 2 | 3 | 4};

const levelColors: Record<number, string> = {
	0: 'bg-slate-100 dark:bg-slate-800',
	1: 'bg-emerald-200 dark:bg-emerald-900',
	2: 'bg-emerald-300 dark:bg-emerald-700',
	3: 'bg-emerald-500 dark:bg-emerald-500',
	4: 'bg-emerald-700 dark:bg-emerald-400',
};

async function getContributions(username: string): Promise<Contribution[]> {
	try {
		const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`, {
			cache: 'force-cache',
		});
		if (!res.ok) return [];
		const data = await res.json();
		return data.contributions ?? [];
	} catch {
		return [];
	}
}

function toWeeks(contributions: Contribution[]): (Contribution | null)[][] {
	const weeks: (Contribution | null)[][] = [];
	let week: (Contribution | null)[] = [];

	if (contributions.length > 0) {
		const startDay = new Date(contributions[0].date).getDay();
		for (let i = 0; i < startDay; i++) week.push(null);
	}

	for (const c of contributions) {
		week.push(c);
		if (week.length === 7) {
			weeks.push(week);
			week = [];
		}
	}

	if (week.length > 0) {
		while (week.length < 7) week.push(null);
		weeks.push(week);
	}

	return weeks;
}

export default async function GitHubContributions() {
	const username = resume.social.github.replace('https://github.com/', '');
	const contributions = await getContributions(username);

	if (contributions.length === 0) return null;

	const weeks = toWeeks(contributions).slice(-53);
	const total = contributions.reduce((sum, c) => sum + c.count, 0);

	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">GitHub Contributions</h2>
				<span className="text-xs text-slate-400 dark:text-slate-500">{total} in the last year</span>
			</div>
			<div className="flex gap-[2px] w-full">
				{weeks.map((week, wi) => (
					<div key={wi} className="flex flex-col gap-[2px] flex-1">
						{week.map((day, di) => (
							<div
								key={di}
								title={day ? `${day.date}: ${day.count}` : ''}
								className={`aspect-square w-full rounded-[2px] ${day ? levelColors[day.level] : 'bg-slate-100'}`}
							/>
						))}
					</div>
				))}
			</div>
		</section>
	);
}
