import { NavLink, Outlet } from "react-router";

export function AppLayout() {
  return (
    <>
      <header>
        <nav aria-label="Main navigation">
          <NavLink to="/">Trip Splitter</NavLink>
          {" | "}
          <NavLink to="/trips">Trips</NavLink>
          {" | "}
          <NavLink to="/trips/new">New Trip</NavLink>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}