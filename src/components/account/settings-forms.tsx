"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldA11y } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { updateProfileAction, type ProfileActionState } from "@/server/actions/account";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(updateProfileAction, null);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field id="profile-name" label="Full name" error={errors.name}>
        <Input {...fieldA11y("profile-name", errors.name)} name="name" defaultValue={name} autoComplete="name" required maxLength={120} />
      </Field>
      <Field id="profile-email" label="Email" hint="Contact us if you need to change the email address on your account.">
        <Input id="profile-email" value={email} readOnly disabled aria-describedby="profile-email-hint" />
      </Field>
      <Field id="profile-phone" label="Phone" optional error={errors.phone}>
        <Input {...fieldA11y("profile-phone", errors.phone)} name="phone" type="tel" defaultValue={phone} autoComplete="tel" maxLength={40} />
      </Field>
      {state ? (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success-600" : "text-sm text-danger-600"}>
          {state.ok ? state.message : state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const { notify } = useToast();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const currentPassword = String(data.get("currentPassword") ?? "");
        const newPassword = String(data.get("newPassword") ?? "");
        if (newPassword.length < 10) {
          setError("Your new password must be at least 10 characters.");
          return;
        }
        startTransition(async () => {
          const { error: changeError } = await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
          });
          if (changeError) {
            setError(
              changeError.status === 429 ? "Too many attempts. Please try again later." : "Your current password is not correct.",
            );
            return;
          }
          setError(undefined);
          form.reset();
          notify("Password updated", { description: "Other devices have been signed out.", tone: "success" });
        });
      }}
    >
      <Field id="current-password" label="Current password">
        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field id="new-password" label="New password" hint="At least 10 characters." error={error}>
        <Input {...fieldA11y("new-password", error, "At least 10 characters.")} name="newPassword" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

export function SessionControls() {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const { error } = await authClient.revokeOtherSessions();
            notify(error ? "Could not sign out other devices" : "Signed out of other devices", {
              tone: error ? "error" : "success",
            });
          })
        }
      >
        Sign out other devices
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await authClient.signOut();
            router.push("/");
            router.refresh();
          })
        }
      >
        Sign out
      </Button>
    </div>
  );
}
