import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/components/forms/auth-forms";
import { Skeleton } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <SignUpForm />
    </Suspense>
  );
}
