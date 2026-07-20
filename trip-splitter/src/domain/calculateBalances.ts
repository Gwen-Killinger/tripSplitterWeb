import type {
  Expense,
  MemberBalance,
  TripMember,
} from "./models";

export function calculateBalances(
  members: TripMember[],
  expenses: Expense[],
): MemberBalance[] {
  const balances = new Map<string, MemberBalance>();

  for (const member of members) {
    balances.set(member.id, {
      memberId: member.id,
      paidCents: 0,
      owedCents: 0,
      balanceCents: 0,
    });
  }

  for (const expense of expenses) {
    const payer = balances.get(expense.paidByMemberId);

    if (!payer) {
      throw new Error(
        `Unknown payer: ${expense.paidByMemberId}`,
      );
    }

    payer.paidCents += expense.amountCents;

    for (const split of expense.splits) {
      const member = balances.get(split.memberId);

      if (!member) {
        throw new Error(
          `Unknown member: ${split.memberId}`,
        );
      }

      member.owedCents += split.shareCents;
    }
  }

  for (const member of balances.values()) {
    member.balanceCents =
      member.paidCents - member.owedCents;
  }

  return [...balances.values()];
}