"use client";

import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/motion";
import { FavoritesProvider } from "@/components/property/client-stores";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <MotionProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </MotionProvider>
    </ToastProvider>
  );
}
