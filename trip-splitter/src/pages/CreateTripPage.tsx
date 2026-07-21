import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";

import { tripRepository } from "../repositories/repositoryInstance";

export function CreateTripPage() {
  const navigate = useNavigate();

  const [tripName, setTripName] = useState("");
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

    setIsCreating(true);
    setError(null);

    try {
      const trip = await tripRepository.createTrip({
        name: trimmedTripName,
        currencyCode,
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
          disabled={isCreating || tripName.trim().length === 0}
        >
          {isCreating ? "Creating..." : "Create Trip"}
        </button>
      </form>
    </section>
  );
}
