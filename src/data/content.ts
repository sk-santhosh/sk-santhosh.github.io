/**
 * Site copy. Projects and posts live as markdown under /content —
 * everything else is here.
 *
 * Biography, experience, skills and certifications are taken from
 * Santhoshkumar J's CV (Kubernetes & SRE Engineer, Oct 2026).
 */

export const site = {
  name: "SANTHOSH",
  fullName: "Santhosh",
  legalName: "Santhoshkumar J",
  /** Shown as the header wordmark, as in the reference design */
  wordmark: "Portfolio",
  role: "Cloud Native & SRE Engineer",
  shortRole: "Cloud Native / SRE",
  domain: "sk-santhosh.info",
  url: "https://sk-santhosh.info",
  email: "santhoshj.off@gmail.com",
  phone: "+91 9865295334",
  location: "Chennai, India",
  /* Used for the twitter: card attribution and schema.org sameAs. Not in
     `socials`, which is the visible list. */
  x: "https://x.com/its_sk__",
  /* Background-removed cut-out used on the home screen */
  photo: "/santhosh-cutout.webp",
  /* Original framed photo, used where a rectangular crop is wanted */
  photoFramed: "/santhosh.jpg",
  /* Set on the home screen in the design's uppercase slab */
  statement: [
    "I keep production Kubernetes honest —",
    "the SLOs that set the bar, the incidents that test it,",
    "the upgrades nobody notices",
  ],
  tagline:
    "Production Kubernetes is home, and site reliability is the craft that keeps teaching something new — clusters, incident response, and the SLOs that keep a platform honest.",
  availability: "Open to new opportunities",
  /* Static so the build stays fully prerenderable */
  year: 2026,
} as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * Per-route copy. The masthead index/title/lede on each inner page and
 * that page's Open Graph card both read from here, so the share image
 * always says what the page says.
 */
export const pages = {
  "/": {
    index: "00",
    title: site.name,
    lede: site.statement.join(" "),
    description: `${site.fullName} — ${site.role}. ${site.tagline}`,
  },
  "/about": {
    index: "01",
    title: "About",
    lede: "Where platform engineering meets operations — and why I'd rather fix reliability in the code path than paper over it with another alert.",
    description:
      "Cloud Native & SRE engineer — platform engineering, Kubernetes, SLOs, and the principles behind the work.",
  },
  "/projects": {
    index: "02",
    title: "Projects",
    lede: "Platform and reliability work, described by what it changed rather than what it used.",
    description:
      "Platform and reliability engineering work — Kubernetes delivery platforms, observability pipelines, chaos testing and Terraform landing zones.",
  },
  "/blogs": {
    index: "03",
    title: "Blogs",
    lede: "Notes from production: what broke, what I changed, and what I'd do differently.",
    description:
      "Postmortem-shaped writing on SRE, Kubernetes, observability and infrastructure at scale.",
  },
  "/contact": {
    index: "04",
    title: "Contact",
    lede: "Hiring, migrating, or firefighting — tell me what you're building and what's hurting.",
    description:
      "Get in touch about SRE roles, Kubernetes migrations or a second opinion on your reliability roadmap.",
  },
} as const;

export const socials = [
  { label: "GitHub", href: "https://github.com/sk-santhosh", icon: "github" },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/sk-santhosh-j",
    icon: "linkedin",
  },
  { label: "Credly", href: "https://credly.com/users/sk_santhosh", icon: "award" },
  { label: "Email", href: `mailto:${site.email}`, icon: "mail" },
] as const;

export const stats = [
  { value: "13 yrs", label: "In the industry" },
  { value: "99.9%", label: "Availability sustained" },
  { value: "10M+", label: "Users served" },
  { value: "10+", label: "Production clusters" },
] as const;

export const about = {
  heading: "Production Kubernetes is home.",
  paragraphs: [
    "I'm a Kubernetes and SRE engineer in Chennai with thirteen years in the industry — the last four of them co-founding SentinelFox, where I owned multi-zone clusters on EKS, AKS and GKE serving more than ten million users.",
    "Site reliability is the part of the craft that keeps teaching me something new. I've set up SLOs, error budgets and blameless postmortems across fifteen teams, carried the pager, and cut incident triage from about fifteen minutes to under one by putting an AI SRE bot over Prometheus.",
    "Before SRE I spent years as a software engineer — Laravel migrations, MySQL tuning, Jenkins pipelines, and before that firmware for industrial equipment. That history is why I'd rather fix reliability in the code path than paper over it with another alert.",
    "I'm looking for a Kubernetes and SRE role with real production ownership: the clusters, the incident response, and the SLOs.",
  ],
  principles: [
    {
      title: "Everything as Code",
      body: "Infra, policy, dashboards and alerts live in Git, delivered by Argo CD and FluxCD. If it was clicked in a console, it does not exist.",
      icon: "code",
    },
    {
      title: "Observability First",
      body: "LGTM and OpenTelemetry across 20+ microservices — 20 GB of logs a day and 10M active series, correlated before launch rather than after the outage.",
      icon: "activity",
    },
    {
      title: "SLOs over Uptime",
      body: "Error budgets and blameless postmortems across 15+ teams turn reliability into a measurable engineering conversation.",
      icon: "target",
    },
    {
      title: "Automate the Toil",
      body: "GitOps delivery cut manual deployment effort by 80%; Karpenter and Helm carried 10+ clusters through zero-downtime upgrades.",
      icon: "zap",
    },
  ],
} as const;

