import type { TripMember } from "./models";

export function validateMemberDisplayName(
  displayName: string,
  members: TripMember[],
): string {
  const trimmedDisplayName = displayName.trim();

  if (trimmedDisplayName.length === 0) {
    throw new Error("Enter a member name.");
  }

  const normalizedDisplayName =
    trimmedDisplayName.toLowerCase();

  const isDuplicate = members.some(
    (member) =>
      member.displayName.trim().toLowerCase() ===
      normalizedDisplayName,
  );

  if (isDuplicate) {
    throw new Error(
      "A member with this name already exists.",
    );
  }

  return trimmedDisplayName;
}
