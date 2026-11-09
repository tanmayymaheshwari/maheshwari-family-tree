// Builds a display-ready name from the member's available name fields.
export function getFullName(member) {
  return [member?.first_name, member?.last_name].filter(Boolean).join(" ");
}

// Calculates the current age or age at death from the member's dates.
export function getAge(member) {
  if (!member.date_of_birth) return null;

  const birth = new Date(member.date_of_birth);
  const end = member.date_of_death
    ? new Date(member.date_of_death)
    : new Date();

  let age = end.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    end.getMonth() < birth.getMonth() ||
    (end.getMonth() === birth.getMonth() && end.getDate() < birth.getDate());

  if (beforeBirthday) age--;
  return age >= 0 ? age : null;
}

// Formats ISO-like dates for a concise Indian English display.
export function formatDate(value) {
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

// Finds up to six members whose name or alias matches the search term.
export function findMatchingMembers(members, searchTerm) {
  const term = searchTerm.trim().toLowerCase();

  if (!term) return [];

  return members
    .filter((member) =>
      `${getFullName(member)} ${member.alias_name || ""}`
        .toLowerCase()
        .includes(term)
    )
    .slice(0, 6);
}
