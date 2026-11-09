import { getFullName } from "../utils/memberFormatters.js";

// Provides the tree introduction and member search controls.
export default function FamilyTreeHeading({
  search,
  searchResults,
  onSearchChange,
  onMemberSelect,
}) {
  return (
    <section className="tree-heading">
      <div>
        <h1>
          Generations, <span>connected.</span>
        </h1>
        <p>Explore the people and relationships that shape our extended family.</p>
      </div>

      <div className="search-wrap">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search family member..."
          aria-label="Search family members"
        />

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onMemberSelect(member)}
              >
                <span>{getFullName(member)}</span>
                <small>{member.alias_name}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
