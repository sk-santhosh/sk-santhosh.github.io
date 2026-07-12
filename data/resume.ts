export const resume = {
	name: 'Santhosh Kumar J',
	title: 'Platform Engineer · Cloud Engineer · SRE',
	// Toggle the scrolling "open to work" banner above the nav bar.
	openToWork: {
		enabled: true,
		message:
			'Open to work — Platform Engineer, Cloud Engineer & SRE roles · full-time or consulting · open to relocation worldwide',
	},
	tagline:
		'Platform & Cloud Engineer and SRE with 14+ years building and operating cloud-native platforms on AWS, Azure, and GCP for systems serving 10M+ users.',
	summary:
		'14+ years designing, building and operating cloud-native platforms on AWS, Azure and GCP. Led engineering teams of 20+ and delivered 30+ cloud transformation projects — migrations, Kubernetes modernisation and reliability programmes — cutting infrastructure costs by up to 35% while sustaining 99.9% availability for systems serving 10M+ users.',
	location: 'Chennai, India',
	email: 'santhoshj.off@gmail.com',
	// Headline stats for the home page "By the numbers" grid.
	// All figures are real delivery metrics — keep in sync with the resume, never invent numbers.
	stats: [
		{value: '14+', label: 'Years of experience'},
		{value: '50+', label: 'Production Kubernetes clusters managed'},
		{value: '10M+', label: 'Users served by our platforms'},
		{value: '99.9%', label: 'Availability sustained'},
	],
	// Core competencies grouped by area — shown on the About page.
	competencies: [
		{category: 'Cloud Native', items: ['AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Helm']},
		{category: 'Infrastructure as Code', items: ['Terraform', 'Pulumi', 'CloudFormation', 'Kustomize', 'Ansible']},
		{category: 'CI/CD & GitOps', items: ['GitHub Actions', 'Argo CD', 'FluxCD', 'Jenkins', 'Azure DevOps']},
		{
			category: 'Observability',
			items: ['Prometheus', 'Grafana', 'Loki', 'Tempo', 'Mimir', 'OpenTelemetry', 'New Relic', 'Signoz'],
		},
		{
			category: 'Security & Zero Trust',
			items: ['Cloudflare Zero Trust', 'SOC2 Compliant', 'IAM', 'RBAC', 'CIS benchmarks', 'DevSecOps'],
		},
		{category: 'Development', items: ['Go', 'Python', 'TypeScript', 'Node.js', 'Shell scripting']},
	],
	// Impact highlight cards — a headline metric with the work behind it.
	highlights: [
		{
			metric: '35%',
			metricLabel: 'cloud costs cut',
			title: 'FinOps governance',
			description:
				'Rightsizing, autoscaling, Reserved Instance planning and Karpenter-based Spot optimisation across customer platforms.',
		},
		{
			metric: '80%',
			metricLabel: 'less deploy effort',
			title: 'GitOps delivery',
			description: 'GitOps-driven deployment pipelines built with Argo CD, GitHub Actions, Jenkins and Azure DevOps.',
		},
		{
			metric: '70%',
			metricLabel: 'less provisioning',
			title: 'Infrastructure as Code',
			description:
				'Terraform, Kustomize and CloudFormation standards rolled out within 2 months — eliminating configuration drift.',
		},
		{
			metric: '20+',
			metricLabel: 'dev environments',
			title: 'Self-service platform',
			description: 'Developer environments orchestrated in shared Kubernetes clusters with Argo CD and GitHub Actions.',
		},
		{
			metric: '15+',
			metricLabel: 'teams onboarded',
			title: 'Observability adoption',
			description:
				'Self-hosted LGTM stack ingesting 20 GB of logs a day and 10M metric series — at 50% lower cost than managed tooling.',
		},
		{
			metric: '50+',
			metricLabel: 'CVEs resolved',
			title: 'DevSecOps programmes',
			description: 'Vulnerability remediation and CIS-aligned security baselines across 10+ customer environments.',
		},
	],
	social: {
		github: 'https://github.com/sk-santhosh',
		linkedin: 'https://linkedin.com/in/sk-santhosh-j',
		twitter: 'https://twitter.com/its_sk__',
	},
	skills: [
		'Kubernetes',
		'Docker',
		'Helm',
		'Amazon Web Services (AWS)',
		'Google Cloud Platform (GCP)',
		'Microsoft Azure',
		'Cloudflare',
		'Terraform',
		'AWS CloudFormation',
		'GitOps',
		'Argo CD',
		'GitHub Actions',
		'Jenkins',
		'Azure DevOps',
		'Prometheus',
		'Grafana',
		'Loki',
		'Tempo',
		'OpenTelemetry',
		'SigNoz',
		'New Relic',
		'TypeScript',
		'Node.js',
		'React',
		'Next.js',
		'PostgreSQL',
		'MySQL',
		'MongoDB',
		'Redis',
		'Elasticsearch',
		'Neo4j',
		'Linux',
		'Shell Scripting',
		'Git',
	],
	experience: [
		{
			company: 'SentinelFox Pvt Ltd',
			role: 'Co-Founder & Platform Engineer',
			period: 'Jan 2022 – Present',
			description:
				'Co-founded a services company that helps SaaS businesses set up their cloud infrastructure and developer environments securely, delivering 30+ cloud projects and leading a team of 20+ engineers across Platform Engineering, SRE, Cloud Engineering and Software Development.',
		},
		{
			company: 'Nextwave Multimedia Pvt Ltd',
			role: 'Senior Software Engineer',
			period: 'Nov 2017 – Dec 2021',
			description:
				'Built and scaled backend systems and distributed platforms supporting 10M+ active users at 99.9% availability, including multiplayer gaming backends, tournament platforms, and a 200K-line legacy PHP migration to Laravel.',
		},
		{
			company: 'eBuilders',
			role: 'Full Stack Developer',
			period: 'Jan 2017 – Oct 2017',
			description:
				'Developed enterprise web applications and REST APIs using PHP, Node.js, JavaScript, and relational databases, and built IoT and automation solutions with Arduino and embedded hardware.',
		},
		{
			company: 'Simple Labs',
			role: 'Embedded Systems Engineer',
			period: 'Jun 2013 – Dec 2016',
			description:
				'Designed and developed embedded hardware and firmware for industrial and commercial applications across the full product lifecycle, building microcontroller-based systems and supporting production deployments.',
		},
	],
	education: [
		{
			institution: 'Nettur Technical Training Foundation',
			degree: 'Diploma in Mechatronics',
			period: '2010 – 2013',
		},
	],
	certifications: [
		{
			name: 'Professional Data Engineer',
			issuer: 'Google Cloud',
			date: '2024 - 2026',
			url: 'https://www.credly.com/badges/f543c8b8-a83d-480c-bf68-f617bdd02042/public_url',
		},
		{
			name: 'CKA: Certified Kubernetes Administrator',
			issuer: 'The Linux Foundation',
			date: '2022 - 2025',
			url: 'https://www.credly.com/badges/4faee6ea-d1b5-4560-a8c9-59ad9f2ae8d6/linked_in_profile',
		},
	],
};
