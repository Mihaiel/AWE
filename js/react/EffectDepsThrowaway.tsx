// ---------------------------------------------------------------------
// EFFECT DEPENDENCY ARRAYS DEMO (THROWAWAY) - Exercise 6, Demo 2 live demo
// ---------------------------------------------------------------------
// Uncomment the import and the <EffectDepsThrowaway /> line in App.tsx
// to show this live, same convention as Demo 1's own throwaway.
//
// Three useEffect calls, same component, logging to the console so the
// actual run count is observable rather than just asserted. Verified
// live on a genuinely fresh page load (a brand new tab, not a Vite HMR
// reload, which inflates the counts with extra remounts):
// - no array at all: runs after every single render, no exceptions -
//   confirmed it re-logs on every click of either button below.
// - empty array []: logs TWICE on mount, not once - <StrictMode> (see
//   main.tsx) double-invokes effects on mount in dev specifically to
//   simulate "mount, clean up, mount again" and catch missing cleanup
//   (Demo 3's own topic). After that initial double-mount, confirmed
//   it never logs again no matter how many times "Increment other" or
//   "Increment count" is clicked.
// - array with [count]: same double-log on mount, then logs again
//   only on a render where `count` itself changed since the last run.
//   Confirmed: clicking "Increment other" re-renders this component
//   (the no-array effect logs again) but does NOT re-run this one,
//   because React compares count's old and new value and finds them
//   equal; clicking "Increment count" does re-run it.
import { useEffect, useState } from "react";

export default function EffectDepsThrowaway() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  useEffect(() => {
    console.log("[no deps array] ran - this runs after every render");
  });

  useEffect(() => {
    console.log("[empty deps array] ran - mounts twice in dev under StrictMode, then never again");
  }, []);

  useEffect(() => {
    console.log("[deps array [count]] ran - count is now", count);
  }, [count]);

  return (
    <div className="detail-field">
      <strong>Exercise 6, Demo 2 live demo</strong>
      <div>count: {count}</div>
      <div>other (unrelated state): {other}</div>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={() => setCount((c) => c + 1)}
      >
        Increment count
      </button>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={() => setOther((o) => o + 1)}
      >
        Increment other
      </button>
    </div>
  );
}
