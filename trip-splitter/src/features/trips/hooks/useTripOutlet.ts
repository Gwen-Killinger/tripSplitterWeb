import { useOutletContext } from "react-router";
import type {
  Trip,
  TripRole,
} from "../../../domain/models";

type TripOutletContext = {
  trip: Trip;
  role: TripRole;
  reload: () => void;
};

export function useTripOutlet(): TripOutletContext {
  return useOutletContext<TripOutletContext>();
}
