import { Link, NavLink, Outlet, useParams } from "react-router";
import { mockTrip } from "../lib/mockTrip";

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

  return (
    <div className="trip-shell">
      <header className="trip-header">
        <Link className="trip-header__back-link" to="/trips">
          ← All trips
        </Link>

        <h1>{mockTrip.name}</h1>
        <p>Trip ID: {tripId}</p>
      </header>

      <nav className="trip-navigation" aria-label="Trip navigation">
        <NavLink
          className={getTripNavigationClassName}
          end
          to={`/trips/${tripId}`}
        >
          Expenses
        </NavLink>

        <NavLink
          className={getTripNavigationClassName}
          to={`/trips/${tripId}/balances`}
        >
          Balances
        </NavLink>

        <NavLink
          className={getTripNavigationClassName}
          to={`/trips/${tripId}/settle`}
        >
          Settle Up
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}