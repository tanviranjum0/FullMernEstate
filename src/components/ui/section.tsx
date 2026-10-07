import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("eyebrow flex items-center gap-3 text-stone-600", className)}>
      <span aria-hidden className="h-px w-8 bg-current opacity-60" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  align = "left",
  as: Heading = "h2",
  className,
  tone = "dark",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <Eyebrow className={cn("mb-5", align === "center" && "justify-center", tone === "light" && "text-ivory/70")}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Heading
          className={cn(
            "font-display text-heading-1 font-normal tracking-[-0.01em]",
            tone === "dark" ? "text-ink-900" : "text-ivory",
          )}
        >
          {title}
        </Heading>
        {intro ? (
          <div className={cn("mt-5 text-lead", tone === "dark" ? "text-stone-600" : "text-ivory/75")}>{intro}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-sand-300 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-5 text-stone-500 [&_svg]:size-8">{icon}</div> : null}
      <h3 className="font-display text-heading-3 text-ink-900">{title}</h3>
      {description ? <div className="mt-3 max-w-md text-stone-600">{description}</div> : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-xs", className)} />;
}
