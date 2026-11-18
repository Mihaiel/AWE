// ---------------------------------------------------------------------
// useFetch<T> - Exercise 6, Demo 8, layered further in Demo 9
// ---------------------------------------------------------------------
// Application-logic layer: loading state, error state, cancellation,
// and a manual refetch - and nothing about URLs, response shapes, or
// the backend at all. Demo 8 had this hook calling fetch() directly
// against a URL string; Demo 9 pulls that last piece out too, so this
// file no longer imports apiConfig.ts or knows "/api/..." exists at
// all. Instead it takes a `fetcher`: any function shaped
// (signal) => Promise<T> - normally one of the functions exported
// from api.ts, the one place that DOES know the backend's URLs/
// shapes. This hook would work completely unchanged if "the backend"
// were swapped for something else entirely (GraphQL, a different REST
// shape, IndexedDB) - it has zero opinion on where `fetcher`'s data
// actually comes from, only on how to turn calling it into loading/
// error/data state.
//
// Also exposes `setData`, a deliberate escape hatch: EvidencePage
// needs to apply a local, already-known update (an evidence item's
// status/relevance, right after writing it to localStorage) without
// re-fetching from the network just to see its own edit reflected.
// That's a real gap "just refetch" doesn't cover, not something to
// hide - the same reason real data-fetching libraries (React Query's
// setQueryData, SWR's mutate) expose an equivalent hatch.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
  refetch: () => void;
  setData: Dispatch<SetStateAction<T | null>>;
}

export function useFetch<T>(fetcher: (signal?: AbortSignal) => Promise<T>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await fetcher(controller.signal);
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Superseded by a newer call (a refetch, or the fetcher
        // changing) - not a real failure, nothing to show for this one.
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [fetcher]);

  useEffect(() => {
    load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  return { data, error, refetch: load, setData };
}
