import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { calculateEqualSplits } from "../domain/calculateEqualSplits";
import { ExpenseForm } from "../features/expenses/components/ExpenseForm";
import type { ExpenseFormValues } from "../features/expenses/types";
import { useTrip } from "../features/trips/hooks/useTrip";
import { tripRepository } from "../repositories/repositoryInstance";

function formatCentsForInput(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export function EditExpensePage() {
  const navigate = useNavigate();
  const { tripId, expenseId } = useParams();
  const { trip, isLoading, error } = useTrip(tripId);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] =
    useState<string | null>(null);

  const expense = trip?.expenses.find(
    (candidate) => candidate.id === expenseId,
  );

  async function handleSubmit(
    values: ExpenseFormValues,
    amountCents: number,
  ): Promise<void> {
    if (!tripId || !expenseId || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const splits = calculateEqualSplits(
        amountCents,
        values.participantMemberIds,
      );

      await tripRepository.updateExpense(
        tripId,
        expenseId,
        {
          description: values.description,
          amountCents,
          expenseDate: values.expenseDate,
          paidByMemberId: values.paidByMemberId,
          participantMemberIds:
            values.participantMemberIds,
          splits,
          notes: values.notes || undefined,
        },
      );

      navigate(`/trips/${tripId}`);
    } catch (caughtError) {
      console.error("Unable to update expense:", caughtError);

      setSaveError(
        "Unable to update the expense. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Loading expense...</p>;
  }

  if (error) {
    return (
      <section>
        <h1>Unable to load expense</h1>
        <p>{error}</p>
      </section>
    );
  }

  if (!trip || !expense) {
    return (
      <section>
        <h1>Expense not found</h1>
        <p>This expense does not exist.</p>
      </section>
    );
  }

  const initialValues: ExpenseFormValues = {
    description: expense.description,
    amount: formatCentsForInput(expense.amountCents),
    expenseDate: expense.expenseDate,
    paidByMemberId: expense.paidByMemberId,
    participantMemberIds:
      expense.participantMemberIds,
    notes: expense.notes ?? "",
  };

  return (
    <section className="form-page">
      <button
        className="text-button"
        type="button"
        disabled={isSaving}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <header className="form-page__header">
        <h1>Edit Expense</h1>
        <p>Update this expense for {trip.name}.</p>
      </header>

      <ExpenseForm
        members={trip.members}
        initialValues={initialValues}
        isSaving={isSaving}
        submitError={saveError}
        submitLabel="Save Changes"
        onSubmit={(values, amountCents) => {
          void handleSubmit(values, amountCents);
        }}
      />
    </section>
  );
}