import type { Expense, TripMember } from "../../../domain/models";
import { formatCurrency } from "../../../lib/currency";

type ExpenseCardProps = {
  expense: Expense;
  members: TripMember[];
  currencyCode: string;
  onEdit: () => void;
  onDelete: () => void;
};

export function ExpenseCard({
  expense,
  members,
  currencyCode,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const payer = members.find(
    (member) => member.id === expense.paidByMemberId,
  );

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${expense.expenseDate}T12:00:00`));

  return (
    <article className="expense-card">
      <div className="expense-card__content">
        <div>
          <h3 className="expense-card__title">{expense.description}</h3>

          <p className="expense-card__meta">
            Paid by {payer?.displayName ?? "Unknown"}
          </p>

          <p className="expense-card__meta">
            {formattedDate} · {expense.participantMemberIds.length}{" "}
            {expense.participantMemberIds.length === 1
              ? "participant"
              : "participants"}
          </p>

          {expense.notes && (
            <p className="expense-card__notes">{expense.notes}</p>
          )}
        </div>

        <div className="expense-card__actions">
          <strong className="expense-card__amount">
            {formatCurrency(expense.amountCents, currencyCode)}
          </strong>

          <button
            className="text-button"
            type="button"
            onClick={onEdit}
          >
            ✏️ Edit
          </button>

          <button
            className="text-button text-button--danger"
            type="button"
            onClick={onDelete}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </article>
  );
}
