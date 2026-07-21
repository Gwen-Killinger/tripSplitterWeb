import { useOutletContext } from "react-router";
import type { Trip } from "../../../domain/models";

type TripOutletContext = {
  trip: Trip;
  reload: () => void;
};

export function useTripOutlet(): TripOutletContext {
  return useOutletContext<TripOutletContext>();
}