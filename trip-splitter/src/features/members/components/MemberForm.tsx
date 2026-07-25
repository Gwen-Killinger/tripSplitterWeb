import { useState, type SubmitEvent } from "react";
import type { TripMember } from "../../../domain/models";
import { validateMemberDisplayName } from "../../../domain/validateMemberDisplayName";

type MemberFormProps = {
  members: TripMember[];
  displayName: string;
  isSaving: boolean;
  submitError: string | null;
  onDisplayNameChange: (displayName: string) => void;
  onSubmit: (displayName: string) => void;
};

export function MemberForm({
  members,
  displayName,
  isSaving,
  submitError,
  onDisplayNameChange,
  onSubmit,
}: MemberFormProps) {
  const [fieldError, setFieldError] =
    useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const validatedDisplayName =
        validateMemberDisplayName(displayName, members);

      setFieldError(null);
      onSubmit(validatedDisplayName);
    } catch (error) {
      setFieldError(
        error instanceof Error
          ? error.message
          : "Enter a valid member name.",
      );
    }
  }

  function handleDisplayNameChange(value: string) {
    onDisplayNameChange(value);
    setFieldError(null);
  }

  return (
    <form
      className="member-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="form-field">
        <label htmlFor="member-display-name">
          Display name
        </label>

        <input
          id="member-display-name"
          name="displayName"
          type="text"
          value={displayName}
          disabled={isSaving}
          autoComplete="off"
          placeholder="Alex Smith"
          aria-describedby={
            fieldError
              ? "member-display-name-error"
              : undefined
          }
          aria-invalid={Boolean(fieldError)}
          onChange={(event) =>
            handleDisplayNameChange(event.target.value)
          }
        />

        {fieldError && (
          <p
            className="form-error"
            id="member-display-name-error"
          >
            {fieldError}
          </p>
        )}
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
          disabled={isSaving}
        >
          {isSaving ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}
