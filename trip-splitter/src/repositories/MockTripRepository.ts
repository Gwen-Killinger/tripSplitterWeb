import type { Expense, Trip } from "../domain/models";
import { mockTrip } from "../lib/mockTrip";
import type {
  AddExpenseInput,
  CreateTripInput,
  TripRepository,
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