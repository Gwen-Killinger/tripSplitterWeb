import { useNavigate, useParams } from "react-router";
import { calculateEqualSplits } from "../domain/calculateEqualSplits";
import { ExpenseForm } from "../features/expenses/components/ExpenseForm";
import type { ExpenseFormValues } from "../features/expenses/types";
import { useTrip } from "../features/trips/hooks/useTrip";
import { tripRepository } from "../repositories/repositoryInstance";

export function AddExpensePage() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { trip, isLoading, error } = useTrip(tripId);

  async function handleSubmit(
    values: ExpenseFormValues,
    amountCents: number,
  ) {
    if (!tripId) {
      return;
    }

    const splits = calculateEqualSplits(
      amountCents,
      values.participantMemberIds,
    );

    await tripRepository.addExpense(tripId, {
      description: values.description,
      amountCents,
      expenseDate: values.expenseDate,
      paidByMemberId: values.paidByMemberId,
      participantMemberIds:
        values.participantMemberIds,
      splits,
      notes: values.notes || undefined,
    });

    navigate(`/trips/${tripId}`);
  }

  if (isLoading) {
    return <p>Loading trip...</p>;
  }

  if (error) {
    return (
      <section>
        <h1>Unable to load trip</h1>
        <p>{error}</p>
      </section>
    );
  }

  if (!trip) {
    return (
      <section>
        <h1>Trip not found</h1>
        <p>This trip does not exist.</p>
      </section>
    );
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
        <p>Add a shared expense to {trip.name}.</p>
      </header>

      <ExpenseForm
        members={trip.members}
        onSubmit={(values, amountCents) => {
          void handleSubmit(values, amountCents);
        }}
      />
    </section>
  );
}