import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowUpRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowDown = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const Download = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
  </svg>
);

export const Mail = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 7 8.1 5.4a1.6 1.6 0 0 0 1.8 0L21 7" />
  </svg>
);

export const Github = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 19c-4 1.4-4-2.2-5.6-2.7M15 22v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 4.8-1.4 4.8-5.7a4.4 4.4 0 0 0-1.2-3 4.1 4.1 0 0 0-.1-3.1s-1.3-.4-4.3 1.6a10.4 10.4 0 0 0-5.4 0C4 4.1 2.7 4.5 2.7 4.5a4.1 4.1 0 0 0-.1 3.1 4.4 4.4 0 0 0-1.2 3c0 4.3 2.1 5.4 4.8 5.7a3 3 0 0 0-.8 2.3V22" />
  </svg>
);

export const Linkedin = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-13h4v1.8A6 6 0 0 1 16 8Z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export const XIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 3l7.3 9.4L4.4 21h2.3l5.6-6.9L17 21h3l-7.6-9.8L19.4 3h-2.3l-5.2 6.4L7 3H4Z" />
  </svg>
);

export const Menu = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Close = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Code = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9 17-5-5 5-5M15 7l5 5-5 5" />
  </svg>
);

export const Activity = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 12h3.5l2.5-7 4 14 2.5-7H21" />
  </svg>
);

export const Target = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const Zap = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
  </svg>
);

export const MapPin = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10.5" r="2.6" />
  </svg>
);

export const Clock = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m5 13 4.5 4.5L19 7" />
  </svg>
);

export const Spark = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

export const Cloud = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 10.3A3.9 3.9 0 0 0 7 18Z" />
  </svg>
);

export const Asterisk = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5v17M4.6 7.75l14.8 8.5M19.4 7.75l-14.8 8.5" />
  </svg>
);

export const Phone = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7.5 3.5h-3A1.5 1.5 0 0 0 3 5.2c.3 3.5 1.9 6.8 4.4 9.4 2.6 2.5 5.9 4.1 9.4 4.4a1.5 1.5 0 0 0 1.7-1.5v-3a1.5 1.5 0 0 0-1.3-1.5 10 10 0 0 1-2.2-.5 1.5 1.5 0 0 0-1.6.3l-1 1a14 14 0 0 1-5-5l1-1a1.5 1.5 0 0 0 .3-1.6 10 10 0 0 1-.5-2.2 1.5 1.5 0 0 0-1.7-1z" />
  </svg>
);

export const Award = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M8.2 13.4 7 22l5-2.4 5 2.4-1.2-8.6" />
  </svg>
);

export const iconMap = {
  github: Github,
  linkedin: Linkedin,
  x: XIcon,
  award: Award,
  mail: Mail,
  code: Code,
  activity: Activity,
  target: Target,
  zap: Zap,
} as const;

export type IconName = keyof typeof iconMap;
