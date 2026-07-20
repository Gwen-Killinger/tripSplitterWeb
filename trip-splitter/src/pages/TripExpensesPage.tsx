import { Link, useParams } from "react-router";
import { ExpenseCard } from "../features/expenses/components/ExpenseCard";
import { formatCurrency } from "../lib/currency";
import { mockTrip } from "../lib/mockTrip";

export function TripExpensesPage() {
  const { tripId } = useParams();

  const totalCents = mockTrip.expenses.reduce(
    (total, expense) => total + expense.amountCents,
    0,
  );

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Expenses</h2>
          <p className="section-heading__subtitle">
            {mockTrip.expenses.length} expenses ·{" "}
            {formatCurrency(totalCents, mockTrip.currencyCode)} total
          </p>
        </div>

        <Link
          className="primary-button"
          to={`/trips/${tripId}/expenses/new`}
        >
          Add Expense
        </Link>
      </div>

      <div className="expense-list">
        {mockTrip.expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            members={mockTrip.members}
            currencyCode={mockTrip.currencyCode}
          />
        ))}
      </div>
    </section>
  );
}