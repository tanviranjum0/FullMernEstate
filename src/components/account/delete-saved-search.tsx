"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { deleteSavedSearchAction } from "@/server/actions/saved-searches";

export function DeleteSavedSearchButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete saved search ${name}`}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteSavedSearchAction(id);
          if (!result.ok) {
            notify("Could not delete this search", { description: result.error, tone: "error" });
            return;
          }
          notify("Saved search removed", { tone: "success" });
          router.refresh();
        })
      }
      className="grid size-9 place-items-center rounded-sm border border-sand-300 text-stone-600 transition-colors hover:border-danger-600 hover:text-danger-600 disabled:opacity-50"
    >
      <Trash2 strokeWidth={1.5} className="size-4" />
    </button>
  );
}
