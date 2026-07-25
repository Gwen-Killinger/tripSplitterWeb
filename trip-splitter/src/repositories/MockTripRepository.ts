import type {
  Expense,
  Trip,
  TripMember,
} from "../domain/models";
import { validateMemberDisplayName } from "../domain/validateMemberDisplayName";
import { mockTrip } from "../lib/mockTrip";
import type {
  AddExpenseInput,
  AddMemberInput,
  CreateTripInput,
  TripRepository,
  UpdateExpenseInput,
} from "./TripRepository";

function cloneTrip(trip: Trip): Trip {
  return structuredClone(trip);
}

export class MockTripRepository implements TripRepository {
  private trips = new Map<string, Trip>([
    [mockTrip.id, cloneTrip(mockTrip)],
  ]);

  async getTrip(tripId: string): Promise<Trip | null> {
    const trip = this.trips.get(tripId);

    return trip ? cloneTrip(trip) : null;
  }

  async getTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values()).map(cloneTrip);
  }

  async createTrip(input: CreateTripInput): Promise<Trip> {
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: input.name,
      currencyCode: input.currencyCode,
      members: [],
      expenses: [],
    };

    this.trips.set(trip.id, trip);

    return cloneTrip(trip);
  }

  async deleteTrip(tripId: string): Promise<void> {
    if (!this.trips.has(tripId)) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    this.trips.delete(tripId);
  }

  async addMember(
    tripId: string,
    input: AddMemberInput,
  ): Promise<TripMember> {
    const trip = this.trips.get(tripId);

    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const displayName = validateMemberDisplayName(
      input.displayName,
      trip.members,
    );

    const member: TripMember = {
      id: crypto.randomUUID(),
      displayName,
    };

    trip.members.push(member);

    return structuredClone(member);
  }

  async addExpense(
    tripId: string,
    input: AddExpenseInput,
  ): Promise<Expense> {
    const trip = this.trips.get(tripId);

    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      ...input,
    };

    trip.expenses.push(expense);

    return structuredClone(expense);
  }
  

  async updateExpense(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<Expense> {
    const trip = this.trips.get(tripId);

    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const expenseIndex = trip.expenses.findIndex(
      (expense) => expense.id === expenseId,
    );

    if (expenseIndex === -1) {
      throw new Error(`Expense not found: ${expenseId}`);
    }

    const updatedExpense: Expense = {
      id: expenseId,
      ...input,
    };

    trip.expenses[expenseIndex] = updatedExpense;

    return structuredClone(updatedExpense);
  }

  async deleteExpense(
    tripId: string,
    expenseId: string,
  ): Promise<void> {
    const trip = this.trips.get(tripId);

    if (!trip) {
      throw new Error("Trip not found.");
    }

    trip.expenses = trip.expenses.filter(
      (expense) => expense.id !== expenseId,
    );
  }
}
