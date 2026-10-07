"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";

const noopSubscribe = () => () => undefined;

const itemClass =
  "flex w-full cursor-pointer items-center gap-3 rounded-xs px-3 py-2.5 text-sm text-ink-800 outline-none data-[highlighted]:bg-sand-100";

export function ShareButton({ url, title, propertyId }: { url: string; title: string; propertyId: string }) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => "share" in navigator,
    () => false,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      notify("Link copied", { tone: "success" });
      track("share", propertyId);
    } catch {
      notify("Could not copy the link", { description: url, tone: "error" });
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
      track("share", propertyId);
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-11 items-center gap-2 rounded-sm border border-ink-900/20 px-4 text-[0.72rem] font-semibold tracking-[0.08em] text-ink-900 uppercase transition-colors hover:border-ink-900">
        <Share2 strokeWidth={1.5} className="size-[18px]" />
        Share
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-50">
          <Menu.Popup className="min-w-56 rounded-sm bg-paper p-1.5 shadow-float ring-1 ring-ink-900/5 transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {canNativeShare ? (
              <Menu.Item className={itemClass} onClick={nativeShare}>
                <Share2 strokeWidth={1.5} className="size-4" /> Share…
              </Menu.Item>
            ) : null}
            <Menu.Item className={itemClass} onClick={copy} closeOnClick={false}>
              {copied ? <Check strokeWidth={1.5} className="size-4" /> : <Link2 strokeWidth={1.5} className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </Menu.Item>
            <Menu.Item
              className={itemClass}
              render={<a href={`mailto:?subject=${text}&body=${encoded}`} />}
              onClick={() => track("share", propertyId)}
            >
              <Mail strokeWidth={1.5} className="size-4" /> Email
            </Menu.Item>
            <Menu.Item
              className={itemClass}
              render={<a href={`https://wa.me/?text=${text}%20${encoded}`} target="_blank" rel="noopener noreferrer" />}
              onClick={() => track("share", propertyId)}
            >
              <span aria-hidden className="grid size-4 place-items-center text-[0.6rem] font-bold">W</span> WhatsApp
            </Menu.Item>
            <Menu.Item
              className={itemClass}
              render={
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              onClick={() => track("share", propertyId)}
            >
              <span aria-hidden className="grid size-4 place-items-center text-[0.6rem] font-bold">in</span> LinkedIn
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
