import { useCallback, useEffect, useState } from "react";
import type {
  AccessibleTrip,
  Trip,
  TripRole,
} from "../../../domain/models";
import { ensureAuthenticated } from "../../../firebase/ensureAuthenticated";
import { tripRepository } from "../../../repositories/repositoryInstance";

type UseTripResult = {
  trip: Trip | null;
  role: TripRole | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

export function useTrip(
  tripId: string | undefined,
): UseTripResult {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [role, setRole] = useState<TripRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => {
    setReloadCount((currentCount) => currentCount + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadTrip() {
      if (!tripId) {
        setTrip(null);
        setRole(null);
        setError("A trip ID is required.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await ensureAuthenticated();
        const accessibleTrip: AccessibleTrip | null =
          await tripRepository.getTrip(tripId);

        if (!isCancelled) {
          setTrip(accessibleTrip?.trip ?? null);
          setRole(accessibleTrip?.role ?? null);
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load the trip.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTrip();

    return () => {
      isCancelled = true;
    };
  }, [tripId, reloadCount]);

  return {
    trip,
    role,
    isLoading,
    error,
    reload,
  };
}
