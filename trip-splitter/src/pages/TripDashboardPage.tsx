import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router";
import { useRef, useState } from "react";
import { DeleteTripConfirmation } from "../features/trips/components/DeleteTripConfirmation";
import { useTrip } from "../features/trips/hooks/useTrip";
import { tripRepository } from "../repositories/repositoryInstance";

function getTripNavigationClassName({
  isActive,
}: {
  isActive: boolean;
}): string {
  return [
    "trip-navigation__link",
    isActive ? "trip-navigation__link--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function TripDashboardPage() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { trip, isLoading, error, reload } = useTrip(tripId);
  const [isConfirmingDelete, setIsConfirmingDelete] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);
  const isDeletingRef = useRef(false);

  async function handleDeleteTrip(): Promise<void> {
    if (!trip || isDeletingRef.current) {
      return;
    }

    isDeletingRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await tripRepository.deleteTrip(trip.id);
      navigate("/trips", { replace: true });
    } catch (caughtError) {
      console.error("Unable to delete trip:", caughtError);
      setDeleteError(
        "Unable to delete the trip. Please try again.",
      );
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <p>Loading trip...</p>;
  }

  if (error) {
    return (
      <section>
        <h1>Unable to load trip</h1>
        <p>{error}</p>
        <Link to="/trips">Return to trips</Link>
      </section>
    );
  }

  if (!trip) {
    return (
      <section>
        <h1>Trip not found</h1>
        <p>This trip may not exist or may have been removed.</p>
        <Link to="/trips">Return to trips</Link>
      </section>
    );
  }

  return (
    <div className="trip-shell">
      <header className="trip-header">
        <Link className="trip-header__back-link" to="/trips">
          ← All trips
        </Link>

        <h1>{trip.name}</h1>
        <p>Trip ID: {trip.id}</p>
      </header>

      <nav
        className="trip-navigation"
        aria-label="Trip navigation"
      >
        <NavLink
          className={getTripNavigationClassName}
          end
          to={`/trips/${trip.id}`}
        >
          Expenses
        </NavLink>

        <NavLink
          className={getTripNavigationClassName}
          to={`/trips/${trip.id}/balances`}
        >
          Balances
        </NavLink>

        <NavLink
          className={getTripNavigationClassName}
          to={`/trips/${trip.id}/members`}
        >
          Members
        </NavLink>

        <NavLink
          className={getTripNavigationClassName}
          to={`/trips/${trip.id}/settle`}
        >
          Settle Up
        </NavLink>
      </nav>

      <Outlet context={{ trip, reload }} />

      <section className="danger-zone">
        <h2>Danger Zone</h2>
        <p>
          Permanently delete this trip and all of its data.
        </p>

        {isConfirmingDelete ? (
          <DeleteTripConfirmation
            tripName={trip.name}
            isDeleting={isDeleting}
            error={deleteError}
            onCancel={() => {
              setIsConfirmingDelete(false);
              setDeleteError(null);
            }}
            onConfirm={() => {
              void handleDeleteTrip();
            }}
          />
        ) : (
          <button
            className="danger-button"
            type="button"
            disabled={isDeleting}
            onClick={() => {
              setIsConfirmingDelete(true);
              setDeleteError(null);
            }}
          >
            Delete Trip
          </button>
        )}
      </section>
    </div>
  );
}
