import { formatDate, getAge, getFullName } from "../utils/memberFormatters.js";

// Shows the selected member's details in an overlay panel.
export default function ProfilePanel({ member, onClose }) {
  const age = getAge(member);

  return (
    <aside className="profile-panel">
      <button
        className="panel-close"
        type="button"
        onClick={onClose}
        aria-label="Close profile"
      >
        ×
      </button>

      <div className="panel-kicker">FAMILY PROFILE</div>

      <div className="panel-photo">
        {member.photo_url ? (
          <img src={member.photo_url} alt={getFullName(member)} />
        ) : (
          <span>{member.first_name?.charAt(0)?.toUpperCase() || "?"}</span>
        )}
      </div>

      <h2>{getFullName(member)}</h2>

      {member.alias_name && <p className="panel-alias">“{member.alias_name}”</p>}

      <div className="profile-details">
        <div>
          <span>DATE OF BIRTH</span>
          <strong>{formatDate(member.date_of_birth) || "Unknown"}</strong>
        </div>
        <div>
          <span>{member.date_of_death ? "DATE OF DEATH" : "AGE"}</span>
          <strong>
            {member.date_of_death
              ? formatDate(member.date_of_death) || "Unknown"
              : age !== null
                ? `${age} years`
                : "Unknown"}
          </strong>
        </div>
        <div>
          <span>STATUS</span>
          <strong>{member.date_of_death ? "Deceased" : "Living"}</strong>
        </div>
      </div>

      {member.bio && <p className="panel-bio">{member.bio}</p>}

      <div className="panel-note">
        Click another person on the graph to explore their connections.
      </div>
    </aside>
  );
}
