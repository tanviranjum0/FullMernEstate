import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = {
  title: { default: "Your account", template: "%s | Your account" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-page pt-10 pb-[var(--section-y)] sm:pt-14">
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
