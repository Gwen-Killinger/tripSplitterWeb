export type TripMember = {
  id: string;
  displayName: string;
};

export type ExpenseSplit = {
  memberId: string;
  shareCents: number;
  percentageBasisPoints?: number;
};

export type ExpenseSplitMode =
  | "equal"
  | "exact"
  | "percentage";

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  expenseDate: string;
  paidByMemberId: string;
  participantMemberIds: string[];
  splits: ExpenseSplit[];
  splitMode: ExpenseSplitMode;
  notes?: string;
};

export type Trip = {
  id: string;
  name: string;
  currencyCode: string;
  members: TripMember[];
  expenses: Expense[];
};

export type CalculatedSplit = {
  memberId: string;
  shareCents: number;
};

export type MemberBalance = {
  memberId: string;

  paidCents: number;

  owedCents: number;

  balanceCents: number;
};

export type Settlement = {
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
};
