import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { Eyebrow } from "@/components/ui/section";

/** Standard inner-page header: breadcrumbs, eyebrow, display title and an optional lead. */
export function PageIntro({
  crumbs,
  eyebrow,
  title,
  lead,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="container-page pt-10 pb-14 sm:pt-14 sm:pb-20">
      <Breadcrumbs items={crumbs} />
      <div className="mt-10 max-w-4xl">
        {eyebrow ? <Eyebrow className="mb-5">{eyebrow}</Eyebrow> : null}
        <h1 className="font-display text-display-2 text-ink-900">{title}</h1>
        {lead ? <div className="mt-6 max-w-2xl text-lead text-stone-600">{lead}</div> : null}
        {children}
      </div>
    </header>
  );
}
