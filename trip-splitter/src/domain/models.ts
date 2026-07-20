export type TripMember = {
  id: string;
  displayName: string;
};

export type ExpenseSplit = {
  memberId: string;
  shareCents: number;
};

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  expenseDate: string;
  paidByMemberId: string;
  participantMemberIds: string[];
  splits: ExpenseSplit[];
  notes?: string;
};

export type Trip = {
  id: string;
  name: string;
  currencyCode: string;
  members: TripMember[];
  expenses: Expense[];
};