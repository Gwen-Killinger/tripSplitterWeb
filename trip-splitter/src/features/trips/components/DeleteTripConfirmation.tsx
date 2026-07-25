type DeleteTripConfirmationProps = {
  tripName: string;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteTripConfirmation({
  tripName,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: DeleteTripConfirmationProps) {
  return (
    <div
      className="delete-trip-confirmation"
      role="alertdialog"
      aria-labelledby="delete-trip-confirmation-title"
      aria-describedby="delete-trip-confirmation-description"
    >
      <h3 id="delete-trip-confirmation-title">
        Permanently delete {tripName}?
      </h3>

      <p id="delete-trip-confirmation-description">
        This permanently deletes the trip, its members, and all
        of its expenses. This action cannot be undone.
      </p>

      {error !== null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="delete-trip-confirmation__actions">
        <button
          className="secondary-button"
          type="button"
          disabled={isDeleting}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          className="danger-button"
          type="button"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting
            ? "Deleting..."
            : "Delete Permanently"}
        </button>
      </div>
    </div>
  );
}
