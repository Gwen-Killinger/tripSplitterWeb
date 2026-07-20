import { useEffect, useState } from "react";
import type { Trip } from "../../../domain/models";
import { tripRepository } from "../../../repositories/repositoryInstance";

type UseTripResult = {
  trip: Trip | null;
  isLoading: boolean;
  error: string | null;
};

export function useTrip(
  tripId: string | undefined,
): UseTripResult {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadTrip() {
      if (!tripId) {
        setTrip(null);
        setError("A trip ID is required.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const loadedTrip =
          await tripRepository.getTrip(tripId);

        if (!isCancelled) {
          setTrip(loadedTrip);
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
  }, [tripId]);

  return {
    trip,
    isLoading,
    error,
  };
}