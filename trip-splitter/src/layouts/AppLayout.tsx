import { NavLink, Outlet } from "react-router";

function getNavigationClassName({
  isActive,
}: {
  isActive: boolean;
}): string {
  return [
    "app-navigation__link",
    isActive ? "app-navigation__link--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__content">
          <NavLink className="app-brand" to="/">
            Trip Splitter
          </NavLink>

          <nav className="app-navigation" aria-label="Main navigation">
            <NavLink className={getNavigationClassName} to="/">
              Home
            </NavLink>

            <NavLink className={getNavigationClassName} to="/trips">
              Trips
            </NavLink>

            <NavLink className={getNavigationClassName} to="/trips/new">
              New Trip
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}