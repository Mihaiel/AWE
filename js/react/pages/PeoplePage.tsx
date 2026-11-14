// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS PAGE - real content, Exercise 4 Demo 1
// ---------------------------------------------------------------------
// No tab toggle yet, both lists just render one after another. Switching
// between them (the vanilla app's active-tab behavior) needs conditional
// rendering + a bit of state, that's Demo 2's job, not this one. Fetches
// its own data the same way Exercise 3 Demo 10's DashboardPage does,
// same known placeholder: fine for migrating one view, a shared data
// layer is still the real architecture once more views move over.
import { useEffect, useState } from "react";
import type { Person, Location } from "../../types.js";
import PersonCard from "../components/PersonCard.js";
import LocationCard from "../components/LocationCard.js";
import Panel from "../components/Panel.js";

interface PeopleLocationsData {
  people: Person[];
  locations: Location[];
}

export default function PeoplePage() {
  const [data, setData] = useState<PeopleLocationsData | null>(null);

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
      <Panel title="People">
        {data.people.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </Panel>
      <Panel title="Locations">
        {data.locations.map((location) => (
          <LocationCard key={location.id} location={location} />
        ))}
      </Panel>
    </div>
  );
}
