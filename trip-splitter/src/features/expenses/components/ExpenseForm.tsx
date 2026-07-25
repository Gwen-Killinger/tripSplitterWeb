import { useState, type SubmitEvent } from "react";
import type {
  ExpenseSplitMode,
  TripMember,
} from "../../../domain/models";
import {
  formatBasisPointsForInput,
  formatCurrency,
} from "../../../lib/currency";
import {
  createSplitModeDefaults,
  prepareExpenseSplits,
} from "../prepareExpenseSplits";
import type {
  ExpenseFormSubmission,
  ExpenseFormValues,
} from "../types";

type ExpenseFormProps = {
  members: TripMember[];
  initialValues?: ExpenseFormValues;
  isSaving: boolean;
  submitError: string | null;
  submitLabel?: string;
  onSubmit: (submission: ExpenseFormSubmission) => void;
};

type FormErrors = Partial<
  Record<
    | "description"
    | "amount"
    | "expenseDate"
    | "paidByMemberId",
    string
  >
>;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyMemberValues(
  members: TripMember[],
): Record<string, string> {
  return Object.fromEntries(
    members.map((member) => [member.id, ""]),
  );
}

export function ExpenseForm({
  members,
  initialValues,
  isSaving,
  submitError,
  submitLabel = "Save Expense",
  onSubmit,
}: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(
    initialValues ?? {
      description: "",
      amount: "",
      expenseDate: getTodayDate(),
      paidByMemberId: members[0]?.id ?? "",
      participantMemberIds: members.map((member) => member.id),
      splitMode: "equal",
      exactAmounts: createEmptyMemberValues(members),
      percentages: createEmptyMemberValues(members),
      notes: "",
    },
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const preparedSplits = prepareExpenseSplits({
    splitMode: values.splitMode,
    amount: values.amount,
    members,
    participantMemberIds: values.participantMemberIds,
    exactAmounts: values.exactAmounts,
    percentages: values.percentages,
  });

  function updateField<Key extends keyof ExpenseFormValues>(
    field: Key,
    value: ExpenseFormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    if (field in errors) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }
  }

  function updateMemberValue(
    field: "exactAmounts" | "percentages",
    memberId: string,
    value: string,
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: {
        ...currentValues[field],
        [memberId]: value,
      },
    }));
  }

  function toggleParticipant(memberId: string) {
    const isSelected =
      values.participantMemberIds.includes(memberId);

    updateField(
      "participantMemberIds",
      isSelected
        ? values.participantMemberIds.filter(
            (id) => id !== memberId,
          )
        : [...values.participantMemberIds, memberId],
    );
  }

  function changeSplitMode(splitMode: ExpenseSplitMode) {
    setValues((currentValues) => {
      const currentPrepared = prepareExpenseSplits({
        splitMode: currentValues.splitMode,
        amount: currentValues.amount,
        members,
        participantMemberIds:
          currentValues.participantMemberIds,
        exactAmounts: currentValues.exactAmounts,
        percentages: currentValues.percentages,
      });
      const participantMemberIds =
        currentPrepared.participantMemberIds.length > 0
          ? currentPrepared.participantMemberIds
          : currentValues.participantMemberIds.length > 0
            ? currentValues.participantMemberIds
            : members.map((member) => member.id);

      if (splitMode === "equal") {
        return {
          ...currentValues,
          splitMode,
          participantMemberIds,
        };
      }

      const targetValues =
        splitMode === "exact"
          ? currentValues.exactAmounts
          : currentValues.percentages;
      const hasExistingValues = Object.values(
        targetValues,
      ).some((value) => value.trim().length > 0);

      if (hasExistingValues) {
        return {
          ...currentValues,
          splitMode,
        };
      }

      const defaults =
        splitMode === "exact" &&
        currentValues.splitMode === "percentage" &&
        currentPrepared.splits !== null
          ? Object.fromEntries(
              currentPrepared.splits.map((split) => [
                split.memberId,
                (split.shareCents / 100).toFixed(2),
              ]),
            )
          : createSplitModeDefaults(
              splitMode,
              currentValues.amount,
              participantMemberIds,
            );

      return {
        ...currentValues,
        splitMode,
        [splitMode === "exact"
          ? "exactAmounts"
          : "percentages"]: {
          ...targetValues,
          ...defaults,
        },
      };
    });
  }

  function validateBaseFields(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!values.description.trim()) {
      nextErrors.description =
        "Enter an expense description.";
    }

    if (preparedSplits.amountCents === null) {
      nextErrors.amount =
        "Enter a valid amount greater than zero.";
    }

    if (!values.expenseDate) {
      nextErrors.expenseDate = "Choose an expense date.";
    }

    if (!values.paidByMemberId) {
      nextErrors.paidByMemberId = "Choose who paid.";
    }

    return nextErrors;
  }

  const isFormValid =
    Object.keys(validateBaseFields()).length === 0 &&
    preparedSplits.splits !== null &&
    preparedSplits.splitError === null;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateBaseFields();
    setErrors(nextErrors);

    if (
      Object.keys(nextErrors).length > 0 ||
      preparedSplits.amountCents === null ||
      preparedSplits.splits === null ||
      preparedSplits.splitError !== null
    ) {
      return;
    }

    onSubmit({
      description: values.description.trim(),
      amountCents: preparedSplits.amountCents,
      expenseDate: values.expenseDate,
      paidByMemberId: values.paidByMemberId,
      participantMemberIds:
        preparedSplits.participantMemberIds,
      splitMode: values.splitMode,
      splits: preparedSplits.splits,
      notes: values.notes.trim(),
    });
  }

  const exactRemainingCents =
    preparedSplits.amountCents !== null &&
    preparedSplits.exactTotalCents !== null
      ? preparedSplits.amountCents -
        preparedSplits.exactTotalCents
      : null;
  const percentageRemainingBasisPoints =
    preparedSplits.percentageTotalBasisPoints === null
      ? null
      : 10000 -
        preparedSplits.percentageTotalBasisPoints;

  return (
    <form
      className="expense-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="form-field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          name="description"
          type="text"
          value={values.description}
          disabled={isSaving}
          placeholder="Hotel, dinner, gas..."
          aria-describedby={
            errors.description
              ? "description-error"
              : undefined
          }
          aria-invalid={Boolean(errors.description)}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
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
              disabled={isSaving}
              placeholder="0.00"
              aria-describedby={
                errors.amount ? "amount-error" : undefined
              }
              aria-invalid={Boolean(errors.amount)}
              onChange={(event) =>
                updateField("amount", event.target.value)
              }
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
            disabled={isSaving}
            aria-describedby={
              errors.expenseDate
                ? "expense-date-error"
                : undefined
            }
            aria-invalid={Boolean(errors.expenseDate)}
            onChange={(event) =>
              updateField("expenseDate", event.target.value)
            }
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
          disabled={isSaving}
          aria-describedby={
            errors.paidByMemberId
              ? "payer-error"
              : undefined
          }
          aria-invalid={Boolean(errors.paidByMemberId)}
          onChange={(event) =>
            updateField(
              "paidByMemberId",
              event.target.value,
            )
          }
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

      <fieldset className="split-method">
        <legend>Split method</legend>
        <div className="split-method__options">
          {(
            [
              ["equal", "Equal"],
              ["exact", "Exact amounts"],
              ["percentage", "Percentages"],
            ] as const
          ).map(([mode, label]) => (
            <label key={mode}>
              <input
                type="radio"
                name="splitMode"
                value={mode}
                checked={values.splitMode === mode}
                disabled={isSaving}
                onChange={() => changeSplitMode(mode)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {values.splitMode === "equal" && (
        <fieldset className="participant-fieldset">
          <legend>Split between</legend>
          <div className="participant-list">
            {members.map((member) => (
              <label
                className="participant-option"
                key={member.id}
              >
                <input
                  type="checkbox"
                  checked={values.participantMemberIds.includes(
                    member.id,
                  )}
                  disabled={isSaving}
                  onChange={() =>
                    toggleParticipant(member.id)
                  }
                />
                <span>{member.displayName}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {values.splitMode === "exact" && (
        <fieldset className="split-editor">
          <legend>Exact amounts</legend>
          <div className="split-editor__rows">
            {members.map((member) => (
              <label key={member.id}>
                <span>{member.displayName}</span>
                <span className="split-editor__input">
                  <span aria-hidden="true">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      values.exactAmounts[member.id] ?? ""
                    }
                    disabled={isSaving}
                    aria-label={`${member.displayName} exact amount`}
                    onChange={(event) =>
                      updateMemberValue(
                        "exactAmounts",
                        member.id,
                        event.target.value,
                      )
                    }
                  />
                </span>
              </label>
            ))}
          </div>
          <p className="split-summary">
            Entered:{" "}
            {preparedSplits.exactTotalCents === null
              ? "Invalid"
              : formatCurrency(
                  preparedSplits.exactTotalCents,
                )}
            {exactRemainingCents !== null &&
              ` · Remaining: ${formatCurrency(
                exactRemainingCents,
              )}`}
          </p>
        </fieldset>
      )}

      {values.splitMode === "percentage" && (
        <fieldset className="split-editor">
          <legend>Percentages</legend>
          <div className="split-editor__rows">
            {members.map((member) => (
              <label key={member.id}>
                <span>{member.displayName}</span>
                <span className="split-editor__input">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      values.percentages[member.id] ?? ""
                    }
                    disabled={isSaving}
                    aria-label={`${member.displayName} percentage`}
                    onChange={(event) =>
                      updateMemberValue(
                        "percentages",
                        member.id,
                        event.target.value,
                      )
                    }
                  />
                  <span aria-hidden="true">%</span>
                </span>
              </label>
            ))}
          </div>
          <p className="split-summary">
            Entered:{" "}
            {preparedSplits.percentageTotalBasisPoints === null
              ? "Invalid"
              : `${formatBasisPointsForInput(
                  preparedSplits.percentageTotalBasisPoints,
                )}%`}
            {percentageRemainingBasisPoints !== null &&
              ` · Remaining: ${formatBasisPointsForInput(
                percentageRemainingBasisPoints,
              )}%`}
          </p>
        </fieldset>
      )}

      {preparedSplits.splitError && (
        <p className="form-error" role="alert">
          {preparedSplits.splitError}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="notes">
          Notes{" "}
          <span className="optional-label">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={values.notes}
          disabled={isSaving}
          placeholder="Add any useful details..."
          onChange={(event) =>
            updateField("notes", event.target.value)
          }
        />
      </div>

      {submitError !== null && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="form-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={isSaving || !isFormValid}
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
