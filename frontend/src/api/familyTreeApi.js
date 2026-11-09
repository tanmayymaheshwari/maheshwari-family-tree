const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Fetches the members and relationships needed to draw the family tree.
export async function fetchFamilyTree() {
  const response = await fetch(`${API_URL}/api/family-tree`);

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  return response.json();
}
