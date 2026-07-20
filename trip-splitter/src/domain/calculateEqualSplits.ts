import type { CalculatedSplit } from "./models";

export function calculateEqualSplits(
  amountCents: number,
  participantMemberIds: string[],
): CalculatedSplit[] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be a positive integer.");
  }

  if (participantMemberIds.length === 0) {
    throw new Error("At least one participant is required.");
  }

  const uniqueParticipantIds = new Set(participantMemberIds);

  if (uniqueParticipantIds.size !== participantMemberIds.length) {
    throw new Error("Participant IDs must be unique.");
  }

  const baseShareCents = Math.floor(
    amountCents / participantMemberIds.length,
  );

  const remainderCents =
    amountCents % participantMemberIds.length;

  return participantMemberIds.map((memberId, index) => ({
    memberId,
    shareCents:
      baseShareCents + (index < remainderCents ? 1 : 0),
  }));
}