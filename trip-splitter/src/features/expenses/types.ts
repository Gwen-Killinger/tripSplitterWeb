import type {
  ExpenseSplit,
  ExpenseSplitMode,
} from "../../domain/models";

export type ExpenseFormValues = {
  description: string;
  amount: string;
  expenseDate: string;
  paidByMemberId: string;
  participantMemberIds: string[];
  splitMode: ExpenseSplitMode;
  exactAmounts: Record<string, string>;
  percentages: Record<string, string>;
  notes: string;
};

export type ExpenseFormSubmission = {
  description: string;
  amountCents: number;
  expenseDate: string;
  paidByMemberId: string;
  participantMemberIds: string[];
  splitMode: ExpenseSplitMode;
  splits: ExpenseSplit[];
  notes: string;
};
