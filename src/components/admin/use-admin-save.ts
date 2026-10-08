"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/actions";

/**
 * Shared save behaviour for admin editors: dirty tracking, unsaved-changes guard, field errors
 * from the server, toast feedback and redirect to the edit URL after the first save.
 */
export function useAdminSave<T, R extends { id: string } | undefined>({
  initial,
  save,
  editPath,
  isNew,
  successMessage,
}: {
  initial: T;
  save: (data: T) => Promise<ActionResult<R>>;
  editPath?: (id: string) => string;
  isNew: boolean;
  successMessage: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [data, setData] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(data) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const submit = (override?: Partial<T>) => {
    const payload = { ...data, ...override };
    setFormError(undefined);
    startTransition(async () => {
      const result = await save(payload);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        requestAnimationFrame(() => document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      setErrors({});
      setData(payload);
      setBaseline(JSON.stringify(payload));
      notify(successMessage, { tone: "success" });
      if (isNew && result.data && editPath) router.replace(editPath(result.data.id));
      else router.refresh();
    });
  };

  return { data, setData, errors, formError, pending, dirty, submit };
}
