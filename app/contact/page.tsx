import Link from 'next/link';
import {Mail, MapPin, Radio, Send} from 'lucide-react';
import {MdEmail} from 'react-icons/md';
import {FaGithub, FaLinkedin} from 'react-icons/fa';
import {FaXTwitter} from 'react-icons/fa6';
import {resume} from '@/data/resume';
import {siteUrl} from '@/lib/site';

const description = `Get in touch with ${resume.name} — ${resume.title}. Open to roles, consulting and interesting infrastructure problems.`;

export const metadata = {
	title: 'Contact',
	description,
	alternates: {canonical: '/contact'},
	openGraph: {
		title: 'Contact',
		description,
		url: `${siteUrl}/contact`,
		type: 'website',
	},
};

const contactPageJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'ContactPage',
	'@id': `${siteUrl}/contact#contactpage`,
	name: `Contact ${resume.name}`,
	description,
	url: `${siteUrl}/contact`,
	inLanguage: 'en',
	isPartOf: {'@id': `${siteUrl}/#website`},
	mainEntity: {'@id': `${siteUrl}/#person`},
};

export default function ContactPage() {
	return (
		<div className="space-y-10">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{__html: JSON.stringify(contactPageJsonLd)}}
			/>
			{/* Intro */}
			<section>
				<div className="flex items-center gap-2 mb-3">
					<Mail size={15} className="text-rose-400" />
					<h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Contact</h1>
				</div>
				<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
					I&apos;m always open to discussing platform engineering, cloud infrastructure and SRE work — whether
					that&apos;s a role, a consulting engagement or just an interesting problem.
				</p>
			</section>

			{/* Cards */}
			<section className="grid sm:grid-cols-2 gap-2.5">
				{/* Email */}
				<div className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2">
					<p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Email</p>
					<p className="text-sm text-slate-800 dark:text-slate-200 break-all">{resume.email}</p>
					<a
						href={`mailto:${resume.email}`}
						className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 transition-colors"
					>
						<Send size={13} /> Send an email
					</a>
				</div>

				{/* Availability */}
				<div className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2">
					<p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
						Availability
					</p>
					{resume.openToWork.enabled ? (
						<>
							<p className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
								</span>
								Open to opportunities — worldwide 🌍
							</p>
							<p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
								Platform Engineer, Cloud Engineer and SRE roles — full-time or consulting.
							</p>
						</>
					) : (
						<p className="text-sm text-slate-800 dark:text-slate-200">Not actively looking right now.</p>
					)}
				</div>

				{/* Location */}
				<div className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2">
					<p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-widest">Location</p>
					<p className="flex items-center gap-1.5 text-sm text-slate-800 dark:text-slate-200">
						<MapPin size={13} className="text-rose-400" /> {resume.location}
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
						Open to relocation and international opportunities.
					</p>
				</div>

				{/* Response */}
				<div className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2">
					<p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
						Elsewhere
					</p>
					<p className="flex items-center gap-1.5 text-sm text-slate-800 dark:text-slate-200">
						<Radio size={13} className="text-slate-400" /> Fastest on email and LinkedIn
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
						I write about platform engineering at{' '}
						<Link href="/blogs" className="text-sky-600 dark:text-sky-400 hover:underline">
							sk-santhosh.info/blogs
						</Link>
						.
					</p>
				</div>
			</section>

			{/* Social links */}
			<section>
				<h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
					Social
				</h2>
				<div className="flex flex-wrap gap-2">
					{[
						{
							href: `mailto:${resume.email}`,
							icon: MdEmail,
							label: 'Email',
							external: false,
							color:
								'hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:border-rose-800 dark:hover:text-rose-400 dark:hover:bg-rose-950',
						},
						{
							href: resume.social.github,
							icon: FaGithub,
							label: 'GitHub',
							external: true,
							color:
								'hover:border-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:border-slate-500 dark:hover:text-white dark:hover:bg-slate-800',
						},
						{
							href: resume.social.linkedin,
							icon: FaLinkedin,
							label: 'LinkedIn',
							external: true,
							color:
								'hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:text-blue-400 dark:hover:bg-blue-950',
						},
						{
							href: resume.social.twitter,
							icon: FaXTwitter,
							label: 'Twitter / X',
							external: true,
							color:
								'hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:border-sky-700 dark:hover:text-sky-400 dark:hover:bg-sky-950',
						},
					].map(({href, icon: Icon, label, external, color}) => (
						<a
							key={label}
							href={href}
							target={external ? '_blank' : undefined}
							rel={external ? 'noopener noreferrer' : undefined}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 active:opacity-80 transition-colors min-h-[32px] ${color}`}
						>
							<Icon size={14} /> {label}
						</a>
					))}
				</div>
			</section>
		</div>
	);
}
