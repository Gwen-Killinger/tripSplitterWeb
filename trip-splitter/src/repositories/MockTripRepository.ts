import type {
  AcceptTripInviteResult,
  AccessibleTrip,
  Expense,
  Trip,
  TripInvite,
  TripMember,
  TripRole,
} from "../domain/models";
import { validateMemberDisplayName } from "../domain/validateMemberDisplayName";
import { validateOwnerDisplayName } from "../domain/validateOwnerDisplayName";
import {
  generateInviteToken,
  hashInviteToken,
} from "../lib/inviteToken";
import { mockTrip } from "../lib/mockTrip";
import type {
  AddExpenseInput,
  AddMemberInput,
  CreateTripInput,
  TripRepository,
  UpdateExpenseInput,
} from "./TripRepository";

type MockInvite = {
  tripId: string;
  status: "active" | "revoked";
};

export type MockTripRepositoryStore = {
  trips: Map<string, Trip>;
  ownerIds: Map<string, string>;
  collaborators: Map<string, Map<string, "editor">>;
  tripAccess: Map<string, Map<string, TripRole>>;
  invites: Map<string, MockInvite>;
};

type MockTripRepositoryOptions = {
  currentUserId?: string;
  store?: MockTripRepositoryStore;
};

function cloneTrip(trip: Trip): Trip {
  return structuredClone(trip);
}

export function createMockTripRepositoryStore(): MockTripRepositoryStore {
  return {
    trips: new Map([
      [mockTrip.id, cloneTrip(mockTrip)],
    ]),
    ownerIds: new Map([[mockTrip.id, "mock-owner"]]),
    collaborators: new Map(),
    tripAccess: new Map(),
    invites: new Map(),
  };
}

export class MockTripRepository implements TripRepository {
  private readonly currentUserId: string;
  private readonly store: MockTripRepositoryStore;

  constructor(options: MockTripRepositoryOptions = {}) {
    this.currentUserId =
      options.currentUserId ?? "mock-owner";
    this.store =
      options.store ?? createMockTripRepositoryStore();
  }

  private getTripRole(tripId: string): TripRole | null {
    if (
      this.store.ownerIds.get(tripId) ===
      this.currentUserId
    ) {
      return "owner";
    }

    return (
      this.store.collaborators
        .get(tripId)
        ?.get(this.currentUserId) ?? null
    );
  }

  private requireTripAccess(tripId: string): TripRole {
    if (!this.store.trips.has(tripId)) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const role = this.getTripRole(tripId);

    if (role === null) {
      throw new Error(
        "User is not authorized to access this trip.",
      );
    }

    return role;
  }

  private requireTripOwner(tripId: string): void {
    if (this.requireTripAccess(tripId) !== "owner") {
      throw new Error(
        "User is not authorized to manage this trip.",
      );
    }
  }

  async getTrip(
    tripId: string,
  ): Promise<AccessibleTrip | null> {
    const trip = this.store.trips.get(tripId);

    if (!trip) {
      return null;
    }

    const role = this.getTripRole(tripId);

    if (role === null) {
      throw new Error(
        "User is not authorized to access this trip.",
      );
    }

    return {
      trip: cloneTrip(trip),
      role,
    };
  }

  async getTrips(): Promise<AccessibleTrip[]> {
    const accessibleTripIds = new Set<string>();

    for (const [tripId, ownerId] of this.store.ownerIds) {
      if (ownerId === this.currentUserId) {
        accessibleTripIds.add(tripId);
      }
    }

    for (
      const tripId of this.store.tripAccess
        .get(this.currentUserId)
        ?.keys() ?? []
    ) {
      accessibleTripIds.add(tripId);
    }

    return Array.from(accessibleTripIds)
      .map((tripId): AccessibleTrip | null => {
        const trip = this.store.trips.get(tripId);
        const role = this.getTripRole(tripId);

        return !trip || role === null
          ? null
          : {
              trip: cloneTrip(trip),
              role,
            };
      })
      .filter(
        (
          accessibleTrip,
        ): accessibleTrip is AccessibleTrip =>
          accessibleTrip !== null,
      );
  }

