import Link from "next/link";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap select-none",
    "rounded-sm font-sans font-semibold tracking-[0.08em] uppercase",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-luxe",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-harbour-600",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-ink-900 text-ivory hover:bg-harbour-800",
        accent: "bg-harbour-700 text-ivory hover:bg-harbour-800",
        outline:
          "border border-ink-900/25 bg-transparent text-ink-900 hover:border-ink-900 hover:bg-ink-900 hover:text-ivory",
        ghost: "bg-transparent text-ink-900 hover:bg-sand-100",
        light: "bg-ivory text-ink-900 hover:bg-white",
        "outline-light":
          "border border-ivory/40 bg-transparent text-ivory hover:border-ivory hover:bg-ivory hover:text-ink-900",
        danger: "bg-danger-600 text-white hover:bg-danger-600/90",
        link: "h-auto px-0 tracking-[0.12em] text-ink-900 underline decoration-ink-900/25 underline-offset-[6px] hover:decoration-ink-900",
      },
      size: {
        sm: "h-9 px-4 text-[0.68rem]",
        md: "h-11 px-6 text-[0.72rem]",
        lg: "h-13 px-8 text-[0.74rem]",
        icon: "size-10 tracking-normal",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonVariantProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & ButtonVariantProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
