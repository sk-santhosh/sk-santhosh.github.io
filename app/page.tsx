import Link from 'next/link';
import Image from 'next/image';
import {MapPin, ArrowRight} from 'lucide-react';
import {MdEmail} from 'react-icons/md';
import {FaGithub, FaLinkedin} from 'react-icons/fa';
import {FaXTwitter} from 'react-icons/fa6';
import {getAllBlogs} from '@/lib/blogs';
import {resume} from '@/data/resume';
import {tagColor} from '@/lib/tag-colors';
import GitHubContributions from '@/components/github-contributions';
import BlogCard from '@/components/blog-card';

const socialLinks = [
	{
		href: (r: typeof resume) => `mailto:${r.email}`,
		icon: MdEmail,
		label: 'Email',
		color: 'hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 dark:hover:text-rose-400',
	},
	{
		href: (r: typeof resume) => r.social.github,
		icon: FaGithub,
		label: 'GitHub',
		color: 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
	},
	{
		href: (r: typeof resume) => r.social.linkedin,
		icon: FaLinkedin,
		label: 'LinkedIn',
		color: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950',
	},
	{
		href: (r: typeof resume) => r.social.twitter,
		icon: FaXTwitter,
		label: 'Twitter / X',
		color: 'hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950',
	},
];

export default function HomePage() {
	const latestPosts = getAllBlogs().slice(0, 3);

	return (
		<div className="space-y-10">
			{/* Hero */}
			<section className="flex items-start justify-between gap-6">
				<div className="space-y-2 min-w-0">
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{resume.name}</h1>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
						<span>{resume.title}</span>
						<span className="flex items-center gap-1">
							<MapPin size={12} className="text-rose-400" />
							{resume.location}
						</span>
					</div>
					<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-0.5">{resume.tagline}</p>
					<div className="flex items-center gap-2 pt-1">
						{socialLinks.map(({href, icon: Icon, label, color}) => (
							<a
								key={label}
								href={href(resume)}
								target="_blank"
								rel="noopener noreferrer"
								title={label}
								className={`p-2 rounded-md text-slate-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center border border-slate-200 dark:border-slate-700 ${color}`}
							>
								<Icon size={16} />
							</a>
						))}
					</div>
				</div>
				<Image
					src="/santhosh.jpg"
					alt={resume.name}
					width={96}
					height={96}
					className="rounded-md object-contain w-24 h-24 shrink-0 ring-2 ring-slate-100 dark:ring-slate-800"
					priority
				/>
			</section>

			{/* Latest Writings */}
			<section>
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Blogs</h2>
					<Link
						href="/blogs"
						className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
					>
						View all <ArrowRight size={11} />
					</Link>
				</div>
				<div>
					{latestPosts.map((post) => (
						<BlogCard key={post.slug} post={post} />
					))}
				</div>
			</section>

			{/* GitHub Contributions */}
			<GitHubContributions />

			{/* Skills */}
			<section>
				<h2 className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">Skills &amp; Tools</h2>
				<div className="flex flex-wrap gap-1.5">
					{resume.skills.map((skill) => (
						<span key={skill} className={`text-xs px-2.5 py-1 rounded border transition-colors ${tagColor(skill)}`}>
							{skill}
						</span>
					))}
				</div>
			</section>
		</div>
	);
}
