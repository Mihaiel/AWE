// ---------------------------------------------------------------------
// PERSON DETAIL PAGE - Exercise 4, Demo 9: a route with a parameter
// ---------------------------------------------------------------------
// Routed at /team/people/:personId (see App.tsx). useParams() gives
// `personId` as `string | undefined` by default, TypeScript has no way
// to know our own route config guarantees that segment is present, it
// only sees "some route param, maybe missing." The real unsafe case
// isn't that type though, it's that `personId` might not match any
// person at all (typo'd URL, a stale/bookmarked link to someone removed
// from the case file, etc.) - handled below by just not assuming
// `.find()` succeeds, same discipline as this app's `unknown` JSON
// fetches, don't trust data you didn't build yourself.
//
// Exercise 6, Demo 5: fetch() below now hits the dev-only backend
// instead of the static data/people.json file. See DashboardPage.tsx's
// own comment and EXERCISE_6.md Demo 5.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Person } from "../../types.js";
import Panel from "../components/Panel.js";
import PersonCard from "./PersonCard.js";
import { API_BASE_URL } from "../apiConfig.js";

export default function PersonDetailPage() {
  const { personId } = useParams();
  const [people, setPeople] = useState<Person[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`${API_BASE_URL}/api/people`);
      const json: unknown = await res.json();
      if (!cancelled) {
        setPeople(json as Person[]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!people) {
    return <p>Loading case file&hellip;</p>;
  }

  const person = people.find((p) => p.id === personId);

  return (
    <Panel title={person ? person.name : "Person not found"}>
      <p>
        <Link to="/team/people">&larr; Back to People &amp; Locations</Link>
      </p>
      {person ? (
        <>
          <PersonCard person={person} />
          <p>
            {/* Demo 10: the other end of Timeline's ?person= query param -
                a real place in the app that links to it, not a hand-typed
                URL. */}
            <Link to={`/timeline?person=${person.id}`}>
              View timeline events involving {person.name}
            </Link>
          </p>
        </>
      ) : (
        <p>No person matches &ldquo;{personId}&rdquo; in the case file.</p>
      )}
    </Panel>
  );
}
