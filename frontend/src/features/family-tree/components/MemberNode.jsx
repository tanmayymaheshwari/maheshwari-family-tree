
import {
  Handle,
  Position,
  useNodeConnections,
} from "@xyflow/react";

import {
  formatDate,
  getAge,
  getFullName,
} from "../utils/memberFormatters.js";

// Renders one selectable family-member card inside the React Flow canvas.
export default function MemberNode({ data }) {
  const { member, selected, dimmed, onSelect, hasParentConnection } = data;

  const name = getFullName(member);
  const age = getAge(member);
  const isDeceased = Boolean(member.date_of_death);

  // Check active connections for each handle
  const leftConnections = useNodeConnections({
    handleType: "target",
    handleId: "left",
  });

  const rightConnections = useNodeConnections({
    handleType: "source",
    handleId: "right",
  });

  return (
    <>

      {/* MEMBER CARD */}
      <button
        type="button"
        className={[
          "member-card",
          isDeceased ? "deceased" : "living",
          selected ? "selected" : "",
          dimmed ? "dimmed" : "",
        ].join(" ")}
        onClick={() => onSelect(member)}
        title={`View details for ${name}`}
      >
        {/* MEMBER PHOTO */}
        <div className="member-photo">
          {member.photo_url ? (
            <img src={member.photo_url} alt={name} />
          ) : (
            <span>
              {member.first_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          )}
        </div>

        {/* MEMBER INFO */}
        <div className="member-info">
          <div className="member-name">
            {name.replaceAll(" ", "\n")}
          </div>

          {/* DOB and DOD */}
          <div className="member-date">
            {formatDate(member.date_of_birth) ? (
              <>
                Birth{" "}
                <strong>
                  {formatDate(member.date_of_birth)}
                </strong>
              </>
            ) : (
              "Birth date unknown"
            )}

            <br />

            {formatDate(member.date_of_death) ? (
              <>
                Death{" "}
                <strong>
                  {formatDate(member.date_of_death)}
                </strong>
              </>
            ) : (
              ""
            )}
          </div>

          {/* AGE */}
          <div className="member-age">
            {isDeceased ? (
              <div style={{ marginTop: "4px" }}>
                (Aged {age !== null ? `${age} years` : "unknown"})
              </div>
            ) : age !== null ? (
              `${age} years old`
            ) : (
              "Living"
            )}
          </div>

        </div>
      </button>

      {/* TOP HANDLE --- uses hasParentConnection because Top Handle is singleton for a set of parents*/}
      {hasParentConnection  && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="tree-handle"
        />
      )}

      {/* LEFT HANDLE */}
      {leftConnections.length > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="tree-handle"
        />
      )}

      {/* RIGHT HANDLE */}
      {rightConnections.length > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="tree-handle"
        />
      )}
    </>
  );
}
