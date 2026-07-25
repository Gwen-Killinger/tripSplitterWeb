import type { TripMember } from "./models";

const OWNER_MEMBER_INTEGRITY_ERROR =
  "Trip data is invalid: the owner member could not be identified.";

export function resolveOwnerMemberId(
  persistedOwnerMemberId: unknown,
  ownerId: unknown,
  members: TripMember[],
): string {
  if (
    typeof persistedOwnerMemberId === "string" &&
    members.some(
      (member) => member.id === persistedOwnerMemberId,
    )
  ) {
    return persistedOwnerMemberId;
  }

  if (
    typeof ownerId === "string" &&
    members.some((member) => member.id === ownerId)
  ) {
    return ownerId;
  }

  throw new Error(OWNER_MEMBER_INTEGRITY_ERROR);
}
