import { useOutletContext } from "react-router";
import type { Trip } from "../../../domain/models";

type TripOutletContext = {
  trip: Trip;
};

export function useTripOutlet(): TripOutletContext {
  return useOutletContext<TripOutletContext>();
}