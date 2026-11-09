import FamilyTreeCanvas from "./FamilyTreeCanvas.jsx";

// Frames the interactive graph with its live-status label and usage hint.
export default function FamilyTreeWorkspace({ nodes, edges, onMemberSelect }) {
  return (
    <section className="tree-workspace">
      <div className="canvas-label">
        <span className="status-dot" />
        FAMILY GRAPH
      </div>

      <FamilyTreeCanvas
        nodes={nodes}
        edges={edges}
        onNodeClick={onMemberSelect}
      />

      <div className="canvas-hint">
        DRAG TO MOVE <span>·</span> SCROLL TO ZOOM <span>·</span> SELECT A MEMBER
      </div>
    </section>
  );
}
