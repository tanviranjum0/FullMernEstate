"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, fieldA11y } from "@/components/ui/form-controls";
import { authClient } from "@/lib/auth/client";
import { safeRedirectPath } from "@/lib/auth/redirect";

const REASONS: Record<string, string> = {
  save: "Sign in to save homes to your shortlist.",
  "save-search": "Sign in to save this search.",
};

function PasswordInput({
  id,
  name,
  autoComplete,
  error,
  minLength,
}: {
  id: string;
  name: string;
  autoComplete: string;
  error?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...fieldA11y(id, error)}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={128}
        required
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-stone-600 hover:bg-sand-100 hover:text-ink-900"
      >
        {visible ? (
          <EyeOff strokeWidth={1.5} className="size-4" />
        ) : (
          <Eye strokeWidth={1.5} className="size-4" />
        )}
      </button>
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-sm bg-danger-50 px-4 py-3 text-sm text-danger-600">
      {message}
    </p>
  );
}

export function SignInForm({ canResetPassword }: { canResetPassword: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeRedirectPath(params.get("next"));
  const reason = REASONS[params.get("reason") ?? ""];
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email address and password.");
      return;
    }
    startTransition(async () => {
      const { error: signInError } = await authClient.signIn.email({ email, password });
      if (signInError) {
        setError(
          signInError.status === 429
            ? "Too many attempts. Please wait a minute and try again."
            : signInError.status === 403
              ? (signInError.message ?? "This account is not available.")
              : "The email or password is not correct.",
        );
        return;
      }
      router.replace(next);
      router.refresh();
    });
  };

  return (
    <div>
      <h1 className="font-display text-heading-1 text-ink-900">Sign in</h1>
      <p className="mt-3 text-stone-600">{reason ?? "Welcome back."}</p>
      <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
        <Field id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </Field>
        <Field id="password" label="Password">
          <PasswordInput id="password" name="password" autoComplete="current-password" />
        </Field>
        {canResetPassword ? (
          <p className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="text-stone-600 underline underline-offset-4 hover:text-ink-900"
            >
              Forgotten your password?
            </Link>
          </p>
        ) : null}
        <FormError message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-8 text-sm text-stone-600">
        New here?{" "}
        <Link
          href={`/sign-up${params.toString() ? `?${params.toString()}` : ""}`}
          className="font-semibold text-ink-900 underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeRedirectPath(params.get("next"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const nextErrors: Record<string, string> = {};
    if (name.length < 2) nextErrors.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Please enter a valid email address.";
    if (password.length < 10) nextErrors.password = "Use at least 10 characters.";
    if (!data.get("terms")) nextErrors.terms = "Please accept the terms to continue.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    startTransition(async () => {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) {
        setErrors({
          form:
            error.status === 429
              ? "Too many sign-up attempts. Please try again later."
              : error.code === "USER_ALREADY_EXISTS" ||
                  error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
                ? "An account with this email already exists. Try signing in instead."
                : error.code === "PASSWORD_TOO_SHORT"
                  ? "Use at least 10 characters."
                  : "We could not create your account. Please check your details and try again.",
        });
        return;
      }
      router.replace(next);
      router.refresh();
    });
  };

  return (
    <div>
      <h1 className="font-display text-heading-1 text-ink-900">Create an account</h1>
      <p className="mt-3 text-stone-600">
        Save homes and searches, and follow your enquiries in one place.
      </p>
      <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
        <Field id="name" label="Full name" error={errors.name}>
          <Input
            {...fieldA11y("name", errors.name)}
            name="name"
            autoComplete="name"
            required
            maxLength={120}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <Input
            {...fieldA11y("email", errors.email)}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          error={errors.password}
          hint="At least 10 characters. A passphrase works well."
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={10}
            error={errors.password}
          />
        </Field>
        <div>
          <label className="flex items-start gap-3 text-sm text-stone-700">
            <Checkbox name="terms" className="mt-0.5" {...fieldA11y("terms", errors.terms)} />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="underline underline-offset-4">
                terms of use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                privacy notice
              </Link>
              .
            </span>
          </label>
          {errors.terms ? (
            <p id="terms-error" role="alert" className="mt-1.5 text-sm text-danger-600">
              {errors.terms}
            </p>
          ) : null}
        </div>
        <FormError message={errors.form} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-8 text-sm text-stone-600">
        Already registered?{" "}
        <Link
          href={`/sign-in${params.toString() ? `?${params.toString()}` : ""}`}
          className="font-semibold text-ink-900 underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  if (sent) {
    return (
      <div role="status">
        <h1 className="font-display text-heading-1 text-ink-900">Check your inbox</h1>
        <p className="mt-4 text-stone-600">
          If an account exists for that address, we have sent a link to choose a new password. The
          link expires in one hour.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="font-display text-heading-1 text-ink-900">Reset your password</h1>
      <p className="mt-3 text-stone-600">
        Enter your email and we will send you a link to choose a new password.
      </p>
      <form
        className="mt-10 space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
          if (!email) {
            setError("Please enter your email address.");
            return;
          }
          startTransition(async () => {
            const { error: requestError } = await authClient.requestPasswordReset({
              email,
              redirectTo: "/reset-password",
            });
            if (requestError?.status === 429) {
              setError("Too many requests. Please try again later.");
              return;
            }
            setSent(true);
          });
        }}
      >
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <FormError message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-heading-1 text-ink-900">Link not valid</h1>
        <p className="mt-4 text-stone-600">
          This reset link is missing or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }
  return (
    <div>
      <h1 className="font-display text-heading-1 text-ink-900">Choose a new password</h1>
      <form
        className="mt-10 space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const newPassword = String(new FormData(event.currentTarget).get("password") ?? "");
          if (newPassword.length < 10) {
            setError("Use at least 10 characters.");
            return;
          }
          startTransition(async () => {
            const { error: resetError } = await authClient.resetPassword({ newPassword, token });
            if (resetError) {
              setError("This link has expired or was already used. Please request a new one.");
              return;
            }
            router.replace("/sign-in");
          });
        }}
      >
        <Field id="password" label="New password" hint="At least 10 characters." error={error}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={10}
            error={error}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
