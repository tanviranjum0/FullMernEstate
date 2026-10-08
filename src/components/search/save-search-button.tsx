"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BellPlus } from "lucide-react";
import { useFavorites } from "@/components/property/client-stores";
import { DialogContent, DialogRoot, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldA11y } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { saveSearchAction } from "@/server/actions/saved-searches";

export function SaveSearchButton({
  queryString,
  suggestedName,
}: {
  queryString: string;
  suggestedName: string;
}) {
  const { ready, signedIn } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const returnTo = `${pathname}${queryString ? `?${queryString}` : ""}`;

  return (
    <DialogRoot
      open={open}
      onOpenChange={(next) => {
        // Before session state has loaded, open the dialog; the save action re-checks sign-in.
        if (next && ready && !signedIn) {
          router.push(`/sign-in?next=${encodeURIComponent(returnTo)}&reason=save-search`);
          return;
        }
        setName(suggestedName);
        setError(undefined);
        setOpen(next);
      }}
    >
      <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-sm px-3 text-[0.72rem] font-semibold tracking-[0.12em] text-ink-900 uppercase transition-colors hover:bg-sand-100">
        <BellPlus strokeWidth={1.5} className="size-4" />
        Save search
      </DialogTrigger>
      <DialogContent
        title="Save this search"
        description="Return to these results from your account at any time."
        className="w-[min(100vw-2rem,30rem)]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await saveSearchAction({ query: queryString, name });
              if (!result.ok) {
                if (result.code === "unauthenticated") {
                  router.push(`/sign-in?next=${encodeURIComponent(returnTo)}`);
                  return;
                }
                setError(result.error);
                return;
              }
              setOpen(false);
              notify(result.message ?? "Search saved", {
                description: "Find it under Saved searches in your account.",
                tone: "success",
              });
            });
          }}
        >
          <Field id="saved-search-name" label="Name" error={error}>
            <Input
              {...fieldA11y("saved-search-name", error)}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
            />
          </Field>
          <div className="mt-8 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save search"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
