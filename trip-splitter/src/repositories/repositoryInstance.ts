import { auth } from "../firebase/auth";
import { db } from "../firebase/firestore";
import { FirestoreTripRepository } from "./FirestoreTripRepository";
import type { TripRepository } from "./TripRepository";

export const tripRepository: TripRepository =
  new FirestoreTripRepository(db, auth);