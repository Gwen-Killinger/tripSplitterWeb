import { createBrowserRouter } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { CreateTripPage } from "../pages/CreateTripPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TripDashboardPage } from "../pages/TripDashboardPage";
import { TripsPage } from "../pages/TripsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "trips",
        element: <TripsPage />,
      },
      {
        path: "trips/new",
        element: <CreateTripPage />,
      },
      {
        path: "trips/:tripId",
        element: <TripDashboardPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);