// ---------------------------------------------------------------------
// BOOKMARKS CONTEXT - Exercise 5 Demo 8
// ---------------------------------------------------------------------
// Demo 5 lifted bookmark state up to App.tsx, the lowest common
// ancestor of Dashboard/Evidence/Workspace. Demo 6 then had to pass it
// down as props through every route App.tsx renders - including
// App.tsx itself, whose actual job is the shell/routing, not owning
// this domain's data. Context removes that pass-through: the state
// still lives in exactly one place (this file, not scattered back out
// across 3 pages like before Demo 5), but Dashboard/EvidencePage/
// WorkspacePage now read it directly via useBookmarks() instead of
// receiving it as a prop relayed through App.
// Context - see EXERCISE_5.md Demo 8 for why it's a reasonable fit
// here specifically (read by 3 unrelated page-level components, with
// an ancestor - App - that has no real interest in it) and why most of
// this app's other state (the Evidence filters, the hypothesis draft)
// is deliberately NOT also moved here: Context solves one specific
// problem (avoiding a prop relay through an uninterested ancestor),
// and most state in this app doesn't have that problem - moving
// everything into Context "just because" would just trade prop
// drilling for the exact "unnecessary global state" problem that demo
// also names.
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEY_BOOKMARKS } from "../storage.js";

interface BookmarksContextValue {
  bookmarks: string[];
  toggleBookmark: (evidenceId: string) => void;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

function readBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeBookmarks(bookmarks: string[]): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
}

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>(readBookmarks);

  // Carried over unchanged since Exercise 5, Demo 3: still a brand new
  // array via .filter()/spread, never a mutation.
  function toggleBookmark(evidenceId: string) {
    const next = bookmarks.includes(evidenceId)
      ? bookmarks.filter((id) => id !== evidenceId)
      : [...bookmarks, evidenceId];
    setBookmarks(next);
    writeBookmarks(next);
  }

  // ---------------------------------------------------------------------
  // Exercise 5, Demo 3 live demo (uncomment this function, then swap the
  // `toggleBookmark` passed into the Provider's value below to
  // `toggleBookmarkBuggy` to show it in class): click a star and nothing
  // happens, not even a second later, because .push()/.splice() mutate
  // `bookmarks` in place and setBookmarks is then called with that EXACT
  // SAME array reference. React's setState bails out via
  // Object.is(prevState, nextState) and skips the re-render entirely
  // when they're reference-equal, so the star never flips, the data did
  // change in memory (log `bookmarks` in the console right after
  // clicking - it's correct!), React just never found out. Swap back to
  // toggleBookmark afterward.
  // function toggleBookmarkBuggy(evidenceId: string) {
  //   if (bookmarks.includes(evidenceId)) {
  //     bookmarks.splice(bookmarks.indexOf(evidenceId), 1);
  //   } else {
  //     bookmarks.push(evidenceId);
  //   }
  //   setBookmarks(bookmarks);
  //   writeBookmarks(bookmarks);
  // }

  return (
    <BookmarksContext.Provider value={{ bookmarks, toggleBookmark }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks(): BookmarksContextValue {
  const ctx = useContext(BookmarksContext);
  if (!ctx) {
    throw new Error("useBookmarks must be used within a BookmarksProvider");
  }
  return ctx;
}
