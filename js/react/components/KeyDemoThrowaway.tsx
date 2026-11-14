// ---------------------------------------------------------------------
// LIVE DEMO ONLY - Exercise 4, Demo 4. Not part of the real app, kept
// here (commented out in App.tsx) so this can be uncommented and shown
// live: check Alice's box, click "Remove first suspect", and watch the
// checkbox land on Bob instead (he was never clicked), because `key`
// is `index`, not a stable id. Switch the key below to `suspect.id` and
// repeat the same steps to show the fix: Alice's checked state now
// correctly disappears with her instead of jumping to Bob.
// ---------------------------------------------------------------------
import { useState } from "react";

interface Suspect {
  id: string;
  name: string;
}

function SuspectRow({ name }: { name: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <label style={{ display: "block", padding: "4px 0" }}>
      <input type="checkbox" checked={checked} onChange={() => setChecked((c) => !c)} /> {name}
    </label>
  );
}

const INITIAL: Suspect[] = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Carol" },
];

export default function KeyDemoThrowaway() {
  const [suspects, setSuspects] = useState<Suspect[]>(INITIAL);

  return (
    <div>
      <button type="button" onClick={() => setSuspects((prev) => prev.slice(1))}>
        Remove first suspect
      </button>
      {suspects.map((suspect, index) => (
        // Buggy on purpose: key={index}. Live fix: key={suspect.id}.
        <SuspectRow key={index} name={suspect.name} />
      ))}
    </div>
  );
}
