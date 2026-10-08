"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/toast";
import { toggleFavoriteAction } from "@/server/actions/favorites";

/* ----------------------------------------------------------------------------------------------
 * Favourites — persisted in MongoDB; this store only mirrors server state for instant UI.
 * --------------------------------------------------------------------------------------------*/

interface FavoritesState {
  ready: boolean;
  signedIn: boolean;
  ids: Set<string>;
  hydrate: (ids: string[], signedIn: boolean) => void;
  toggle: (propertyId: string, title: string) => void;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { notify } = useToast();

  const hydrate = useCallback((initial: string[], isSignedIn: boolean) => {
    setIds(new Set(initial));
    setSignedIn(isSignedIn);
    setReady(true);
  }, []);

  // The return path is read when the visitor acts rather than during render: this provider wraps
  // every route, and reading the pathname while rendering would make all of them request-bound.
  const signInToSave = useCallback(() => {
    router.push(
      `/sign-in?next=${encodeURIComponent(window.location.pathname + window.location.search)}&reason=save`,
    );
  }, [router]);

  const toggle = useCallback(
    (propertyId: string, title: string) => {
      if (!signedIn) {
        signInToSave();
        return;
      }
      const wasSaved = ids.has(propertyId);
      setIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });
      startTransition(async () => {
        const result = await toggleFavoriteAction(propertyId);
        if (!result.ok) {
          setIds((current) => {
            const reverted = new Set(current);
            if (wasSaved) reverted.add(propertyId);
            else reverted.delete(propertyId);
            return reverted;
          });
          if (result.code === "unauthenticated") {
            signInToSave();
          } else {
            notify("Could not update saved homes", { description: result.error, tone: "error" });
          }
          return;
        }
        notify(result.data.favorited ? "Saved to your shortlist" : "Removed from your shortlist", {
          description: title,
          tone: "success",
        });
      });
    },
    [ids, signedIn, signInToSave, notify],
  );

  const value = useMemo(
    () => ({ ready, signedIn, ids, hydrate, toggle }),
    [ready, signedIn, ids, hydrate, toggle],
  );
  return <FavoritesContext value={value}>{children}</FavoritesContext>;
}

export function useFavorites(): FavoritesState {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}

export function FavoritesHydrator({ ids, signedIn }: { ids: string[]; signedIn: boolean }) {
  const { hydrate } = useFavorites();
  useEffect(() => {
    hydrate(ids, signedIn);
  }, [hydrate, ids, signedIn]);
  return null;
}

/* ----------------------------------------------------------------------------------------------
 * Local lists (comparison tray, recently viewed) — convenience state, not account data.
 * --------------------------------------------------------------------------------------------*/

function createLocalList(key: string, max: number) {
  const listeners = new Set<() => void>();
  let cache: string[] | null = null;

  const read = (): string[] => {
    if (cache) return cache;
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      cache = Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string").slice(0, max)
        : [];
    } catch {
      cache = [];
    }
    return cache;
  };

  const write = (next: string[]) => {
    cache = next.slice(0, max);
    try {
      window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      /* storage unavailable (private mode); keep in-memory state */
    }
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) {
        cache = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  const EMPTY: string[] = [];
  return {
    max,
    useList: () => useSyncExternalStore(subscribe, read, () => EMPTY),
    add: (id: string) => write([id, ...read().filter((existing) => existing !== id)]),
    remove: (id: string) => write(read().filter((existing) => existing !== id)),
    toggle: (id: string) =>
      read().includes(id) ? write(read().filter((e) => e !== id)) : write([...read(), id]),
    clear: () => write([]),
  };
}

export const compareList = createLocalList("tdp:compare", 4);
export const recentlyViewedList = createLocalList("tdp:recent", 12);
