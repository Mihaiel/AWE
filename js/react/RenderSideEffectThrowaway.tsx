// ---------------------------------------------------------------------
// RENDER SIDE-EFFECT DEMO (THROWAWAY) - Exercise 6, Demo 1 live demo
// ---------------------------------------------------------------------
// Uncomment the import and the <RenderSideEffectThrowaway /> line in
// App.tsx to show this live, same convention as Exercise 4 Demo 4's
// KeyDemoThrowaway: kept in the repo, commented out, not deleted.
//
// renderCount is a module-level variable, mutated directly inside this
// component's own render body - a side effect during render (mutating
// something outside the component), not inside an effect. It "works":
// the number on screen is correct-looking. But with <StrictMode> now
// wrapping the app (main.tsx), React deliberately calls this
// component's function twice per actual commit in development,
// specifically to surface exactly this kind of bug. Click "Re-render"
// and watch the number jump by 2 each time, not 1. Comment out
// <StrictMode> in main.tsx (or look at a production build via
// `npm run build && npm run preview`) and it jumps by 1 instead - same
// broken code, different symptom depending on when React happens to
// call render more than once, which is the actual point: the bug was
// always there, Strict Mode just makes it visible on purpose instead
// of leaving it to surface unpredictably later (e.g. under React's
// concurrent rendering, which can also render a component more than
// once before committing).
import { useState } from "react";

let renderCount = 0;

export default function RenderSideEffectThrowaway() {
  renderCount++;
  const [, forceRerender] = useState(0);

  return (
    <div className="detail-field">
      <strong>Exercise 6, Demo 1 live demo</strong>
      <div>Render count (module-level variable, mutated directly in render): {renderCount}</div>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={() => forceRerender((n) => n + 1)}
      >
        Re-render
      </button>
    </div>
  );
}
