import { resume } from '@/data/resume';

export default function OpenToWorkBanner() {
	if (!resume.openToWork?.enabled) return null;

	const message = resume.openToWork.message;
	// Repeat the message so the marquee loops seamlessly.
	const items = Array.from({ length: 4 });

	return (
		<div className="relative z-50 overflow-hidden bg-emerald-600 text-white print:hidden">
			<div className="flex w-max animate-marquee items-center whitespace-nowrap py-1.5 text-xs font-medium tracking-wide">
				{items.map((_, i) => (
					<span key={i} className="flex items-center">
						<span className="mx-3 inline-block h-1.5 w-1.5 rounded-full bg-emerald-200" />
						{message}
					</span>
				))}
			</div>
		</div>
	);
}
