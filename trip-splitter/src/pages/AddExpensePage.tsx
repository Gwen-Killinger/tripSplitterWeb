import { useNavigate, useParams } from "react-router";
import { ExpenseForm } from "../features/expenses/components/ExpenseForm";
import type { ExpenseFormValues } from "../features/expenses/types";
import { mockTrip } from "../lib/mockTrip";

export function AddExpensePage() {
  const navigate = useNavigate();
  const { tripId } = useParams();

  function handleSubmit(
    values: ExpenseFormValues,
    amountCents: number,
  ) {
    const newExpense = {
      ...values,
      amountCents,
    };

    console.log("New expense:", newExpense);

    navigate(`/trips/${tripId}`);
  }

  return (
    <section className="form-page">
      <button
        className="text-button"
        type="button"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <header className="form-page__header">
        <h1>Add Expense</h1>
        <p>Add a shared expense to {mockTrip.name}.</p>
      </header>

      <ExpenseForm
        members={mockTrip.members}
        onSubmit={handleSubmit}
      />
    </section>
  );
}