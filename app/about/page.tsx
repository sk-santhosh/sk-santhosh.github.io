import {Briefcase, GraduationCap, User, BadgeCheck} from 'lucide-react';
import {MdEmail} from 'react-icons/md';
import {FaGithub, FaLinkedin} from 'react-icons/fa';
import {FaXTwitter} from 'react-icons/fa6';
import {resume} from '@/data/resume';

export const metadata = {
	title: 'About — Santhosh Kumar J',
};

export default function AboutPage() {
	return (
		<div className="space-y-10">
			{/* Bio */}
			<section>
				<div className="flex items-center gap-2 mb-3">
					<User size={15} className="text-blue-400" />
					<h1 className="text-base font-bold text-slate-900 dark:text-slate-100">About</h1>
				</div>
				<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
					I&apos;m {resume.name}, a {resume.title} based in {resume.location}. {resume.tagline}
				</p>
				<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
					Founder of SentinelFox, building security-focused developer tools. I run a homelab, contribute to open source,
					and write about things I&apos;m learning.
				</p>
			</section>

			{/* Experience */}
			<section>
				<div className="flex items-center gap-2 mb-4">
					<Briefcase size={15} className="text-emerald-500" />
					<h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Experience</h2>
				</div>
				<div className="space-y-5">
					{resume.experience.map((exp, i) => (
						<div key={exp.company} className="flex gap-3">
							<div
								className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${['bg-emerald-400', 'bg-blue-400', 'bg-violet-400'][i % 3]}`}
							/>
							<div className="space-y-1 min-w-0">
								<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
									<span className="text-sm font-medium text-slate-800 dark:text-slate-200">{exp.role}</span>
									<span className="text-xs text-slate-400 dark:text-slate-500">@ {exp.company}</span>
								</div>
								<p className="text-xs text-slate-400 dark:text-slate-500">{exp.period}</p>
								<p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{exp.description}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Certifications */}
			<section>
				<div className="flex items-center gap-2 mb-4">
					<BadgeCheck size={15} className="text-blue-500" />
					<h2 className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Certifications</h2>
				</div>
				<div className="space-y-3">
					{resume.certifications.map((cert) => (
						<div key={cert.name} className="flex gap-3">
							<div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
							<div className="min-w-0">
								{cert.url ? (
									<a
										href={cert.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
									>
										{cert.name}
									</a>
								) : (
									<p className="text-sm font-medium text-slate-800 dark:text-slate-200">{cert.name}</p>
								)}
								<p className="text-xs text-slate-400 dark:text-slate-500">
									{cert.issuer} · {cert.date}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Education */}
			<section>
				<div className="flex items-center gap-2 mb-4">
					<GraduationCap size={15} className="text-amber-500" />
					<h2 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Education</h2>
				</div>
				<div className="space-y-4">
					{resume.education.map((edu) => (
						<div key={edu.institution} className="flex gap-3">
							<div className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
							<div className="min-w-0">
								<p className="text-sm font-medium text-slate-800 dark:text-slate-200">{edu.degree}</p>
								<p className="text-xs text-slate-400 dark:text-slate-500">
									{edu.institution} · {edu.period}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Contact */}
			<section>
				<h2 className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">Contact</h2>
				<div className="flex flex-wrap gap-2">
					{[
						{
							href: `mailto:${resume.email}`,
							icon: MdEmail,
							label: 'Email',
							external: false,
							color: 'hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:border-rose-800 dark:hover:text-rose-400 dark:hover:bg-rose-950',
						},
						{
							href: resume.social.github,
							icon: FaGithub,
							label: 'GitHub',
							external: true,
							color: 'hover:border-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:border-slate-500 dark:hover:text-white dark:hover:bg-slate-800',
						},
						{
							href: resume.social.linkedin,
							icon: FaLinkedin,
							label: 'LinkedIn',
							external: true,
							color: 'hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:text-blue-400 dark:hover:bg-blue-950',
						},
						{
							href: resume.social.twitter,
							icon: FaXTwitter,
							label: 'Twitter / X',
							external: true,
							color: 'hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:border-sky-700 dark:hover:text-sky-400 dark:hover:bg-sky-950',
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
