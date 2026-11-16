// ---------------------------------------------------------------------
// EVIDENCE STATUS/RELEVANCE OVERRIDES - Exercise 5 Demo 9
// ---------------------------------------------------------------------
// Diagnosed in Demo 9's own review, not something that showed up as an
// obviously broken screen until tested for directly: Demo 6 wired
// EvidenceDetail's status/relevance selects to update EvidencePage's
// own `data.evidence`, but never persisted that edit anywhere - it
// only ever lived in that one mount's in-memory state. DashboardPage
// and WorkspacePage each fetch their OWN independent copy of
// evidence.json (Exercise 3/4's established, documented per-page fetch
// pattern), so neither of them ever saw a status/relevance change made
// from the Evidence page - and worse, navigating away from Evidence
// and back refetched evidence.json fresh too, silently discarding the
// edit entirely. That's duplicated state: the same fact (one evidence
// item's status/relevance) held in 3 independent, unsynced in-memory
// copies, with nothing keeping them aligned. Verified live before
// fixing: changed a status to "Reviewed" in the detail view, Dashboard's
// "Reviewed" count stayed unchanged, and navigating back to Evidence
// showed the item reverted to "Unreviewed".
//
// Fix: persist status/relevance overrides to localStorage, the same
// way bookmarks/notes already do, and have every page that fetches
// evidence.json apply them with applyEvidenceOverrides() right after
// fetching, before the data is ever rendered. Deliberately a plain
// shared function here, not a Context like bookmarks got in Demo 8 -
// the underlying evidence array is still legitimately fetched
// independently per page (that's Exercise 3/4's own documented
// trade-off, not something this fix is trying to undo), only the
// override layer needed one shared definition instead of three
// separately-reinvented ones.
import type { Evidence } from "../types.js";
import { STORAGE_KEY_EVIDENCE_OVERRIDES } from "../storage.js";

interface EvidenceOverride {
  status?: string;
  relevance?: string;
}

function readOverrides(): Record<string, EvidenceOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVIDENCE_OVERRIDES);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, EvidenceOverride>) : {};
  } catch {
    return {};
  }
}

export function applyEvidenceOverrides(evidence: Evidence[]): Evidence[] {
  const overrides = readOverrides();
  return evidence.map((ev) => (overrides[ev.id] ? { ...ev, ...overrides[ev.id] } : ev));
}

export function writeEvidenceOverride(evidenceId: string, patch: EvidenceOverride): void {
  const overrides = readOverrides();
  const next = { ...overrides, [evidenceId]: { ...overrides[evidenceId], ...patch } };
  localStorage.setItem(STORAGE_KEY_EVIDENCE_OVERRIDES, JSON.stringify(next));
}
