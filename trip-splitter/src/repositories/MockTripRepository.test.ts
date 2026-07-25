import { describe, expect, it } from "vitest";
import {
  createMockTripRepositoryStore,
  MockTripRepository,
} from "./MockTripRepository";
import { hashInviteToken } from "../lib/inviteToken";

describe("MockTripRepository.getTrips", () => {
  it("returns complete trip aggregates", async () => {
    const repository = new MockTripRepository();

    const trips = await repository.getTrips();

    expect(trips).toHaveLength(1);
    expect(trips[0]).toMatchObject({
      role: "owner",
      trip: {
        id: "demo-trip",
        name: "Chicago Weekend",
        currencyCode: "USD",
      },
    });
    expect(trips[0].trip.members.length).toBeGreaterThan(0);
    expect(trips[0].trip.expenses.length).toBeGreaterThan(0);
  });

  it("returns cloned data that cannot mutate stored trips", async () => {
    const repository = new MockTripRepository();
    const listedTrips = await repository.getTrips();

    listedTrips[0].trip.name = "Changed";
    listedTrips[0].trip.members.length = 0;
    listedTrips[0].trip.expenses.length = 0;

    const storedTrip = await repository.getTrip("demo-trip");

    expect(storedTrip?.trip.name).toBe("Chicago Weekend");
    expect(storedTrip?.trip.members.length).toBeGreaterThan(0);
    expect(storedTrip?.trip.expenses.length).toBeGreaterThan(0);
  });

  it("includes newly created trips", async () => {
    const repository = new MockTripRepository();

    const createdTrip = await repository.createTrip({
      name: "Detroit Weekend",
      currencyCode: "USD",
    });

    const trips = await repository.getTrips();

    expect(trips).toContainEqual({
      trip: createdTrip,
      role: "owner",
    });
  });

  it("does not mutate stored trips while listing them", async () => {
    const repository = new MockTripRepository();
    const tripBefore = await repository.getTrip("demo-trip");

    await repository.getTrips();

    const tripAfter = await repository.getTrip("demo-trip");

    expect(tripAfter).toEqual(tripBefore);
  });
});

describe("MockTripRepository.deleteTrip", () => {
  it("deletes an existing trip and its aggregate", async () => {
    const repository = new MockTripRepository();
    const tripBefore = await repository.getTrip("demo-trip");

    expect(tripBefore?.trip.members.length).toBeGreaterThan(0);
    expect(tripBefore?.trip.expenses.length).toBeGreaterThan(0);

    await repository.deleteTrip("demo-trip");

    await expect(
      repository.getTrip("demo-trip"),
    ).resolves.toBeNull();

    const trips = await repository.getTrips();

    expect(
      trips.some(
        (accessibleTrip) =>
          accessibleTrip.trip.id === "demo-trip",
      ),
    ).toBe(false);
  });

  it("rejects deleting a missing trip", async () => {
    const repository = new MockTripRepository();

    await expect(
      repository.deleteTrip("missing-trip"),
    ).rejects.toThrow("Trip not found: missing-trip");
  });

  it("leaves another trip unchanged", async () => {
    const repository = new MockTripRepository();
    const otherTrip = await repository.createTrip({
      name: "Detroit Weekend",
      currencyCode: "USD",
    });

    await repository.deleteTrip("demo-trip");

    await expect(
      repository.getTrip(otherTrip.id),
    ).resolves.toEqual({
      trip: otherTrip,
      role: "owner",
    });
  });
});

