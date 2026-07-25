import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ExpenseForm } from "../features/expenses/components/ExpenseForm";
import type { ExpenseFormSubmission } from "../features/expenses/types";
import { useTrip } from "../features/trips/hooks/useTrip";
import { tripRepository } from "../repositories/repositoryInstance";

export function AddExpensePage() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { trip, isLoading, error } = useTrip(tripId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(
    submission: ExpenseFormSubmission,
  ) {
    if (!tripId || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await tripRepository.addExpense(tripId, {
        description: submission.description,
        amountCents: submission.amountCents,
        expenseDate: submission.expenseDate,
        paidByMemberId: submission.paidByMemberId,
        participantMemberIds:
          submission.participantMemberIds,
        splitMode: submission.splitMode,
        splits: submission.splits,
        notes: submission.notes || undefined,
      });

      navigate(`/trips/${tripId}`);
    } catch (caughtError) {
      console.error("Unable to save expense:", caughtError);

      setSaveError(
        "Unable to save the expense. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
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
      isSaving={isSaving}
      submitError={saveError}
      onSubmit={(submission) => {
        void handleSubmit(submission);
      }}
    />
    </section>
  );
}
