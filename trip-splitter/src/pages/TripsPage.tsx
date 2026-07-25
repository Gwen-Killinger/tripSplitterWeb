import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { AccessibleTrip } from "../domain/models";
import { TripCard } from "../features/trips/components/TripCard";
import { ensureAuthenticated } from "../firebase/ensureAuthenticated";
import { tripRepository } from "../repositories/repositoryInstance";

export function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<AccessibleTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const retry = useCallback(() => {
    setReloadCount((currentCount) => currentCount + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadTrips() {
      setIsLoading(true);
      setError(null);

      try {
        await ensureAuthenticated();
        const loadedTrips = await tripRepository.getTrips();

        if (!isCancelled) {
          setTrips(loadedTrips);
        }
      } catch (caughtError) {
        console.error("Unable to load trips:", caughtError);

        if (!isCancelled) {
          setError(
            "Unable to load your trips. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTrips();

    return () => {
      isCancelled = true;
    };
  }, [reloadCount]);

  const sortedTrips = [...trips].sort((first, second) =>
    first.trip.name.localeCompare(second.trip.name, undefined, {
      sensitivity: "base",
    }),
  );

  return (
    <section>
      <div className="trip-list-header">
        <div>
          <h1>Your Trips</h1>
          {!isLoading && error === null && (
            <p>
              {trips.length}{" "}
              {trips.length === 1 ? "trip" : "trips"}
            </p>
          )}
        </div>

        <Link className="primary-button" to="/trips/new">
          New Trip
        </Link>
      </div>

      {isLoading && <p>Loading trips...</p>}

      {!isLoading && error !== null && (
        <div role="alert">
          <h2>Unable to load trips</h2>
          <p>{error}</p>
          <button
            className="primary-button"
            type="button"
            onClick={retry}
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading &&
        error === null &&
        sortedTrips.length === 0 && (
          <div className="empty-state">
            <h2>No trips yet</h2>
            <p>Create a trip to start tracking expenses.</p>
            <Link className="primary-button" to="/trips/new">
              Create Your First Trip
            </Link>
          </div>
        )}

      {!isLoading &&
        error === null &&
        sortedTrips.length > 0 && (
          <div className="trip-list">
            {sortedTrips.map((accessibleTrip) => (
              <TripCard
                key={accessibleTrip.trip.id}
                accessibleTrip={accessibleTrip}
                onSelect={() =>
                  navigate(
                    `/trips/${accessibleTrip.trip.id}`,
                  )
                }
              />
            ))}
          </div>
        )}
    </section>
  );
}