describe("MockTripRepository.addMember", () => {
  it("adds and returns a member with a generated ID", async () => {
    const repository = new MockTripRepository();
    const tripBefore = await repository.getTrip("demo-trip");

    const member = await repository.addMember("demo-trip", {
      displayName: "  Jordan Lee  ",
    });

    expect(member.id).toEqual(expect.any(String));
    expect(member.id).not.toBe("Jordan Lee");
    expect(member.displayName).toBe("Jordan Lee");

    const trip = await repository.getTrip("demo-trip");

    expect(trip?.trip.members).toContainEqual(member);
    expect(trip?.trip.members).toContainEqual({
      id: "member-gwen",
      displayName: "Gwen",
    });
    expect(trip?.trip.members).toHaveLength(
      (tripBefore?.trip.members.length ?? 0) + 1,
    );
  });

  it("rejects blank member names", async () => {
    const repository = new MockTripRepository();

    await expect(
      repository.addMember("demo-trip", {
        displayName: "   ",
      }),
    ).rejects.toThrow("Enter a member name.");
  });

  it("rejects duplicate names case-insensitively", async () => {
    const repository = new MockTripRepository();

    await expect(
      repository.addMember("demo-trip", {
        displayName: "  gWeN  ",
      }),
    ).rejects.toThrow(
      "A member with this name already exists.",
    );
  });

  it("rejects an unknown trip", async () => {
    const repository = new MockTripRepository();

    await expect(
      repository.addMember("missing-trip", {
        displayName: "Jordan",
      }),
    ).rejects.toThrow("Trip not found: missing-trip");
  });

  it("does not change existing expenses", async () => {
    const repository = new MockTripRepository();
    const tripBefore = await repository.getTrip("demo-trip");

    await repository.addMember("demo-trip", {
      displayName: "Jordan",
    });

    const tripAfter = await repository.getTrip("demo-trip");

    expect(tripAfter?.trip.expenses).toEqual(
      tripBefore?.trip.expenses,
    );
  });
});

describe("MockTripRepository custom expense splits", () => {
  it("stores and returns exact split metadata", async () => {
    const repository = new MockTripRepository();

    const expense = await repository.addExpense("demo-trip", {
      description: "Tickets",
      amountCents: 1000,
      expenseDate: "2026-07-20",
      paidByMemberId: "member-gwen",
      participantMemberIds: [
        "member-gwen",
        "member-alex",
      ],
      splitMode: "exact",
      splits: [
        { memberId: "member-gwen", shareCents: 700 },
        { memberId: "member-alex", shareCents: 300 },
      ],
    });

    const trip = await repository.getTrip("demo-trip");

    expect(trip?.trip.expenses).toContainEqual(expense);
  });

  it("preserves percentage metadata through add and update", async () => {
    const repository = new MockTripRepository();

    const expense = await repository.addExpense("demo-trip", {
      description: "Tickets",
      amountCents: 1000,
      expenseDate: "2026-07-20",
      paidByMemberId: "member-gwen",
      participantMemberIds: [
        "member-gwen",
        "member-alex",
      ],
      splitMode: "equal",
      splits: [
        { memberId: "member-gwen", shareCents: 500 },
        { memberId: "member-alex", shareCents: 500 },
      ],
    });

    const updated = await repository.updateExpense(
      "demo-trip",
      expense.id,
      {
        description: expense.description,
        amountCents: expense.amountCents,
        expenseDate: expense.expenseDate,
        paidByMemberId: expense.paidByMemberId,
        participantMemberIds:
          expense.participantMemberIds,
        splitMode: "percentage",
        splits: [
          {
            memberId: "member-gwen",
            shareCents: 600,
            percentageBasisPoints: 6000,
          },
          {
            memberId: "member-alex",
            shareCents: 400,
            percentageBasisPoints: 4000,
          },
        ],
      },
    );

    expect(updated.splitMode).toBe("percentage");
    expect(updated.splits).toEqual([
      {
        memberId: "member-gwen",
        shareCents: 600,
        percentageBasisPoints: 6000,
      },
      {
        memberId: "member-alex",
        shareCents: 400,
        percentageBasisPoints: 4000,
      },
    ]);

    updated.splits[0].shareCents = 0;
    const storedTrip = await repository.getTrip("demo-trip");
    const storedExpense = storedTrip?.trip.expenses.find(
      (candidate) => candidate.id === expense.id,
    );

    expect(storedExpense?.splits[0].shareCents).toBe(600);
  });
});

