import type { Expense, Trip } from "../domain/models";

export type CreateTripInput = {
  name: string;
  currencyCode: string;
};

export type AddExpenseInput = Omit<Expense, "id">;
export type UpdateExpenseInput = AddExpenseInput;

export interface TripRepository {
  getTrip(tripId: string): Promise<Trip | null>;

  getTrips(): Promise<Trip[]>;

  createTrip(input: CreateTripInput): Promise<Trip>;

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