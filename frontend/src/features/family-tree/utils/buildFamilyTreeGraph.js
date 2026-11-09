import { buildFamilyLayout } from "../familyLayout.js";

// Converts family records into React Flow nodes and selection-aware edges.
export function buildFamilyTreeGraph(
  members,
  relationships,
  onSelect,
  selectedId
) {
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
      (relatedToSelected.has(edge.source) || relatedToSelected.has(edge.target));

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
