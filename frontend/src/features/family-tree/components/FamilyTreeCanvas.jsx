import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";

import MemberNode from "./MemberNode.jsx";
import { FamilyBranchEdge, SpouseStraightEdge } from "./FamilyTreeEdges.jsx";

const nodeTypes = { member: MemberNode };
const edgeTypes = {
  spouseStraight: SpouseStraightEdge,
  familyBranch: FamilyBranchEdge,
};

// Renders the interactive React Flow graph and its viewport controls.
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
        <Background variant="lines" gap={32} size={1} color="#173342" />
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
        Fit in frame
      </button>
    </>
  );
}

// Supplies React Flow context to the isolated family-tree canvas.
export default function FamilyTreeCanvas(props) {
  return (
    <ReactFlowProvider>
      <TreeCanvas {...props} />
    </ReactFlowProvider>
  );
}
