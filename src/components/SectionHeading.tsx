import type { ReactNode } from "react";
import Reveal from "./Reveal";

type Props = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
};

export default function SectionHeading({ eyebrow, title, description }: Props) {
  return (
    <Reveal className="flex flex-col gap-4">
      <span className="label flex items-center gap-3 text-flame-600">
        <span className="h-px w-8 bg-flame-500" />
        {eyebrow}
      </span>

      <h2 className="max-w-3xl font-display text-3xl leading-[1.05] font-bold tracking-[-0.02em] text-balance text-ink sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>

      {description ? (
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-mute sm:text-base">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
