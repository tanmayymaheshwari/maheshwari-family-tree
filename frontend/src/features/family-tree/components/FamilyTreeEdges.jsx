// Draws a horizontal connector between members of a couple.
export function SpouseStraightEdge({ sourceX, sourceY, targetX, targetY, style }) {
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

// Draws a shared parent-to-children branch with a single horizontal junction.
export function FamilyBranchEdge({ data, style }) {
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
