import { describe, expect, it } from "vitest";

import { calculateBalances } from "./calculateBalances";

const members = [
  {
    id: "gwen",
    displayName: "Gwen",
  },
  {
    id: "alex",
    displayName: "Alex",
  },
  {
    id: "sarah",
    displayName: "Sarah",
  },
];

describe("calculateBalances", () => {
  it("calculates balances correctly", () => {
    const expenses = [
      {
        id: "hotel",
        description: "",
        amountCents: 30000,
        expenseDate: "",
        paidByMemberId: "gwen",
        participantMemberIds: [
          "gwen",
          "alex",
          "sarah",
        ],
        splitMode: "equal" as const,
        splits: [
          { memberId: "gwen", shareCents: 10000 },
          { memberId: "alex", shareCents: 10000 },
          { memberId: "sarah", shareCents: 10000 },
        ],
      },
    ];

    expect(
      calculateBalances(members, expenses),
    ).toEqual([
      {
        memberId: "gwen",
        paidCents: 30000,
        owedCents: 10000,
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
    ]);
  });

  it("always sums balances to zero", () => {
    const expenses = [
      {
        id: "1",
        description: "",
        amountCents: 1000,
        expenseDate: "",
        paidByMemberId: "alex",
        participantMemberIds: [
          "gwen",
          "alex",
        ],
        splitMode: "equal" as const,
        splits: [
          {
            memberId: "gwen",
            shareCents: 500,
          },
          {
            memberId: "alex",
            shareCents: 500,
          },
        ],
      },
    ];

    const balances =
      calculateBalances(members, expenses);

    expect(
      balances.reduce(
        (sum, b) => sum + b.balanceCents,
        0,
      ),
    ).toBe(0);
  });

  it("works with no expenses", () => {
    expect(
      calculateBalances(members, []),
    ).toEqual([
      {
        memberId: "gwen",
        paidCents: 0,
        owedCents: 0,
        balanceCents: 0,
      },
      {
        memberId: "alex",
        paidCents: 0,
        owedCents: 0,
        balanceCents: 0,
      },
      {
        memberId: "sarah",
        paidCents: 0,
        owedCents: 0,
        balanceCents: 0,
      },
    ]);
  });

  it("uses canonical shares from custom split modes", () => {
    const expenses = [
      {
        id: "custom",
        description: "",
        amountCents: 1000,
        expenseDate: "",
        paidByMemberId: "gwen",
        participantMemberIds: ["alex", "sarah"],
        splitMode: "percentage" as const,
        splits: [
          {
            memberId: "alex",
            shareCents: 600,
            percentageBasisPoints: 6000,
          },
          {
            memberId: "sarah",
            shareCents: 400,
            percentageBasisPoints: 4000,
          },
        ],
      },
    ];

    const balances = calculateBalances(members, expenses);

    expect(
      balances.reduce(
        (total, balance) => total + balance.balanceCents,
        0,
      ),
    ).toBe(0);
    expect(balances).toEqual([
      {
        memberId: "gwen",
        paidCents: 1000,
        owedCents: 0,
        balanceCents: 1000,
      },
      {
        memberId: "alex",
        paidCents: 0,
        owedCents: 600,
        balanceCents: -600,
      },
      {
        memberId: "sarah",
        paidCents: 0,
        owedCents: 400,
        balanceCents: -400,
      },
    ]);
  });
});
