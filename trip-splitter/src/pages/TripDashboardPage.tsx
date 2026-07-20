import { useParams } from "react-router";

export function TripDashboardPage() {
  const { tripId } = useParams();

  return (
    <section>
      <h1>Trip Dashboard</h1>
      <p>Trip ID: {tripId}</p>
    </section>
  );
}