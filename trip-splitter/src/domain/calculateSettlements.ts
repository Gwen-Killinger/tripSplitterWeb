import type {
  MemberBalance,
  Settlement,
} from "./models";

export function calculateSettlements(
  balances: MemberBalance[],
): Settlement[] {
  const debtors = balances
    .filter((b) => b.balanceCents < 0)
    .map((b) => ({
      memberId: b.memberId,
      remaining: -b.balanceCents,
    }));

  const creditors = balances
    .filter((b) => b.balanceCents > 0)
    .map((b) => ({
      memberId: b.memberId,
      remaining: b.balanceCents,
    }));

  const settlements: Settlement[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (
    debtorIndex < debtors.length &&
    creditorIndex < creditors.length
  ) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const payment = Math.min(
      debtor.remaining,
      creditor.remaining,
    );

    settlements.push({
      fromMemberId: debtor.memberId,
      toMemberId: creditor.memberId,
      amountCents: payment,
    });

    debtor.remaining -= payment;
    creditor.remaining -= payment;

    if (debtor.remaining === 0) {
      debtorIndex++;
    }

    if (creditor.remaining === 0) {
      creditorIndex++;
    }
  }

  return settlements;
}