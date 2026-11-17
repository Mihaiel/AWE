// ---------------------------------------------------------------------
// useFetch<T> - Exercise 6, Demo 8
// ---------------------------------------------------------------------
// Generalizes the loading/error/cancellation pattern Demos 5-7 built up
// one piece at a time, directly inside TimelinePage.tsx: a GET request
// in an effect, a separate `error` state (Demo 6), and an
// AbortController that cancels the *previous* in-flight request before
// starting a new one, both on a manual refetch and on unmount (Demo 7).
// That exact logic, now written once, used here by both TimelinePage
// and PersonDetailPage.
//
// This is a legitimate custom hook, not just a helper function someone
// could call anywhere, because it calls other hooks internally
// (useState, useEffect, useCallback, useRef) - React's "Rules of
// Hooks" require those to only ever be called from a function
// component or from another hook (never a regular function, loop, or
// conditional), checked at the component level, not by inspecting the
// hook's own body. Naming it with a `use` prefix is what tells
// React's own ESLint rule (and other developers) to apply those same
// rules to it too.
//
// Deliberately still calls fetch() directly inside the hook, not
// through a separate API-access layer - that split, and making sure
// no component calls fetch() directly anymore, is Demo 9's explicit
// job, not this one. Only 2 of the app's 5 views use this hook so far
// (TimelinePage, PersonDetailPage); the rest keep their own
// Promise.all-based effects for now, deliberately not migrated here -
// see EXERCISE_6.md Demo 8 for why "at least one hook, two call sites"
// doesn't mean "migrate everything in this demo."
import { useCallback, useEffect, useRef, useState } from "react";

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const json = (await res.json()) as T;
      setData(json);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Superseded by a newer call (a refetch, or the URL changing) -
        // not a real failure, nothing to show for this one.
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [url]);

  useEffect(() => {
    load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  return { data, error, refetch: load };
}
