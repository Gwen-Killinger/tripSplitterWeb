import { describe, expect, it } from "vitest";
import { calculateSettlements } from "./calculateSettlements";
import type { MemberBalance } from "./models";

describe("calculateSettlements", () => {
  it("creates payments for one creditor and two debtors", () => {
    const balances: MemberBalance[] = [
      {
        memberId: "gwen",
        paidCents: 20000,
        owedCents: 0,
        balanceCents: 20000,
      },
      {
        memberId: "alex",
        paidCents: 0,
        owedCents: 10000,
        balanceCents: -10000,
      },
      {
        memberId: "sarah",
        paidCents: 0,
        owedCents: 10000,
        balanceCents: -10000,
      },
    ];

    expect(calculateSettlements(balances)).toEqual([
      {
        fromMemberId: "alex",
        toMemberId: "gwen",
        amountCents: 10000,
      },
      {
        fromMemberId: "sarah",
        toMemberId: "gwen",
        amountCents: 10000,
      },
    ]);
  });

  it("splits one debtor payment across multiple creditors", () => {
    const balances: MemberBalance[] = [
      {
        memberId: "gwen",
        paidCents: 5000,
        owedCents: 0,
        balanceCents: 5000,
      },
      {
        memberId: "alex",
        paidCents: 3000,
        owedCents: 0,
        balanceCents: 3000,
      },
      {
        memberId: "sarah",
        paidCents: 0,
        owedCents: 8000,
        balanceCents: -8000,
      },
    ];

    expect(calculateSettlements(balances)).toEqual([
      {
        fromMemberId: "sarah",
        toMemberId: "gwen",
        amountCents: 5000,
      },
      {
        fromMemberId: "sarah",
        toMemberId: "alex",
        amountCents: 3000,
      },
    ]);
  });

  it("handles several debtors and creditors", () => {
    const balances: MemberBalance[] = [
      {
        memberId: "gwen",
        paidCents: 7000,
        owedCents: 0,
        balanceCents: 7000,
      },
      {
        memberId: "alex",
        paidCents: 3000,
        owedCents: 0,
        balanceCents: 3000,
      },
      {
        memberId: "sarah",
        paidCents: 0,
        owedCents: 5000,
        balanceCents: -5000,
      },
      {
        memberId: "john",
        paidCents: 0,
        owedCents: 5000,
        balanceCents: -5000,
      },
    ];

    expect(calculateSettlements(balances)).toEqual([
      {
        fromMemberId: "sarah",
        toMemberId: "gwen",
        amountCents: 5000,
      },
      {
        fromMemberId: "john",
        toMemberId: "gwen",
        amountCents: 2000,
      },
      {
        fromMemberId: "john",
        toMemberId: "alex",
        amountCents: 3000,
      },
    ]);
  });

  it("returns no settlements when everyone is settled", () => {
    const balances: MemberBalance[] = [
      {
        memberId: "gwen",
        paidCents: 1000,
        owedCents: 1000,
        balanceCents: 0,
      },
      {
        memberId: "alex",
        paidCents: 500,
        owedCents: 500,
        balanceCents: 0,
      },
    ];

    expect(calculateSettlements(balances)).toEqual([]);
  });

  it("ignores members with zero balances", () => {
    const balances: MemberBalance[] = [
      {
        memberId: "gwen",
        paidCents: 5000,
        owedCents: 0,
        balanceCents: 5000,
      },
      {
        memberId: "alex",
        paidCents: 0,
        owedCents: 5000,
        balanceCents: -5000,
      },
      {
        memberId: "sarah",
        paidCents: 2000,
        owedCents: 2000,
        balanceCents: 0,
      },
    ];

    expect(calculateSettlements(balances)).toEqual([
      {
        fromMemberId: "alex",
        toMemberId: "gwen",
        amountCents: 5000,
      },
    ]);
  });

  it("settles every positive and negative balance completely", () => {
    const balances: MemberBalance[] = [
      {
        memberId: "gwen",
        paidCents: 6500,
        owedCents: 0,
        balanceCents: 6500,
      },
      {
        memberId: "alex",
        paidCents: 2500,
        owedCents: 0,
        balanceCents: 2500,
      },
      {
        memberId: "sarah",
        paidCents: 0,
        owedCents: 4000,
        balanceCents: -4000,
      },
      {
        memberId: "john",
        paidCents: 0,
        owedCents: 5000,
        balanceCents: -5000,
      },
    ];

    const settlements = calculateSettlements(balances);

    const totalPayments = settlements.reduce(
      (total, settlement) => total + settlement.amountCents,
      0,
    );

    const totalPositiveBalances = balances
      .filter((balance) => balance.balanceCents > 0)
      .reduce(
        (total, balance) => total + balance.balanceCents,
        0,
      );

    const totalNegativeBalances = balances
      .filter((balance) => balance.balanceCents < 0)
      .reduce(
        (total, balance) => total + Math.abs(balance.balanceCents),
        0,
      );

    expect(totalPayments).toBe(totalPositiveBalances);
    expect(totalPayments).toBe(totalNegativeBalances);
  });

  it("does not mutate the original balances", () => {
    const balances: MemberBalance[] = [
      {
        memberId: "gwen",
        paidCents: 5000,
        owedCents: 0,
        balanceCents: 5000,
      },
      {
        memberId: "alex",
        paidCents: 0,
        owedCents: 5000,
        balanceCents: -5000,
      },
    ];

    const originalBalances = structuredClone(balances);

    calculateSettlements(balances);

    expect(balances).toEqual(originalBalances);
  });
});