describe("MockTripRepository sharing", () => {
  function createRepositories() {
    const store = createMockTripRepositoryStore();

    return {
      owner: new MockTripRepository({
        currentUserId: "mock-owner",
        store,
      }),
      collaborator: new MockTripRepository({
        currentUserId: "collaborator",
        store,
      }),
      unrelated: new MockTripRepository({
        currentUserId: "unrelated",
        store,
      }),
      store,
    };
  }

  it("lets an invited user join without creating a TripMember", async () => {
    const { owner, collaborator, store } =
      createRepositories();
    const invite =
      await owner.createTripInvite("demo-trip");
    const inviteHash =
      await hashInviteToken(invite.token);
    const ownerTripBefore =
      await owner.getTrip("demo-trip");

    expect(invite.token).toMatch(/^[0-9a-f]{64}$/);
    expect(store.invites.has(invite.token)).toBe(false);
    expect(store.invites.has(inviteHash)).toBe(true);

    await expect(
      collaborator.acceptTripInvite(invite.token),
    ).resolves.toEqual({
      tripId: "demo-trip",
      status: "joined",
    });

    const sharedTrip =
      await collaborator.getTrip("demo-trip");

    expect(sharedTrip?.role).toBe("editor");
    expect(sharedTrip?.trip.members).toEqual(
      ownerTripBefore?.trip.members,
    );
    await expect(
      collaborator.getTrips(),
    ).resolves.toContainEqual(sharedTrip);
  });

  it("keeps acceptance idempotent and handles the owner", async () => {
    const { owner, collaborator } = createRepositories();
    const invite =
      await owner.createTripInvite("demo-trip");

    await collaborator.acceptTripInvite(invite.token);

    await expect(
      collaborator.acceptTripInvite(invite.token),
    ).resolves.toEqual({
      tripId: "demo-trip",
      status: "already-collaborator",
    });
    await expect(
      owner.acceptTripInvite(invite.token),
    ).resolves.toEqual({
      tripId: "demo-trip",
      status: "already-owner",
    });
  });

  it("rejects invalid invites and unrelated trip access", async () => {
    const { unrelated } = createRepositories();

    await expect(
      unrelated.acceptTripInvite("invalid-token"),
    ).rejects.toThrow("Invite is invalid.");
    await expect(
      unrelated.getTrip("demo-trip"),
    ).rejects.toThrow(
      "User is not authorized to access this trip.",
    );
    await expect(unrelated.getTrips()).resolves.toEqual([]);
  });

  it("rejects revoked invites", async () => {
    const { owner, collaborator, store } =
      createRepositories();
    const invite =
      await owner.createTripInvite("demo-trip");
    const inviteHash =
      await hashInviteToken(invite.token);
    const storedInvite = store.invites.get(inviteHash);

    if (storedInvite) {
      storedInvite.status = "revoked";
    }

    await expect(
      collaborator.acceptTripInvite(invite.token),
    ).rejects.toThrow("Invite is no longer active.");
  });

  it("allows editors to manage trip data but not invites or deletion", async () => {
    const { owner, collaborator } = createRepositories();
    const invite =
      await owner.createTripInvite("demo-trip");

    await collaborator.acceptTripInvite(invite.token);
    await expect(
      collaborator.addMember("demo-trip", {
        displayName: "Taylor",
      }),
    ).resolves.toMatchObject({
      displayName: "Taylor",
    });
    await expect(
      collaborator.addExpense("demo-trip", {
        description: "Shared dinner",
        amountCents: 1000,
        expenseDate: "2026-07-20",
        paidByMemberId: "member-gwen",
        participantMemberIds: [
          "member-gwen",
          "member-alex",
        ],
        splitMode: "equal",
        splits: [
          {
            memberId: "member-gwen",
            shareCents: 500,
          },
          {
            memberId: "member-alex",
            shareCents: 500,
          },
        ],
      }),
    ).resolves.toMatchObject({
      description: "Shared dinner",
    });
    await expect(
      collaborator.createTripInvite("demo-trip"),
    ).rejects.toThrow(
      "User is not authorized to manage this trip.",
    );
    await expect(
      collaborator.deleteTrip("demo-trip"),
    ).rejects.toThrow(
      "User is not authorized to manage this trip.",
    );
  });

  it("deduplicates owner access and cleans sharing state on deletion", async () => {
    const { owner, collaborator, store } =
      createRepositories();
    const invite =
      await owner.createTripInvite("demo-trip");

    await collaborator.acceptTripInvite(invite.token);

    expect(await owner.getTrips()).toHaveLength(1);

    await owner.deleteTrip("demo-trip");

    expect(store.collaborators.has("demo-trip")).toBe(false);
    expect(store.invites.size).toBe(0);
    expect(
      store.tripAccess
        .get("collaborator")
        ?.has("demo-trip"),
    ).toBe(false);
    await expect(
      collaborator.getTrip("demo-trip"),
    ).resolves.toBeNull();
  });

  it("returns cloned shared trips", async () => {
    const { owner, collaborator } = createRepositories();
    const invite =
      await owner.createTripInvite("demo-trip");

    await collaborator.acceptTripInvite(invite.token);
    const trips = await collaborator.getTrips();

    trips[0].trip.name = "Changed";

    expect(
      (await owner.getTrip("demo-trip"))?.trip.name,
    ).toBe("Chicago Weekend");
  });
});
