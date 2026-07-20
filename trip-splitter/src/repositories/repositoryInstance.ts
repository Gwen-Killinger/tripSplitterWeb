import { MockTripRepository } from "./MockTripRepository";
import type { TripRepository } from "./TripRepository";

export const tripRepository: TripRepository =
  new MockTripRepository();