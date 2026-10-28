import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

import { buildFamilyLayout } from "./features/family-tree/familyLayout.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getFullName(member) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ");
}

function getAge(member) {
  if (!member.date_of_birth) return null;

  const birth = new Date(member.date_of_birth);
  const end = member.date_of_death
    ? new Date(member.date_of_death)
    : new Date();

  let age = end.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    end.getMonth() < birth.getMonth() ||
    (end.getMonth() === birth.getMonth() &&
      end.getDate() < birth.getDate());

  if (beforeBirthday) age--;
  return age >= 0 ? age : null;
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function MemberNode({ data }) {
  const { member, selected, dimmed, onSelect } = data;
  const name = getFullName(member);
  const age = getAge(member);

  return (
    <>
      <Handle type="target" position={Position.Top} className="tree-handle" />

      <button
        type="button"
        className={[
          "member-card",
          member.date_of_death ? "deceased" : "living",
          selected ? "selected" : "",
          dimmed ? "dimmed" : "",
        ].join(" ")}
        onClick={() => onSelect(member)}
        title={`View details for ${name}`}
      >
        <div className="member-photo">
          {member.photo_url ? (
            <img src={member.photo_url} alt={name} />
          ) : (
            <span>
              {member.first_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          )}
          <span className="life-indicator" />
        </div>

        <div className="member-info">
          <div className="member-name">{name}</div>

          <div className="member-date">
            {formatDate(member.date_of_birth)
              ? `Born ${formatDate(member.date_of_birth)}`
              : "Birth date unknown"}
          </div>

          <div className="member-age">
            {member.date_of_death
              ? `Died ${formatDate(member.date_of_death) || "date unknown"}`
              : age !== null
                ? `${age} years old`
                : "Living"}
          </div>
        </div>
      </button>

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="tree-handle"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="tree-handle"
      />

      
    </>
  );
}


function SpouseStraightEdge({ sourceX, sourceY, targetX, targetY, style }) {
  // The couple ordering ensures the core member is on the left.
  const middleY = (sourceY + targetY) / 2;

  return (
    <path
      d={`M ${sourceX} ${middleY} L ${targetX} ${middleY}`}
      fill="none"
      stroke={style?.stroke || "#7867a8"}
      strokeWidth={style?.strokeWidth || 1.6}
    />
  );
}


function FamilyBranchEdge({ data, style }) {
  const {
    parentCenterX,
    parentCenterY,
    junctionY,
    childCenters,
    branchLeft,
    branchRight,
    childTopY,
  } = data;

  const path = [
    `M ${parentCenterX} ${parentCenterY}`,
    `L ${parentCenterX} ${junctionY}`,
    `M ${branchLeft} ${junctionY}`,
    `L ${branchRight} ${junctionY}`,
    ...childCenters.map(
      (center) => `M ${center} ${junctionY} L ${center} ${childTopY}`
    ),
  ].join(" ");

  return (
    <path
      d={path}
      fill="none"
      stroke={style?.stroke ?? "#287d91"}
      strokeWidth={style?.strokeWidth ?? 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

const edgeTypes = {
  spouseStraight: SpouseStraightEdge,
  familyBranch: FamilyBranchEdge,
};

const nodeTypes = { member: MemberNode };

function buildTree(members, relationships, onSelect, selectedId) {
  const layout = buildFamilyLayout(members, relationships);
  const { positions, edges, parentIds, childIds, spouseIds } = layout;

  const relatedToSelected = new Set();

  if (selectedId) {
    relatedToSelected.add(selectedId);

    [
      ...(parentIds.get(selectedId) || []),
      ...(childIds.get(selectedId) || []),
      ...(spouseIds.get(selectedId) || []),
    ].forEach((id) => relatedToSelected.add(id));
  }

  const nodes = members.map((member) => ({
    id: member.id,
    type: "member",
    position: positions.get(member.id) || { x: 0, y: 0 },
    data: {
      member,
      selected: selectedId === member.id,
      dimmed: Boolean(selectedId) && !relatedToSelected.has(member.id),
      onSelect,
    },
  }));

  const highlightedEdges = edges.map((edge) => {
    const highlighted =
      selectedId &&
      (relatedToSelected.has(edge.source) ||
        relatedToSelected.has(edge.target));

    return {
      ...edge,
      animated: Boolean(highlighted),
      className: `${edge.className || ""} ${
        highlighted ? "edge-highlighted" : ""
      }`,
      style: {
        ...edge.style,
        stroke: highlighted
          ? edge.className?.includes("spouse-edge")
            ? "#c4b5fd"
            : "#67e8f9"
          : edge.style?.stroke,
        strokeWidth: highlighted ? 2.5 : edge.style?.strokeWidth,
      },
    };
  });

  return { nodes, edges: highlightedEdges };
}


function TreeCanvas({ nodes, edges, onNodeClick }) {
  const { fitView } = useReactFlow();

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onNodeClick(node.data.member)}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.15}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant="lines"
          gap={32}
          size={1}
          color="#173342"
        />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) =>
            node.data?.member?.date_of_death ? "#7867a8" : "#3cbdca"
          }
          maskColor="rgba(3, 10, 20, 0.75)"
        />
      </ReactFlow>

      <button
        type="button"
        className="fit-button"
        onClick={() => fitView({ padding: 0.25, duration: 500 })}
      >
        Fit family tree
      </button>
    </>
  );
}

