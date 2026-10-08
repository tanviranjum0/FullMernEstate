import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-[0.62rem] leading-none font-semibold tracking-[0.16em] whitespace-nowrap uppercase",
  {
    variants: {
      tone: {
        light: "bg-ivory/95 text-ink-900 backdrop-blur-sm",
        dark: "bg-ink-900/85 text-ivory backdrop-blur-sm",
        bronze: "bg-bronze-600 text-white",
        harbour: "bg-harbour-700 text-ivory",
        neutral: "bg-sand-100 text-stone-700",
        outline: "border border-sand-300 text-stone-700",
        success: "bg-success-50 text-success-600",
        warning: "bg-warning-50 text-warning-600",
        danger: "bg-danger-50 text-danger-600",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
