import type {
  AcceptTripInviteResult,
  AccessibleTrip,
  Expense,
  Trip,
  TripInvite,
  TripMember,
} from "../domain/models";

export type CreateTripInput = {
  name: string;
  currencyCode: string;
  ownerDisplayName: string;
};

export type AddExpenseInput = Omit<Expense, "id">;
export type UpdateExpenseInput = AddExpenseInput;
export type AddMemberInput = {
  displayName: string;
};

export interface TripRepository {
  getTrip(tripId: string): Promise<AccessibleTrip | null>;

  getTrips(): Promise<AccessibleTrip[]>;

  createTrip(input: CreateTripInput): Promise<Trip>;

  deleteTrip(tripId: string): Promise<void>;

  createTripInvite(tripId: string): Promise<TripInvite>;

  acceptTripInvite(
    inviteToken: string,
  ): Promise<AcceptTripInviteResult>;

  addMember(
    tripId: string,
    input: AddMemberInput,
  ): Promise<TripMember>;

  addExpense(
    tripId: string,
    input: AddExpenseInput,
  ): Promise<Expense>;

  updateExpense(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<Expense>;

  deleteExpense(
    tripId: string,
    expenseId: string,
  ): Promise<void>;
}
