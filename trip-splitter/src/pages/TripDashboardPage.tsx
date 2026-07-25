import {
  Link,
  NavLink,
  Outlet,
  useParams,
} from "react-router";
import { useTrip } from "../features/trips/hooks/useTrip";

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
  const { tripId } = useParams();
  const { trip, isLoading, error, reload } = useTrip(tripId);

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
    </div>
  );
}
