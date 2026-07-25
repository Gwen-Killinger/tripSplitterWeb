import { describe, expect, it } from "vitest";
import { MockTripRepository } from "./MockTripRepository";

describe("MockTripRepository.getTrips", () => {
  it("returns complete trip aggregates", async () => {
    const repository = new MockTripRepository();

    const trips = await repository.getTrips();

    expect(trips).toHaveLength(1);
    expect(trips[0]).toMatchObject({
      id: "demo-trip",
      name: "Chicago Weekend",
      currencyCode: "USD",
    });
    expect(trips[0].members.length).toBeGreaterThan(0);
    expect(trips[0].expenses.length).toBeGreaterThan(0);
  });

  it("returns cloned data that cannot mutate stored trips", async () => {
    const repository = new MockTripRepository();
    const listedTrips = await repository.getTrips();

    listedTrips[0].name = "Changed";
    listedTrips[0].members.length = 0;
    listedTrips[0].expenses.length = 0;

    const storedTrip = await repository.getTrip("demo-trip");

    expect(storedTrip?.name).toBe("Chicago Weekend");
    expect(storedTrip?.members.length).toBeGreaterThan(0);
    expect(storedTrip?.expenses.length).toBeGreaterThan(0);
  });

  it("includes newly created trips", async () => {
    const repository = new MockTripRepository();

    const createdTrip = await repository.createTrip({
      name: "Detroit Weekend",
      currencyCode: "USD",
    });

    const trips = await repository.getTrips();

    expect(trips).toContainEqual(createdTrip);
  });

  it("does not mutate stored trips while listing them", async () => {
    const repository = new MockTripRepository();
    const tripBefore = await repository.getTrip("demo-trip");

    await repository.getTrips();

    const tripAfter = await repository.getTrip("demo-trip");

    expect(tripAfter).toEqual(tripBefore);
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

    expect(trip?.members).toContainEqual(member);
    expect(trip?.members).toContainEqual({
      id: "member-gwen",
      displayName: "Gwen",
    });
    expect(trip?.members).toHaveLength(
      (tripBefore?.members.length ?? 0) + 1,
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

    expect(tripAfter?.expenses).toEqual(tripBefore?.expenses);
  });
});
