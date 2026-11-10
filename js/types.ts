// ---------------------------------------------------------------------
// DOMAIN TYPES
// ---------------------------------------------------------------------
// Shapes for the four case-file JSON files under data/. Exercise 2,
// Demo 6 - these replace state.ts's placeholder HasId[] from Demo 5.
//
// status/relevance/type/certainty stay `string`, not string-literal
// unions: the real JSON isn't consistent enough to make that honest.
// evidence.json alone has "test-report" and "Test-Report" for the same
// `type`, and "Reviewed"/"Unknown" (E12) against everywhere else's
// lowercase "reviewed"/"unknown". A union type wouldn't catch that
// mismatch anyway - fetch().json() is `any`, so TS trusts whatever we
// tell it, it never checks the actual file. See EXERCISE_2.md Demo 6,
// question 2.

export interface Case {
  caseId: string;
  title: string;
  subtitle: string;
  status: string;
  opened: string;
  summary: string;
  location: string;
  leadInvestigator: string;
  notes: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  speciality: string;
  responsibilities: string[];
  statement: string;
  background: string;
  avatar: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  contains: string[];
}

export interface Evidence {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  summary: string;
  content: string;
  // Meant to be Person ids, but evidence.json's E04 uses "Nova Byte"
  // (a display name) instead of "nova-byte". See EXERCISE_2.md Demo 6,
  // task 3 / question 1 for why this stays string[] instead of a
  // stricter alias, and utils.ts's evidenceMentionsPerson for the
  // runtime workaround that already existed for this.
  personIds: string[];
  locationIds: string[];
  tags: string[];
  status: string;
  relevance: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: string;
  certainty: string;
  personIds: string[];
  locationIds: string[];
  evidenceIds: string[];
}
