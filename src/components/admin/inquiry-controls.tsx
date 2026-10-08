"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABELS, type InquiryStatus } from "@/config/domain";
import { updateInquiryAction } from "@/server/actions/admin";
import { AdminField, adminButton, adminInput, adminTextarea } from "./form-kit";

export function InquiryControls({
  id,
  status,
  assignedTo,
  agents,
  canAssign,
}: {
  id: string;
  status: InquiryStatus;
  assignedTo: string;
  agents: { id: string; name: string; active: boolean }[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [nextStatus, setNextStatus] = useState(status);
  const [assignee, setAssignee] = useState(assignedTo);
  const [note, setNote] = useState("");

  const submit = (patch: Record<string, unknown>, done?: () => void) =>
    startTransition(async () => {
      const result = await updateInquiryAction(id, patch);
      if (!result.ok) {
        notify("Could not update the enquiry", { description: result.error, tone: "error" });
        return;
      }
      done?.();
      notify("Enquiry updated", { tone: "success" });
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <AdminField id="inquiry-status" label="Status">
          <select
            id="inquiry-status"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as InquiryStatus)}
            className={adminInput}
          >
            {INQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {INQUIRY_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </AdminField>
        <button
          type="button"
          disabled={pending || nextStatus === status}
          className={adminButton.primary}
          onClick={() => submit({ status: nextStatus })}
        >
          Update status
        </button>
      </div>
      {canAssign ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <AdminField id="inquiry-assignee" label="Assigned advisor">
            <select
              id="inquiry-assignee"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className={adminInput}
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id} disabled={!agent.active}>
                  {agent.name}
                </option>
              ))}
            </select>
          </AdminField>
          <button
            type="button"
            disabled={pending || assignee === assignedTo}
            className={adminButton.secondary}
            onClick={() => submit({ assignedTo: assignee })}
          >
            Reassign
          </button>
        </div>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (note.trim()) submit({ note: note.trim() }, () => setNote(""));
        }}
      >
        <AdminField id="inquiry-note" label="Add an internal note" hint="Visible to staff only">
          <textarea
            id="inquiry-note"
            rows={3}
            value={note}
            maxLength={4000}
            onChange={(event) => setNote(event.target.value)}
            className={adminTextarea}
          />
        </AdminField>
        <button
          type="submit"
          disabled={pending || !note.trim()}
          className={`${adminButton.secondary} mt-2`}
        >
          Add note
        </button>
      </form>
    </div>
  );
}
