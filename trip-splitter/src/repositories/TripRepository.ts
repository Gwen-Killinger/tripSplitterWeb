import type {
  Expense,
  Trip,
  TripMember,
} from "../domain/models";

export type CreateTripInput = {
  name: string;
  currencyCode: string;
};

export type AddExpenseInput = Omit<Expense, "id">;
export type UpdateExpenseInput = AddExpenseInput;
export type AddMemberInput = {
  displayName: string;
};

export interface TripRepository {
  getTrip(tripId: string): Promise<Trip | null>;

  getTrips(): Promise<Trip[]>;

  createTrip(input: CreateTripInput): Promise<Trip>;

  deleteTrip(tripId: string): Promise<void>;

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
