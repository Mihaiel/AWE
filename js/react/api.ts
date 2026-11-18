// ---------------------------------------------------------------------
// API ACCESS LAYER - Exercise 6, Demo 9
// ---------------------------------------------------------------------
// The one place in this app that knows the backend's actual URLs and
// response shapes. Every function here does exactly one thing: a raw
// fetch() to one backend endpoint (or several, combined via
// Promise.all() for a view that needs more than one resource at
// once), parse the JSON, and either return it or throw. No React, no
// hooks, no loading/error state, no localStorage, no cancellation
// policy beyond accepting an optional AbortSignal and passing it
// straight through to fetch() - all of that is useFetch.ts's job
// (Demo 8), not this file's. If the backend's URLs or response shapes
// ever change, this is the only file that needs to know.
import type { Case, Evidence, Person, Location, TimelineEvent } from "../types.js";
import { API_BASE_URL } from "./apiConfig.js";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  // exactOptionalPropertyTypes: passing `{ signal }` unconditionally
  // would set the property to `undefined` explicitly when no signal
  // was given, which RequestInit's own type doesn't allow - only
  // `AbortSignal | null` or omitting the property entirely.
  const res = await fetch(`${API_BASE_URL}${path}`, signal ? { signal } : {});
  if (!res.ok) {
    throw new Error(`Server responded with ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchCase(signal?: AbortSignal): Promise<Partial<Case>> {
  return getJson<Partial<Case>>("/api/case", signal);
}

export function fetchEvidence(signal?: AbortSignal): Promise<Evidence[]> {
  return getJson<Evidence[]>("/api/evidence", signal);
}

export function fetchPeople(signal?: AbortSignal): Promise<Person[]> {
  return getJson<Person[]>("/api/people", signal);
}

export function fetchLocations(signal?: AbortSignal): Promise<Location[]> {
  return getJson<Location[]>("/api/locations", signal);
}

export function fetchTimeline(signal?: AbortSignal): Promise<TimelineEvent[]> {
  return getJson<TimelineEvent[]>("/api/timeline", signal);
}

// --- combined fetches, one per view that needs more than one resource ---
// Each is still just Promise.all() over the single-resource functions
// above - no new knowledge of the backend, just grouping what one
// particular view happens to need into one awaitable result, so that
// view's own useFetch() call gets one combined { data, error } instead
// of juggling several.

export interface DashboardData {
  caseData: Partial<Case>;
  evidence: Evidence[];
  people: Person[];
  locations: Location[];
  timeline: TimelineEvent[];
}

export async function fetchDashboardData(signal?: AbortSignal): Promise<DashboardData> {
  const [caseData, evidence, people, locations, timeline] = await Promise.all([
    fetchCase(signal),
    fetchEvidence(signal),
    fetchPeople(signal),
    fetchLocations(signal),
    fetchTimeline(signal),
  ]);
  return { caseData, evidence, people, locations, timeline };
}

export interface EvidenceCatalogueData {
  evidence: Evidence[];
  people: Person[];
  locations: Location[];
}

export async function fetchEvidenceCatalogueData(
  signal?: AbortSignal,
): Promise<EvidenceCatalogueData> {
  const [evidence, people, locations] = await Promise.all([
    fetchEvidence(signal),
    fetchPeople(signal),
    fetchLocations(signal),
  ]);
  return { evidence, people, locations };
}

export interface WorkspaceData {
  evidence: Evidence[];
  people: Person[];
}

export async function fetchWorkspaceData(signal?: AbortSignal): Promise<WorkspaceData> {
  const [evidence, people] = await Promise.all([fetchEvidence(signal), fetchPeople(signal)]);
  return { evidence, people };
}

export interface PeopleLocationsData {
  people: Person[];
  locations: Location[];
}

export async function fetchPeopleLocationsData(signal?: AbortSignal): Promise<PeopleLocationsData> {
  const [people, locations] = await Promise.all([fetchPeople(signal), fetchLocations(signal)]);
  return { people, locations };
}
