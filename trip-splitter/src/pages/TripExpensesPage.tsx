import { Link } from "react-router";
import { ExpenseCard } from "../features/expenses/components/ExpenseCard";
import { useTripOutlet } from "../features/trips/hooks/useTripOutlet";
import { formatCurrency } from "../lib/currency";
import { tripRepository } from "../repositories/repositoryInstance";

export function TripExpensesPage() {
  const { trip, reload } = useTripOutlet();

  async function handleDelete(
    expenseId: string,
  ): Promise<void> {
    const shouldDelete = window.confirm(
      "Delete this expense?",
    );

    if (!shouldDelete) {
      return;
    }

    await tripRepository.deleteExpense(
      trip.id,
      expenseId,
    );

    reload();
  }

  const totalCents = trip.expenses.reduce(
    (total, expense) => total + expense.amountCents,
    0,
  );

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Expenses</h2>

          <p className="section-heading__subtitle">
            {trip.expenses.length} expenses ·{" "}
            {formatCurrency(
              totalCents,
              trip.currencyCode,
            )}{" "}
            total
          </p>
        </div>

        <Link
          className="primary-button"
          to={`/trips/${trip.id}/expenses/new`}
        >
          Add Expense
        </Link>
      </div>

      <div className="expense-list">
        {trip.expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            members={trip.members}
            currencyCode={trip.currencyCode}
            onDelete={() => {
              void handleDelete(expense.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}