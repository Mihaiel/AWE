// ---------------------------------------------------------------------
// PERSON CARD - presentational, one Person prop, no state
// ---------------------------------------------------------------------
// Exercise 4, Demo 1. Same markup/classes as the vanilla renderPeople()
// in js/views/people.ts, minus the "related evidence items - view"
// link: that needs evidence.json data and cross-navigation into the
// Evidence Catalogue, which isn't migrated to React this exercise at
// all, deliberately out of scope rather than half-wired to nothing.
//
// Demo 9: the name is now a real link to this person's own route,
// /team/people/:personId (PersonDetailPage.tsx), not a plain <h3>. It
// renders this same card there too, so clicking the name on that page
// just links to itself, a harmless no-op, not worth a prop to special
// -case away.
import { Link } from "react-router-dom";
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
          <h3>
            <Link to={`/team/people/${person.id}`}>{person.name}</Link>
          </h3>
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
