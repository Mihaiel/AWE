// ---------------------------------------------------------------------
// LOCATION CARD - presentational, one Location prop, no state
// ---------------------------------------------------------------------
// Exercise 4, Demo 1. Same markup/classes as the vanilla renderLocations()
// in js/views/people.ts.
import type { Location } from "../../types.js";

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  return (
    <div className="location-card">
      <h3>
        {location.id} &mdash; {location.name}
      </h3>
      <p>{location.description}</p>
      <p>
        <strong>Contains:</strong>
      </p>
      <ul>
        {location.contains.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
