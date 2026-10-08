"use client";

import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import type { ReactNode } from "react";

export type ToastTone = "success" | "error" | "info";

const toneIcon = {
  success: <CheckCircle2 strokeWidth={1.5} className="size-5 text-success-600" />,
  error: <CircleAlert strokeWidth={1.5} className="size-5 text-danger-600" />,
  info: <Info strokeWidth={1.5} className="size-5 text-harbour-600" />,
};

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => {
    const tone = ((toast.type as ToastTone | undefined) ?? "info") satisfies ToastTone;
    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        swipeDirection={["right", "down"]}
        className="pointer-events-auto relative flex w-full items-start gap-3 rounded-sm bg-paper p-4 pr-11 shadow-float ring-1 ring-ink-900/5 transition-[opacity,transform] duration-500 ease-luxe data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[limited]:hidden data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0"
      >
        <span className="mt-0.5">{toneIcon[tone]}</span>
        <Toast.Content className="min-w-0">
          <Toast.Title className="text-[0.95rem] font-semibold text-ink-900" />
          <Toast.Description className="mt-0.5 text-sm text-stone-600" />
        </Toast.Content>
        <Toast.Close
          aria-label="Dismiss notification"
          className="absolute top-3 right-3 grid size-7 place-items-center rounded-full text-stone-500 hover:bg-sand-100 hover:text-ink-900"
        >
          <X strokeWidth={1.5} className="size-4" />
        </Toast.Close>
      </Toast.Root>
    );
  });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider limit={3} timeout={5000}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="pointer-events-none fixed right-4 bottom-(--toast-bottom) z-[60] flex w-[min(100vw-2rem,24rem)] flex-col gap-3 sm:right-6">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

export function useToast() {
  const manager = Toast.useToastManager();
  return {
    notify: (title: string, options: { description?: string; tone?: ToastTone } = {}) =>
      manager.add({ title, description: options.description, type: options.tone ?? "info" }),
  };
}