export default function App() {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  const handleSelect = useCallback((member) => {
    setSelectedMember(member);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTree() {
      try {
        const response = await fetch(`${API_URL}/api/family-tree`);

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setMembers(data.members || []);
          setRelationships(data.relationships || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            "Could not load your family tree. Make sure the backend is running."
          );
          console.error("Family tree load failed:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTree();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeId = selectedMember?.id || null;

  const { nodes, edges } = useMemo(
    () => buildTree(members, relationships, handleSelect, activeId),
    [members, relationships, handleSelect, activeId]
  );

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    return members.filter((member) =>
      `${getFullName(member)} ${member.alias_name || ""}`
        .toLowerCase()
        .includes(term)
    ).slice(0, 6);
  }, [members, search]);

  const focusMember = useCallback((member) => {
    setSelectedMember(member);
    setSearch("");
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <div className="brand-title">KINSHIP</div>
            <div className="brand-subtitle">YOUR FAMILY, CONNECTED</div>
          </div>
        </div>

        <div className="tree-stats">
          <span><strong>{members.length}</strong> MEMBERS</span>
          <span><strong>{relationships.length}</strong> CONNECTIONS</span>
        </div>
      </header>

      <section className="tree-heading">
        <div>
          <div className="eyebrow">FAMILY ARCHIVE / INTERACTIVE VIEW</div>
          <h1>Generations, <span>connected.</span></h1>
          <p>Explore the people and relationships that shape your family.</p>
        </div>

        <div className="search-wrap">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or alias..."
            aria-label="Search family members"
          />

          {filteredMembers.length > 0 && (
            <div className="search-results">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => focusMember(member)}
                >
                  <span>{getFullName(member)}</span>
                  <small>{member.alias_name || "Family member"}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="status-message">Connecting to your family archive...</div>
      ) : error ? (
        <div className="status-message error-message">{error}</div>
      ) : members.length === 0 ? (
        <div className="status-message">No family members found yet.</div>
      ) : (
        <section className="tree-workspace">
          <div className="canvas-label">
            <span className="status-dot" />
            LIVE FAMILY GRAPH
          </div>

          <ReactFlowProviderWrapper
            nodes={nodes}
            edges={edges}
            onNodeClick={handleSelect}
          />

          <div className="canvas-hint">
            DRAG TO PAN <span>·</span> SCROLL TO ZOOM <span>·</span> SELECT A MEMBER
          </div>
        </section>
      )}

      {selectedMember && (
        <aside className="profile-panel">
          <button
            className="panel-close"
            type="button"
            onClick={() => setSelectedMember(null)}
            aria-label="Close profile"
          >
            ×
          </button>

          <div className="panel-kicker">FAMILY PROFILE</div>

          <div className="panel-photo">
            {selectedMember.photo_url ? (
              <img
                src={selectedMember.photo_url}
                alt={getFullName(selectedMember)}
              />
            ) : (
              <span>
                {selectedMember.first_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>

          <h2>{getFullName(selectedMember)}</h2>

          {selectedMember.alias_name && (
            <p className="panel-alias">“{selectedMember.alias_name}”</p>
          )}

          <div className="profile-details">
            <div>
              <span>DATE OF BIRTH</span>
              <strong>{formatDate(selectedMember.date_of_birth) || "Unknown"}</strong>
            </div>
            <div>
              <span>{selectedMember.date_of_death ? "DATE OF DEATH" : "AGE"}</span>
              <strong>
                {selectedMember.date_of_death
                  ? formatDate(selectedMember.date_of_death) || "Unknown"
                  : getAge(selectedMember) !== null
                    ? `${getAge(selectedMember)} years`
                    : "Unknown"}
              </strong>
            </div>
            <div>
              <span>STATUS</span>
              <strong>
                {selectedMember.date_of_death ? "Deceased" : "Living"}
              </strong>
            </div>
          </div>

          {selectedMember.bio && (
            <p className="panel-bio">{selectedMember.bio}</p>
          )}

          <div className="panel-note">
            Click another person on the graph to explore their connections.
          </div>
        </aside>
      )}
    </main>
  );
}

function ReactFlowProviderWrapper(props) {
  return (
    <ReactFlowProvider>
      <TreeCanvas {...props} />
    </ReactFlowProvider>
  );
}
