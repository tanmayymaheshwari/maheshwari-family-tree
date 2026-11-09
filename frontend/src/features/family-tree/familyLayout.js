
const CARD_WIDTH = 224;
const CARD_HEIGHT = 112;
const SPOUSE_GAP = 24;
const UNIT_GAP = 90;
const GENERATION_GAP = 210;

const PARENT_TYPES = new Set(["FATHER", "MOTHER"]);
const SPOUSE_TYPES = new Set(["HUSBAND", "WIFE"]);

// Produces a stable name used to order members and couple units.
function getName(member) {
  return [member?.first_name, member?.last_name]
    .filter(Boolean)
    .join(" ");
}

// Removes duplicate identifiers while preserving their first occurrence.
function unique(values) {
  return [...new Set(values)];
}

// Calculates member positions and connector definitions for the family graph.
export function buildFamilyLayout(members, relationships) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const parentIds = new Map(members.map((m) => [m.id, new Set()]));
  const childIds = new Map(members.map((m) => [m.id, new Set()]));
  const spouseIds = new Map(members.map((m) => [m.id, new Set()]));
  const spouseRole = new Map();

  for (const rel of relationships) {
    const { member_id, related_member_id, relationship_type } = rel;

    if (
      !memberMap.has(member_id) ||
      !memberMap.has(related_member_id) ||
      member_id === related_member_id
    ) {
      continue;
    }

    if (PARENT_TYPES.has(relationship_type)) {
      parentIds.get(related_member_id).add(member_id);
      childIds.get(member_id).add(related_member_id);
    }

    if (SPOUSE_TYPES.has(relationship_type)) {
      spouseIds.get(member_id).add(related_member_id);
      spouseIds.get(related_member_id).add(member_id);

      if (!spouseRole.has(member_id)) {
        spouseRole.set(member_id, relationship_type);
      }
    }
  }

  // Creates couple units while keeping the core member on the left.
  const couples = [];
  const coupleOf = new Map();

  for (const member of members) {
    if (coupleOf.has(member.id)) continue;

    const spouseId = [...spouseIds.get(member.id)]
      .filter((id) => !coupleOf.has(id))
      .sort((a, b) =>
        getName(memberMap.get(a)).localeCompare(
          getName(memberMap.get(b))
        )
      )[0];

    let memberIds = spouseId
      ? [member.id, spouseId]
      : [member.id];

    if (spouseId) {
      const [a, b] = memberIds;
      const aHasParents = parentIds.get(a).size > 0;
      const bHasParents = parentIds.get(b).size > 0;

      if (aHasParents !== bHasParents) {
        memberIds = aHasParents ? [a, b] : [b, a];
      } else {
        const aRole = spouseRole.get(a);
        const bRole = spouseRole.get(b);

        if (aRole === "WIFE" && bRole === "HUSBAND") {
          memberIds = [b, a];
        } else if (bRole === "WIFE" && aRole === "HUSBAND") {
          memberIds = [a, b];
        }
      }
    }

    const couple = {
      id: `couple-${couples.length}`,
      memberIds,
    };

    couples.push(couple);
    memberIds.forEach((id) => coupleOf.set(id, couple.id));
  }

  const coupleMap = new Map(couples.map((c) => [c.id, c]));

  // Calculates biological generations while guarding against cyclic records.
  const generation = new Map();
  const visiting = new Set();

  // Resolves a member's generation from the deepest recorded parent.
  function getGeneration(id) {
    if (generation.has(id)) return generation.get(id);
    if (visiting.has(id)) return 0;

    visiting.add(id);

    const parents = [...parentIds.get(id)];
    const level = parents.length
      ? Math.max(...parents.map(getGeneration)) + 1
      : 0;

    visiting.delete(id);
    generation.set(id, level);

    return level;
  }

  members.forEach((member) => getGeneration(member.id));

  // Aligns spouses without recorded parents to their partner's generation.
  for (let pass = 0; pass < members.length; pass++) {
    let changed = false;

    for (const couple of couples) {
      const sharedLevel = Math.max(
        ...couple.memberIds.map((id) => generation.get(id) ?? 0)
      );

      for (const id of couple.memberIds) {
        if (
          parentIds.get(id).size === 0 &&
          generation.get(id) !== sharedLevel
        ) {
          generation.set(id, sharedLevel);
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  const levels = new Map();

  for (const couple of couples) {
    couple.level = Math.max(
      ...couple.memberIds.map((id) => generation.get(id) ?? 0)
    );

    if (!levels.has(couple.level)) {
      levels.set(couple.level, []);
    }

    levels.get(couple.level).push(couple);
  }

  // Measures the width occupied by a single-member or couple layout unit.
  const unitWidth = (couple) =>
    couple.memberIds.length * CARD_WIDTH +
    Math.max(0, couple.memberIds.length - 1) * SPOUSE_GAP;

  const positions = new Map();

  for (const [level, coupleList] of levels) {
    // Sorts generation peers by parent group before their display names.
    const parentKey = (couple) => {
      const ids = new Set();

      for (const id of couple.memberIds) {
        for (const parentId of parentIds.get(id)) {
          ids.add(coupleOf.get(parentId));
        }
      }

      return [...ids].sort().join("|");
    };

    coupleList.sort((a, b) => {
      const aKey = parentKey(a);
      const bKey = parentKey(b);

      if (aKey !== bKey) {
        return aKey.localeCompare(bKey);
      }

      return getName(memberMap.get(a.memberIds[0])).localeCompare(
        getName(memberMap.get(b.memberIds[0]))
      );
    });

    const totalWidth =
      coupleList.reduce((sum, couple) => sum + unitWidth(couple), 0) +
      Math.max(0, coupleList.length - 1) * UNIT_GAP;

    let x = -totalWidth / 2;

    for (const couple of coupleList) {
      couple.memberIds.forEach((id, index) => {
        positions.set(id, {
          x: x + index * (CARD_WIDTH + SPOUSE_GAP),
          y: level * GENERATION_GAP,
        });
      });

      x += unitWidth(couple) + UNIT_GAP;
    }
  }

  const edges = [];
  const seenSpouses = new Set();
  const parentGroups = new Map();

  // Groups children by biological parents while excluding each child's spouse.
  for (const member of members) {
    const parents = [...parentIds.get(member.id)];
    if (!parents.length) continue;

    const parentCoupleIds = unique(
      parents.map((id) => coupleOf.get(id)).filter(Boolean)
    ).sort();

    const groupKey = parentCoupleIds.join("|");

    if (!parentGroups.has(groupKey)) {
      parentGroups.set(groupKey, {
        key: groupKey,
        parents,
        childIds: new Set(),
      });
    }

    parentGroups.get(groupKey).childIds.add(member.id);
  }

  for (const group of parentGroups.values()) {
    const parentCoupleIds = unique(
      group.parents.map((id) => coupleOf.get(id)).filter(Boolean)
    );

    // Uses both members of one recorded parent couple when available.
    const parentCouple =
      parentCoupleIds.length === 1
        ? coupleMap.get(parentCoupleIds[0])
        : null;

    const parentMemberIds = parentCouple
      ? parentCouple.memberIds
      : group.parents;

    const parentCards = parentMemberIds
      .map((id) => positions.get(id))
      .filter(Boolean);

    if (!parentCards.length) continue;

    let parentCenterX;
    let parentCenterY;

    if (parentCards.length >= 2) {
      // Anchors branches at the midpoint of the horizontal marriage line.
      const leftCard = parentCards.reduce((left, card) =>
        card.x < left.x ? card : left
      );

      const rightCard = parentCards.reduce((right, card) =>
        card.x > right.x ? card : right
      );

      parentCenterX =
        (leftCard.x + CARD_WIDTH + rightCard.x) / 2;

      parentCenterY = leftCard.y + CARD_HEIGHT / 2;
    } else {
      // Anchors a single-parent branch at the card's bottom center.
      parentCenterX = parentCards[0].x + CARD_WIDTH / 2;
      parentCenterY = parentCards[0].y + CARD_HEIGHT;
    }

    // Uses biological children only to calculate branch width and center.
    const childNodes = [...group.childIds]
      .map((id) => {
        const position = positions.get(id);
        if (!position) return null;

        return {
          id,
          center: position.x + CARD_WIDTH / 2,
          top: position.y,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.center - b.center);

    if (!childNodes.length) continue;

    const firstChild = childNodes[0];
    const lastChild = childNodes[childNodes.length - 1];

    const childTopY = Math.min(...childNodes.map((child) => child.top));

    // Leaves room below parents before drawing the horizontal child branch.
    const junctionY = Math.max(
      parentCenterY + 38,
      childTopY - 38
    );

    edges.push({
      id: `branch-${group.key}`,
      type: "familyBranch",
      source: parentMemberIds[0],
      target: firstChild.id,
      data: {
        parentCenterX,
        parentCenterY,
        junctionY,
        childCenters: childNodes.map((child) => child.center),
        branchLeft: Math.min(parentCenterX, firstChild.center),
        branchRight: Math.max(parentCenterX, lastChild.center),
        childTopY,
      },
      className: "family-edge",
      style: {
        stroke: "#287d91",
        strokeWidth: 1.6,
      },
    });
  }

  // Adds horizontal spouse connectors independently from family branches.
  for (const couple of couples) {
    if (couple.memberIds.length < 2) continue;

    const [coreId, spouseId] = couple.memberIds;
    const key = [coreId, spouseId].sort().join("|");

    if (seenSpouses.has(key)) continue;
    seenSpouses.add(key);

    edges.push({
      id: `spouse-${key}`,
      type: "spouseStraight",
      source: coreId,
      target: spouseId,
      className: "spouse-edge",
      style: {
        stroke: "#7867a8",
        strokeWidth: 1.6,
      },
      sourceHandle: "right",
      targetHandle: "left",
    });
  }

  return {
    positions,
    edges,
    memberMap,
    parentIds,
    childIds,
    spouseIds,
    generation,
    CARD_WIDTH,
    CARD_HEIGHT,
  };
}
