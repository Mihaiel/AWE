// ---------------------------------------------------------------------
// CERTAINTY BADGE - early-return conditional rendering (Exercise 4, Demo 2)
// ---------------------------------------------------------------------
// Reuses certaintyBadgeClass() from js/utils.ts, same lookup/mapping
// function the vanilla js/views/timeline.ts already used, not
// reinvented. Returns null rather than an empty badge span when there's
// no certainty to show, real data always has one right now, but this
// is defensive on purpose, same reasoning as Exercise 2's "don't assume
// the JSON is always well-formed."
import { certaintyBadgeClass } from "../../utils.js";

interface CertaintyBadgeProps {
  certainty: string | undefined;
}

export default function CertaintyBadge({ certainty }: CertaintyBadgeProps) {
  if (!certainty) return null;
  return <span className={"badge badge-" + certaintyBadgeClass(certainty)}>{certainty}</span>;
}
