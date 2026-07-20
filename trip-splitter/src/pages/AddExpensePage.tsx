import { Link, useParams } from "react-router";

export function AddExpensePage() {
  const { tripId } = useParams();

  return (
    <section>
      <Link className="trip-header__back-link" to={`/trips/${tripId}`}>
        ← Back to expenses
      </Link>

      <h1>Add Expense</h1>
      <p>The expense form will live here.</p>
    </section>
  );
}