export const skillGroups = [
  {
    title: "Containers & Orchestration",
    items: ["Kubernetes", "EKS", "AKS", "GKE", "Karpenter", "Docker"],
  },
  {
    title: "Reliability & Observability",
    items: [
      "SLOs",
      "Error budgets",
      "Grafana",
      "NewRelic",
      "OpenTelemetry",
      "Prometheus",
    ],
  },
  {
    title: "Infrastructure & Delivery",
    items: ["Terraform", "Helm", "Argo CD", "FluxCD", "Jenkins", "GitHub Actions"],
  },
  {
    title: "Cloud & Security",
    items: ["AWS", "Azure", "GCP", "RBAC", "CIS hardening"],
  },
  {
    title: "Languages & Data",
    items: ["Node.js", "Bash", "Go", "Redis", "MySQL", "MongoDB"],
  },
] as const;

export const experience = [
  {
    role: "Co-Founder & Staff Kubernetes Engineer",
    org: "SentinelFox Private Limited",
    period: "Jan 2022 — Aug 2026",
    location: "Chennai, India",
    points: [
      "Sustained 99.9% availability for 10M+ users on multi-zone Kubernetes across EKS, AKS and GKE.",
      "Established SLOs, error budgets and blameless postmortems across 15+ teams with PagerDuty on-call.",
      "Led incident response and cut triage from ~15 min to <1 min with a LangGraph/MCP AI SRE bot over Prometheus.",
      "Ran 10+ production clusters and 50+ microservices through 10+ zero-downtime upgrades with Karpenter autoscaling and Helm.",
      "Built LGTM observability for 20+ microservices at 20 GB/day of logs and 10M active series using OpenTelemetry.",
      "Cut manual deployment effort by 80% by building GitOps delivery with Argo CD, FluxCD and GitHub Actions.",
      "Achieved ~10-minute region-to-region database failover across AWS, Azure and GCP via Terraform-managed DR.",
    ],
  },
  {
    role: "Senior Software Engineer",
    org: "Nextwave Multimedia Private Limited",
    period: "Nov 2017 — Dec 2021",
    location: "Chennai, India",
    points: [
      "Built CI/CD pipelines with Jenkins, cutting build and release time from 1 hour to 5 minutes.",
      "Scaled EC2 application servers with AWS Auto Scaling groups for a 60% availability and responsiveness gain.",
      "Cut average MySQL query time by 90% through query optimisation and database architecture changes.",
      "Compressed S3 data to 80% of its original size for a 90% storage cost reduction, with KMS encryption.",
      "Led migration of 200K+ lines of legacy PHP to Laravel, cutting API response time from ~800ms to ~320ms.",
    ],
  },
  {
    role: "Full Stack Developer",
    org: "eBuilders Solutions",
    period: "Jan 2017 — Oct 2017",
    location: "Chennai, India",
    points: [
      "Designed REST APIs and backend services, including card payment processing for a live e-commerce site.",
      "Developed enterprise web applications with PHP, Node.js, JavaScript and relational databases.",
    ],
  },
  {
    role: "Embedded Systems Engineer",
    org: "Simple Labs",
    period: "Jun 2013 — Dec 2016",
    location: "Chennai, India",
    points: [
      "Ran production and QA testing of embedded systems and firmware for InduinoX, an Arduino Uno R3 replica.",
      "Developed firmware to control and monitor industrial equipment, improving manufacturing productivity.",
    ],
  },
] as const;

export const certifications = [
  { name: "Certified Kubernetes Administrator (CKA)", issuer: "The Linux Foundation", year: "2022" },
  { name: "Professional Data Engineer", issuer: "Google Cloud", year: "2024" },
] as const;

export const languages = [
  { name: "English", level: "Professional" },
  { name: "Tamil", level: "Native" },
] as const;

export const services = [
  {
    title: "Kubernetes in Production",
    body: "Multi-zone clusters on EKS, AKS and GKE — autoscaling with Karpenter, Helm-packaged workloads, and upgrades that do not need a maintenance window.",
  },
  {
    title: "Reliability & Incident Response",
    body: "SLOs, error budgets, on-call rotations and blameless postmortems that produce change instead of documents.",
  },
  {
    title: "GitOps & Delivery",
    body: "Argo CD and FluxCD pipelines off GitHub Actions, with Terraform-managed infrastructure and disaster recovery across clouds.",
  },
  {
    title: "Observability",
    body: "LGTM stacks and OpenTelemetry pipelines with traces, metrics and logs correlated — so triage starts with context, not archaeology.",
  },
] as const;
