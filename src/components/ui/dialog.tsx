"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;
export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;

const backdropClass =
  "fixed inset-0 z-50 bg-ink-950/55 backdrop-blur-[2px] transition-opacity duration-300 ease-calm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0";

export function DialogContent({
  className,
  children,
  title,
  description,
  hideTitle = false,
  ...props
}: ComponentProps<typeof BaseDialog.Popup> & {
  title: string;
  description?: string;
  hideTitle?: boolean;
  children: ReactNode;
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={backdropClass} />
      <BaseDialog.Popup
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(100vw-2rem,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
          "rounded-sm bg-paper p-6 shadow-float sm:p-8",
          "transition-[opacity,transform] duration-300 ease-luxe data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      >
        <div className={cn("mb-6 pr-10", hideTitle && "sr-only")}>
          <BaseDialog.Title className="font-display text-heading-3 text-ink-900">{title}</BaseDialog.Title>
          {description ? (
            <BaseDialog.Description className="mt-2 text-stone-600">{description}</BaseDialog.Description>
          ) : null}
        </div>
        {children}
        <BaseDialog.Close
          aria-label="Close"
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-stone-600 transition-colors hover:bg-sand-100 hover:text-ink-900"
        >
          <X strokeWidth={1.5} className="size-5" />
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export const SheetRoot = BaseDrawer.Root;
export const SheetTrigger = BaseDrawer.Trigger;
export const SheetClose = BaseDrawer.Close;

type SheetSide = "bottom" | "right" | "left";

const sheetSideClass: Record<SheetSide, string> = {
  bottom:
    "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-md data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
  right:
    "inset-y-0 right-0 h-dvh w-[min(100vw,26rem)] data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
  left: "inset-y-0 left-0 h-dvh w-[min(100vw,26rem)] data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full",
};

/** Swipe-dismissable panel used for mobile filters (bottom) and navigation (side). */
export function SheetContent({
  side = "bottom",
  title,
  description,
  className,
  children,
  footer,
}: {
  side?: SheetSide;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className={backdropClass} />
      <BaseDrawer.Viewport className="fixed inset-0 z-50 pointer-events-none">
        <BaseDrawer.Popup
          className={cn(
            "pointer-events-auto fixed flex flex-col bg-paper shadow-float outline-none",
            "transition-transform duration-500 ease-luxe",
            sheetSideClass[side],
            className,
          )}
        >
          {side === "bottom" ? (
            <div aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-sand-300" />
          ) : null}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-sand-200 px-6 py-5">
            <div>
              <BaseDrawer.Title className="font-display text-2xl text-ink-900">{title}</BaseDrawer.Title>
              {description ? (
                <BaseDrawer.Description className="mt-1 text-sm text-stone-600">{description}</BaseDrawer.Description>
              ) : null}
            </div>
            <BaseDrawer.Close
              aria-label="Close"
              className="-mt-1 -mr-2 grid size-10 place-items-center rounded-full text-stone-600 transition-colors hover:bg-sand-100 hover:text-ink-900"
            >
              <X strokeWidth={1.5} className="size-5" />
            </BaseDrawer.Close>
          </div>
          <BaseDrawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
            {children}
          </BaseDrawer.Content>
          {footer ? <div className="shrink-0 border-t border-sand-200 px-6 py-4">{footer}</div> : null}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}
