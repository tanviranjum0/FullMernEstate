import Image from "next/image";
import { Wordmark } from "@/components/layout/wordmark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <Image
          src="/images/residences/garden-villa/w1920.webp"
          alt=""
          fill
          sizes="55vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover opacity-80"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-ink-950/30"
        />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ivory">
          <p className="max-w-md font-display text-[2.4rem] leading-tight">
            Save the homes you love, follow your enquiries, and return to your searches.
          </p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Wordmark />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
