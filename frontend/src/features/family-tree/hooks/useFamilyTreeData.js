import { useEffect, useState } from "react";

import { fetchFamilyTree } from "../../../api/familyTreeApi.js";

// Loads the initial tree dataset and exposes its request state to the page.
export function useFamilyTreeData() {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTree() {
      try {
        const data = await fetchFamilyTree();

        if (!cancelled) {
          setMembers(data.members || []);
          setRelationships(data.relationships || []);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            "Could not load your family tree. Make sure the backend is running."
          );
          console.error("Family tree load failed:", requestError);
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

  return { members, relationships, loading, error };
}
