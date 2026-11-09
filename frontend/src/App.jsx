import { useCallback, useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";
import "./App.css";

import AppHeader from "./components/AppHeader.jsx";
import FamilyTreeHeading from "./features/family-tree/components/FamilyTreeHeading.jsx";
import FamilyTreeWorkspace from "./features/family-tree/components/FamilyTreeWorkspace.jsx";
import ProfilePanel from "./features/family-tree/components/ProfilePanel.jsx";
import { useFamilyTreeData } from "./features/family-tree/hooks/useFamilyTreeData.js";
import { buildFamilyTreeGraph } from "./features/family-tree/utils/buildFamilyTreeGraph.js";
import { findMatchingMembers } from "./features/family-tree/utils/memberFormatters.js";

// Coordinates page-level family-tree state and composes the feature modules.
export default function App() {
  const { members, relationships, loading, error } = useFamilyTreeData();
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  // Opens the selected member's profile from the graph or search results.
  const handleSelect = useCallback((member) => {
    setSelectedMember(member);
  }, []);

  const activeId = selectedMember?.id || null;

  // Rebuilds graph data only when the tree or current selection changes.
  const { nodes, edges } = useMemo(
    () => buildFamilyTreeGraph(members, relationships, handleSelect, activeId),
    [members, relationships, handleSelect, activeId]
  );

  // Narrows searchable members without changing the graph dataset.
  const filteredMembers = useMemo(
    () => findMatchingMembers(members, search),
    [members, search]
  );

  // Focuses a search result and clears the search dropdown.
  const focusMember = useCallback((member) => {
    setSelectedMember(member);
    setSearch("");
  }, []);

  return (
    <main className="app-shell">
      <AppHeader
        memberCount={members.length}
        relationshipCount={relationships.length}
      />

      <FamilyTreeHeading
        search={search}
        searchResults={filteredMembers}
        onSearchChange={setSearch}
        onMemberSelect={focusMember}
      />

      {loading ? (
        <div className="status-message">
          Connecting to your family archive...
        </div>
      ) : error ? (
        <div className="status-message error-message">{error}</div>
      ) : members.length === 0 ? (
        <div className="status-message">No family members found yet.</div>
      ) : (
        <FamilyTreeWorkspace
          nodes={nodes}
          edges={edges}
          onMemberSelect={handleSelect}
        />
      )}

      {selectedMember && (
        <ProfilePanel
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </main>
  );
}
