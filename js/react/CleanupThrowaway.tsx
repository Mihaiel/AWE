// ---------------------------------------------------------------------
// CLEANUP DEMO (THROWAWAY) - Exercise 6, Demo 3 live demo
// ---------------------------------------------------------------------
// Uncomment the import and the <CleanupThrowaway /> line in App.tsx to
// show this live, same convention as Demo 1/2's own throwaways.
//
// TickingTimer starts a setInterval in its effect and clears it in the
// effect's cleanup function, logging in both places so both are
// visible in the console. Toggling "Unmount timer" below removes
// TickingTimer from the tree entirely (not just hiding it), which is
// exactly what triggers that cleanup - confirmed live: click it, the
// console logs "[cleanup] clearInterval called" immediately, and the
// "[interval] tick" logs stop appearing every second afterward.
//
// Exercise 6, Demo 3 live demo (uncomment this function, then swap
// which component <CleanupThrowaway /> actually mounts below from
// TickingTimer to TickingTimerNoCleanup, to show the bug): same
// effect, minus the cleanup return. Toggle "Unmount timer" on and back
// "Mount timer" on a few times - each mount starts a brand new
// setInterval, but none of the old ones are ever cleared, so the
// console starts logging 2 "tick"s per second after one remount, 3
// after two, and so on, all from intervals whose component isn't even
// on screen anymore. Swap back to TickingTimer afterward.
// function TickingTimerNoCleanup() {
//   useEffect(() => {
//     console.log("[effect] setInterval started (no cleanup)");
//     setInterval(() => {
//       console.log("[interval, NO CLEANUP] tick");
//     }, 1000);
//   }, []);
//
//   return <p>Ticking timer (no cleanup) mounted - open the console.</p>;
// }
import { useEffect, useState } from "react";

function TickingTimer() {
  useEffect(() => {
    console.log("[effect] setInterval started");
    const id = setInterval(() => {
      console.log("[interval] tick");
    }, 1000);

    return () => {
      console.log("[cleanup] clearInterval called");
      clearInterval(id);
    };
  }, []);

  return <p>Ticking timer mounted - open the console.</p>;
}

export default function CleanupThrowaway() {
  const [mounted, setMounted] = useState(true);

  return (
    <div className="detail-field">
      <strong>Exercise 6, Demo 3 live demo</strong>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={() => setMounted((m) => !m)}
      >
        {mounted ? "Unmount" : "Mount"} timer
      </button>
      {mounted && <TickingTimer />}
    </div>
  );
}
