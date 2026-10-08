"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { deleteArticleAction, deletePropertyAction, setPropertyStatusAction } from "@/server/actions/admin";
import { adminButton } from "./form-kit";

const itemClass = "flex w-full cursor-pointer items-center rounded-xs px-3 py-2 text-sm text-ink-800 outline-none data-[highlighted]:bg-sand-100";

export function PropertyRowActions({ id, title, status, canDelete }: { id: string; title: string; status: string; canDelete: boolean }) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (label: string, action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        notify(`Could not ${label}`, { description: result.error, tone: "error" });
        return;
      }
      notify(`Listing ${label === "delete" ? "deleted" : "updated"}`, { description: title, tone: "success" });
      router.refresh();
    });

  return (
    <>
      <Menu.Root>
        <Menu.Trigger aria-label={`Actions for ${title}`} disabled={pending} className="grid size-8 place-items-center rounded-sm text-stone-600 hover:bg-sand-100 hover:text-ink-900 disabled:opacity-50">
          <MoreHorizontal className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={4} className="z-50">
            <Menu.Popup className="min-w-44 rounded-sm bg-white p-1 shadow-float ring-1 ring-ink-900/5">
              {status !== "published" ? (
                <Menu.Item className={itemClass} onClick={() => run("publish", () => setPropertyStatusAction(id, "published"))}>
                  Publish
                </Menu.Item>
              ) : (
                <Menu.Item className={itemClass} onClick={() => run("unpublish", () => setPropertyStatusAction(id, "draft"))}>
                  Move to draft
                </Menu.Item>
              )}
              {status !== "archived" ? (
                <Menu.Item className={itemClass} onClick={() => run("archive", () => setPropertyStatusAction(id, "archived"))}>
                  Archive
                </Menu.Item>
              ) : null}
              {canDelete ? (
                <Menu.Item className={`${itemClass} text-danger-600`} onClick={() => setConfirmDelete(true)}>
                  Delete permanently…
                </Menu.Item>
              ) : null}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <DialogRoot open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title="Delete this listing?" description={`“${title}” and its photographs will be permanently removed. Archiving keeps the record instead.`} className="w-[min(100vw-2rem,28rem)]">
          <div className="flex justify-end gap-2">
            <button type="button" className={adminButton.secondary} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={`${adminButton.primary} bg-danger-600 hover:bg-danger-600/90`}
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false);
                run("delete", () => deletePropertyAction(id));
              }}
            >
              Delete listing
            </button>
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export function DeleteArticleButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <button type="button" className={adminButton.danger} onClick={() => setOpen(true)}>
        Delete
      </button>
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent title="Delete this article?" description={`“${title}” will be permanently removed.`} className="w-[min(100vw-2rem,28rem)]">
          <div className="flex justify-end gap-2">
            <button type="button" className={adminButton.secondary} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className={`${adminButton.primary} bg-danger-600 hover:bg-danger-600/90`}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteArticleAction(id);
                  setOpen(false);
                  if (!result.ok) {
                    notify("Could not delete", { description: result.error, tone: "error" });
                    return;
                  }
                  notify("Article deleted", { tone: "success" });
                  router.push("/admin/insights");
                  router.refresh();
                })
              }
            >
              Delete article
            </button>
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
