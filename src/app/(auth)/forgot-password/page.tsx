import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";
import { isEmailConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  if (!isEmailConfigured()) {
    return (
      <div>
        <h1 className="font-display text-heading-1 text-ink-900">Reset your password</h1>
        <p className="mt-4 text-stone-600">
          Password reset by email is not available at the moment. Please{" "}
          <Link href="/contact" className="underline underline-offset-4">
            contact us
          </Link>{" "}
          and we will help you regain access to your account.
        </p>
      </div>
    );
  }
  return <ForgotPasswordForm />;
}