  async createTrip(input: CreateTripInput): Promise<Trip> {
    const ownerDisplayName = validateOwnerDisplayName(
      input.ownerDisplayName,
    );
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: input.name,
      currencyCode: input.currencyCode,
      ownerMemberId: this.currentUserId,
      members: [
        {
          id: this.currentUserId,
          displayName: ownerDisplayName,
        },
      ],
      expenses: [],
    };

    this.store.trips.set(trip.id, trip);
    this.store.ownerIds.set(
      trip.id,
      this.currentUserId,
    );
    this.setTripAccess(
      this.currentUserId,
      trip.id,
      "owner",
    );

    return cloneTrip(trip);
  }

  async createTripInvite(
    tripId: string,
  ): Promise<TripInvite> {
    this.requireTripOwner(tripId);

    const token = generateInviteToken();
    const inviteHash = await hashInviteToken(token);

    this.store.invites.set(inviteHash, {
      tripId,
      status: "active",
    });

    return { token };
  }

  async acceptTripInvite(
    inviteToken: string,
  ): Promise<AcceptTripInviteResult> {
    const inviteHash =
      await hashInviteToken(inviteToken);
    const invite = this.store.invites.get(inviteHash);

    if (!invite) {
      throw new Error("Invite is invalid.");
    }

    if (invite.status !== "active") {
      throw new Error("Invite is no longer active.");
    }

    if (!this.store.trips.has(invite.tripId)) {
      throw new Error("Invite is invalid.");
    }

    if (
      this.store.ownerIds.get(invite.tripId) ===
      this.currentUserId
    ) {
      return {
        tripId: invite.tripId,
        status: "already-owner",
      };
    }

    const collaborators =
      this.store.collaborators.get(invite.tripId) ??
      new Map<string, "editor">();
    const isExistingCollaborator = collaborators.has(
      this.currentUserId,
    );

    collaborators.set(this.currentUserId, "editor");
    this.store.collaborators.set(
      invite.tripId,
      collaborators,
    );
    this.setTripAccess(
      this.currentUserId,
      invite.tripId,
      "editor",
    );

    return {
      tripId: invite.tripId,
      status: isExistingCollaborator
        ? "already-collaborator"
        : "joined",
    };
  }

  private setTripAccess(
    userId: string,
    tripId: string,
    role: TripRole,
  ): void {
    const access =
      this.store.tripAccess.get(userId) ??
      new Map<string, TripRole>();

    access.set(tripId, role);
    this.store.tripAccess.set(userId, access);
  }

  async deleteTrip(tripId: string): Promise<void> {
    this.requireTripOwner(tripId);

    this.store.trips.delete(tripId);
    this.store.ownerIds.delete(tripId);
    this.store.collaborators.delete(tripId);

    for (const access of this.store.tripAccess.values()) {
      access.delete(tripId);
    }

    for (const [inviteHash, invite] of this.store.invites) {
      if (invite.tripId === tripId) {
        this.store.invites.delete(inviteHash);
      }
    }
  }

  async addMember(
    tripId: string,
    input: AddMemberInput,
  ): Promise<TripMember> {
    this.requireTripAccess(tripId);
    const trip = this.store.trips.get(tripId);

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
    this.requireTripAccess(tripId);
    const trip = this.store.trips.get(tripId);

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
    this.requireTripAccess(tripId);
    const trip = this.store.trips.get(tripId);

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
    this.requireTripAccess(tripId);
    const trip = this.store.trips.get(tripId);

    if (!trip) {
      throw new Error("Trip not found.");
    }

    trip.expenses = trip.expenses.filter(
      (expense) => expense.id !== expenseId,
    );
  }
}
