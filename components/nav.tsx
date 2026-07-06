'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

const links = [
	{title: 'Home', url: '/'},
	{title: 'Blogs', url: '/blogs'},
	{title: 'About', url: '/about'},
	{title: 'Contact', url: '/contact'},
];

export default function Nav() {
	const pathname = usePathname();

	return (
		<nav className="sticky top-0 z-50 flex items-center justify-center border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 nav-blur font-mono text-xs transition-colors print:hidden">
			<div className="flex items-center">
				{links.map(({title, url}) => {
					const active = url === '/' ? pathname === '/' : pathname.startsWith(url);
					return (
						<Link
							key={url}
							href={url}
							className={`flex items-center px-4 py-2 transition-colors outline-none focus:outline-none ${
								active
									? 'border-x border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
									: 'text-gray-600 dark:text-slate-400 border-x border-transparent hover:text-sky-600 dark:hover:text-sky-400'
							}`}
						>
							{title}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
