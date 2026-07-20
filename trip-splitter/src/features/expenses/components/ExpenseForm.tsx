import { useState } from "react";
import type { SubmitEvent } from "react";
import type { TripMember } from "../../../domain/models";
import { parseCurrencyToCents } from "../../../lib/currency";
import type { ExpenseFormValues } from "../types";

type ExpenseFormProps = {
  members: TripMember[];
  onSubmit: (values: ExpenseFormValues, amountCents: number) => void;
};

type FormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  members,
  onSubmit,
}: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>({
    description: "",
    amount: "",
    expenseDate: getTodayDate(),
    paidByMemberId: members[0]?.id ?? "",
    participantMemberIds: members.map((member) => member.id),
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  function updateField<Key extends keyof ExpenseFormValues>(
    field: Key,
    value: ExpenseFormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  function toggleParticipant(memberId: string) {
    const isSelected = values.participantMemberIds.includes(memberId);

    const participantMemberIds = isSelected
      ? values.participantMemberIds.filter((id) => id !== memberId)
      : [...values.participantMemberIds, memberId];

    updateField("participantMemberIds", participantMemberIds);
  }

  function validate(): {
    errors: FormErrors;
    amountCents: number | null;
  } {
    const nextErrors: FormErrors = {};
    const amountCents = parseCurrencyToCents(values.amount);

    if (!values.description.trim()) {
      nextErrors.description = "Enter an expense description.";
    }

    if (amountCents === null) {
      nextErrors.amount = "Enter a valid amount greater than zero.";
    }

    if (!values.expenseDate) {
      nextErrors.expenseDate = "Choose an expense date.";
    }

    if (!values.paidByMemberId) {
      nextErrors.paidByMemberId = "Choose who paid.";
    }

    if (values.participantMemberIds.length === 0) {
      nextErrors.participantMemberIds =
        "Choose at least one participant.";
    }

    return {
      errors: nextErrors,
      amountCents,
    };
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validate();
    setErrors(validation.errors);

    if (
      Object.keys(validation.errors).length > 0 ||
      validation.amountCents === null
    ) {
      return;
    }

    onSubmit(
      {
        ...values,
        description: values.description.trim(),
        notes: values.notes.trim(),
      },
      validation.amountCents,
    );
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="description">Description</label>

        <input
          id="description"
          name="description"
          type="text"
          value={values.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          placeholder="Hotel, dinner, gas..."
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
          aria-invalid={Boolean(errors.description)}
        />

        {errors.description && (
          <p className="form-error" id="description-error">
            {errors.description}
          </p>
        )}
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="amount">Amount</label>

          <div className="currency-input">
            <span aria-hidden="true">$</span>

            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              value={values.amount}
              onChange={(event) =>
                updateField("amount", event.target.value)
              }
              placeholder="0.00"
              aria-describedby={
                errors.amount ? "amount-error" : undefined
              }
              aria-invalid={Boolean(errors.amount)}
            />
          </div>

          {errors.amount && (
            <p className="form-error" id="amount-error">
              {errors.amount}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="expenseDate">Date</label>

          <input
            id="expenseDate"
            name="expenseDate"
            type="date"
            value={values.expenseDate}
            onChange={(event) =>
              updateField("expenseDate", event.target.value)
            }
            aria-describedby={
              errors.expenseDate ? "expense-date-error" : undefined
            }
            aria-invalid={Boolean(errors.expenseDate)}
          />

          {errors.expenseDate && (
            <p className="form-error" id="expense-date-error">
              {errors.expenseDate}
            </p>
          )}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="paidByMemberId">Paid by</label>

        <select
          id="paidByMemberId"
          name="paidByMemberId"
          value={values.paidByMemberId}
          onChange={(event) =>
            updateField("paidByMemberId", event.target.value)
          }
          aria-describedby={
            errors.paidByMemberId ? "payer-error" : undefined
          }
          aria-invalid={Boolean(errors.paidByMemberId)}
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>

        {errors.paidByMemberId && (
          <p className="form-error" id="payer-error">
            {errors.paidByMemberId}
          </p>
        )}
      </div>

      <fieldset className="participant-fieldset">
        <legend>Split between</legend>

        <div className="participant-list">
          {members.map((member) => {
            const isSelected =
              values.participantMemberIds.includes(member.id);

            return (
              <label
                className="participant-option"
                key={member.id}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleParticipant(member.id)}
                />

                <span>{member.displayName}</span>
              </label>
            );
          })}
        </div>

        {errors.participantMemberIds && (
          <p className="form-error">
            {errors.participantMemberIds}
          </p>
        )}
      </fieldset>

      <div className="form-field">
        <label htmlFor="notes">
          Notes <span className="optional-label">(optional)</span>
        </label>

        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={values.notes}
          onChange={(event) =>
            updateField("notes", event.target.value)
          }
          placeholder="Add any useful details..."
        />
      </div>

      <div className="form-actions">
        <button className="primary-button" type="submit">
          Save Expense
        </button>
      </div>
    </form>
  );
}
