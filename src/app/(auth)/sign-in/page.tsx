import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/forms/auth-forms";
import { Skeleton } from "@/components/ui/section";
import { isEmailConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function SignInPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <SignInForm canResetPassword={isEmailConfigured()} />
    </Suspense>
  );
}
