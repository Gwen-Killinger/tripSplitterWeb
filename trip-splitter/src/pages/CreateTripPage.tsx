import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";

import { validateOwnerDisplayName } from "../domain/validateOwnerDisplayName";
import { tripRepository } from "../repositories/repositoryInstance";

export function CreateTripPage() {
  const navigate = useNavigate();

  const [tripName, setTripName] = useState("");
  const [ownerDisplayName, setOwnerDisplayName] =
    useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTripName = tripName.trim();

    if (trimmedTripName.length === 0) {
      setError("Please enter a trip name.");
      return;
    }

    let validatedOwnerDisplayName: string;

    try {
      validatedOwnerDisplayName =
        validateOwnerDisplayName(ownerDisplayName);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Enter your name.",
      );
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const trip = await tripRepository.createTrip({
        name: trimmedTripName,
        currencyCode,
        ownerDisplayName: validatedOwnerDisplayName,
      });

      navigate(`/trips/${trip.id}`);
    } catch (caughtError) {
      console.error("Unable to create trip:", caughtError);
      setError("Unable to create the trip. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section>
      <h1>Create a Trip</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="trip-name">Trip name</label>
          <input
            id="trip-name"
            name="tripName"
            type="text"
            value={tripName}
            onChange={(event) => setTripName(event.target.value)}
            placeholder="Chicago Weekend"
            autoComplete="off"
            disabled={isCreating}
            required
          />
        </div>

        <div>
          <label htmlFor="owner-name">Your name</label>
          <p id="owner-name-help">
            This name will appear in expenses and identify
            you as the trip owner.
          </p>
          <input
            id="owner-name"
            name="ownerDisplayName"
            type="text"
            value={ownerDisplayName}
            onChange={(event) =>
              setOwnerDisplayName(event.target.value)
            }
            placeholder="Gwen"
            autoComplete="name"
            aria-describedby="owner-name-help"
            disabled={isCreating}
            required
          />
        </div>

        <div>
          <label htmlFor="currency-code">Currency</label>
          <select
            id="currency-code"
            name="currencyCode"
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value)}
            disabled={isCreating}
          >
            <option value="USD">USD — US Dollar</option>
          </select>
        </div>

        {error !== null && <p role="alert">{error}</p>}

        <button
          type="submit"
          disabled={
            isCreating ||
            tripName.trim().length === 0 ||
            ownerDisplayName.trim().length === 0
          }
        >
          {isCreating ? "Creating..." : "Create Trip"}
        </button>
      </form>
    </section>
  );
}
