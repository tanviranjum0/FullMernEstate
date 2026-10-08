"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/config/domain";
import { updateUserAction } from "@/server/actions/admin";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { adminButton, adminInput } from "./form-kit";

/** Role selector and enable/disable control for one row of the users table. */
export function UserControls({ id, email, role, disabled, isSelf }: { id: string; email: string; role: UserRole; disabled: boolean; isSelf: boolean }) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [nextRole, setNextRole] = useState(role);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const submit = (patch: { role?: UserRole; disabled?: boolean }, success: string) =>
    startTransition(async () => {
      const result = await updateUserAction(id, patch);
      if (!result.ok) {
        setNextRole(role);
        notify("Could not update the user", { description: result.error, tone: "error" });
        return;
      }
      notify(success, { tone: "success" });
      router.refresh();
    });

  if (isSelf) return <span className="text-xs text-stone-500">Your account</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label className="sr-only" htmlFor={`role-${id}`}>
        Role for {email}
      </label>
      <select
        id={`role-${id}`}
        value={nextRole}
        disabled={pending}
        onChange={(event) => setNextRole(event.target.value as UserRole)}
        className={`${adminInput} h-8 w-32 text-xs`}
      >
        {USER_ROLES.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </select>
      {nextRole !== role ? (
        <button type="button" disabled={pending} onClick={() => submit({ role: nextRole }, `Role changed to ${ROLE_LABELS[nextRole]}`)} className={`${adminButton.primary} h-8 px-3 text-xs`}>
          Save role
        </button>
      ) : null}
      {disabled ? (
        <button type="button" disabled={pending} onClick={() => submit({ disabled: false }, "Account re-enabled")} className={`${adminButton.secondary} h-8 px-3 text-xs`}>
          Re-enable
        </button>
      ) : (
        <DialogRoot open={confirmDisable} onOpenChange={setConfirmDisable}>
          <button type="button" disabled={pending} onClick={() => setConfirmDisable(true)} className={`${adminButton.danger} h-8 px-3 text-xs`}>
            Disable
          </button>
          <DialogContent title="Disable this account?" description={`${email} will be signed out everywhere and cannot sign in until re-enabled.`} className="w-[min(100vw-2rem,28rem)]">
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDisable(false)} className={adminButton.secondary}>
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirmDisable(false);
                  submit({ disabled: true }, "Account disabled");
                }}
                className={`${adminButton.primary} bg-danger-600 hover:bg-danger-600/90`}
              >
                Disable account
              </button>
            </div>
          </DialogContent>
        </DialogRoot>
      )}
    </div>
  );
}
