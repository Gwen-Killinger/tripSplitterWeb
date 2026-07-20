import { createBrowserRouter } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { CreateTripPage } from "../pages/CreateTripPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TripBalancesPage } from "../pages/TripBalancesPage";
import { TripDashboardPage } from "../pages/TripDashboardPage";
import { TripExpensesPage } from "../pages/TripExpensesPage";
import { TripsPage } from "../pages/TripsPage";
import { TripSettlementPage } from "../pages/TripSettlementPage";

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
        children: [
          {
            index: true,
            element: <TripExpensesPage />,
          },
          {
            path: "balances",
            element: <TripBalancesPage />,
          },
          {
            path: "settle",
            element: <TripSettlementPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);