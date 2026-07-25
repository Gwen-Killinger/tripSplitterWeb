type ShareTripSectionProps = {
  inviteUrl: string | null;
  isCreating: boolean;
  isCopied: boolean;
  error: string | null;
  onCreate: () => void;
  onCopy: () => void;
};

export function ShareTripSection({
  inviteUrl,
  isCreating,
  isCopied,
  error,
  onCreate,
  onCopy,
}: ShareTripSectionProps) {
  return (
    <section className="share-trip">
      <h2>Share Trip</h2>
      <p>
        Create a secure invite link for another user. Anyone
        with the link can join as an editor.
      </p>

      {inviteUrl === null ? (
        <button
          className="primary-button"
          type="button"
          disabled={isCreating}
          onClick={onCreate}
        >
          {isCreating
            ? "Creating..."
            : "Create Invite Link"}
        </button>
      ) : (
        <div className="share-trip__invite">
          <label htmlFor="trip-invite-url">
            Invite link
          </label>
          <input
            id="trip-invite-url"
            type="text"
            value={inviteUrl}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          <button
            className="primary-button"
            type="button"
            onClick={onCopy}
          >
            {isCopied ? "Copied" : "Copy Link"}
          </button>
        </div>
      )}

      {error !== null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
