// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS PAGE - real content, Exercise 4
// ---------------------------------------------------------------------
// Fetches its own data the same way Exercise 3 Demo 10's DashboardPage
// does, same known placeholder: fine for migrating one view, a shared
// data layer is still the real architecture once more views move over.
//
// Demo 2: the People/Locations tab toggle is the task's own named
// example of "a state-dependent style/label." activeTab is genuinely
// minimal UI state (which of two already-fetched lists to show), not
// the kind of feature-level interactivity (filtering, forms) this
// exercise otherwise rules out.
//
// Demo 5: this used to build the tab-bar markup itself too, fetching
// and owning state (feature job) plus rendering tab buttons by hand
// (presentational job) in one component. Split that second job out
// into TabBar, this component now only decides what the tabs are and
// what to render below them.
//
// Demo 8: activeTab used to be its own useState, set by TabBar's
// onChange. Both /team/people and /team/locations now render this
// same component (see App.tsx's routes), so activeTab is derived from
// the current URL via useLocation() instead, the URL is the only
// source of truth for which tab is showing, not a value React forgets
// on reload. Data still fetches once: react-router renders the same
// PeoplePage element across both routes, so React never unmounts it
// when navigating between tabs, confirmed live (switching tabs doesn't
// re-trigger the loading state).
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Person, Location } from "../../types.js";
import PersonCard from "./PersonCard.js";
import LocationCard from "./LocationCard.js";
import Panel from "../components/Panel.js";
import TabBar from "../components/TabBar.js";

interface PeopleLocationsData {
  people: Person[];
  locations: Location[];
}

type Tab = "people" | "locations";

export default function PeoplePage() {
  const [data, setData] = useState<PeopleLocationsData | null>(null);
  const { pathname } = useLocation();
  const activeTab: Tab = pathname.endsWith("/locations") ? "locations" : "people";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [peopleRes, locationsRes] = await Promise.all([
        fetch("data/people.json"),
        fetch("data/locations.json"),
      ]);
      const peopleJson: unknown = await peopleRes.json();
      const locationsJson: unknown = await locationsRes.json();

      if (!cancelled) {
        setData({ people: peopleJson as Person[], locations: locationsJson as Location[] });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <p>Loading case file&hellip;</p>;
  }

  return (
    <div>
      <TabBar
        tabs={[
          { value: "people", label: "People", to: "/team/people" },
          { value: "locations", label: "Locations", to: "/team/locations" },
        ]}
        activeTab={activeTab}
      />
      {activeTab === "people" ? (
        <Panel title="People">
          {data.people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </Panel>
      ) : (
        <Panel title="Locations">
          {data.locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </Panel>
      )}
    </div>
  );
}
