import Image from "next/image";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { AgentCard } from "@/server/dto";

export function AgentAvatar({
  agent,
  size = "md",
  className,
}: {
  agent: Pick<AgentCard, "name" | "photo">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = { sm: "size-12 text-base", md: "size-16 text-lg", lg: "size-24 text-2xl", xl: "size-40 text-4xl" };
  const pixels = { sm: 48, md: 64, lg: 96, xl: 160 };
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-harbour-800 font-display text-ivory",
        sizes[size],
        className,
      )}
    >
      {agent.photo ? (
        <Image
          src={agent.photo.src}
          alt={agent.photo.alt || agent.name}
          fill
          sizes={`${pixels[size] * 2}px`}
          className="object-cover"
        />
      ) : (
        <span aria-hidden>{initials(agent.name)}</span>
      )}
    </span>
  );
}
