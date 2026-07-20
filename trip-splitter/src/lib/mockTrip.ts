import type { Trip } from "../domain/models";

export const mockTrip: Trip = {
  id: "demo-trip",
  name: "Chicago Weekend",
  currencyCode: "USD",
  members: [
    {
      id: "member-gwen",
      displayName: "Gwen",
    },
    {
      id: "member-alex",
      displayName: "Alex",
    },
    {
      id: "member-sarah",
      displayName: "Sarah",
    },
  ],
  expenses: [
    {
      id: "expense-hotel",
      description: "Hotel",
      amountCents: 36000,
      expenseDate: "2026-07-17",
      paidByMemberId: "member-gwen",
      participantMemberIds: [
        "member-gwen",
        "member-alex",
        "member-sarah",
      ],
      splits: [
        {
          memberId: "member-gwen",
          shareCents: 12000,
        },
        {
          memberId: "member-alex",
          shareCents: 12000,
        },
        {
          memberId: "member-sarah",
          shareCents: 12000,
        },
      ],
    },
    {
      id: "expense-dinner",
      description: "Dinner",
      amountCents: 8450,
      expenseDate: "2026-07-18",
      paidByMemberId: "member-alex",
      participantMemberIds: [
        "member-gwen",
        "member-alex",
        "member-sarah",
      ],
      splits: [
        {
          memberId: "member-gwen",
          shareCents: 2817,
        },
        {
          memberId: "member-alex",
          shareCents: 2817,
        },
        {
          memberId: "member-sarah",
          shareCents: 2816,
        },
      ],
      notes: "Pizza and drinks",
    },
    {
      id: "expense-parking",
      description: "Parking",
      amountCents: 2400,
      expenseDate: "2026-07-18",
      paidByMemberId: "member-sarah",
      participantMemberIds: ["member-gwen", "member-sarah"],
      splits: [
        {
          memberId: "member-gwen",
          shareCents: 1200,
        },
        {
          memberId: "member-sarah",
          shareCents: 1200,
        },
      ],
    },
  ],
};