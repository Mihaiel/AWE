// ---------------------------------------------------------------------
// PERSON CARD - presentational, one Person prop, no state
// ---------------------------------------------------------------------
// Exercise 4, Demo 1. Same markup/classes as the vanilla renderPeople()
// in js/views/people.ts, minus the "related evidence items - view"
// link: that needs evidence.json data and cross-navigation into the
// Evidence Catalogue, which isn't migrated to React this exercise at
// all, deliberately out of scope rather than half-wired to nothing.
import type { Person } from "../../types.js";

interface PersonCardProps {
  person: Person;
}

export default function PersonCard({ person }: PersonCardProps) {
  return (
    <div className="person-card">
      <div className="person-card-header">
        <img className="person-avatar" src={person.avatar} alt={`Portrait of ${person.name}`} />
        <div>
          <h3>{person.name}</h3>
          <div className="person-role">{person.role}</div>
        </div>
      </div>
      <p>
        <strong>Speciality:</strong> {person.speciality}
      </p>
      <ul>
        {person.responsibilities.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="person-statement">&ldquo;{person.statement}&rdquo;</div>
    </div>
  );
}
