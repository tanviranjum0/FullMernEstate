import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const controlBase = [
  "w-full rounded-sm border border-sand-300 bg-paper text-[0.95rem] text-ink-900",
  "placeholder:text-stone-500 transition-[border-color,box-shadow] duration-200",
  "hover:border-stone-400 focus:border-ink-800 focus:outline-none focus:ring-2 focus:ring-harbour-200",
  "disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-stone-500",
  "aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus:ring-danger-50",
].join(" ");

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-12 px-4", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, "min-h-32 px-4 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(controlBase, "h-12 appearance-none pr-10 pl-4", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        strokeWidth={1.5}
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-stone-600"
      />
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-2 block text-[0.7rem] font-semibold tracking-[0.14em] text-stone-700 uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4.5 shrink-0 cursor-pointer appearance-none rounded-xs border border-stone-400 bg-paper",
        "grid place-content-center transition-colors checked:border-ink-900 checked:bg-ink-900",
        "before:size-2.5 before:scale-0 before:bg-ivory before:transition-transform before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)]",
        "checked:before:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-harbour-600",
        className,
      )}
      {...props}
    />
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/** Associates a label, hint and error message with a control for assistive technology. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal tracking-normal text-stone-500 normal-case">
            (optional)
          </span>
        ) : null}
      </Label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-stone-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function fieldA11y(id: string, error?: string, hint?: string) {
  const describedBy = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy || undefined,
  };
}
