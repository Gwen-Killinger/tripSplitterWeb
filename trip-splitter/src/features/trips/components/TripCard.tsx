import type { Trip } from "../../../domain/models";

type TripCardProps = {
  trip: Trip;
  onSelect: () => void;
};

export function TripCard({
  trip,
  onSelect,
}: TripCardProps) {
  return (
    <button
      className="trip-list-card"
      type="button"
      onClick={onSelect}
    >
      <span className="trip-list-card__name">
        {trip.name}
      </span>

      <span className="trip-list-card__details">
        {trip.currencyCode} · {trip.members.length}{" "}
        {trip.members.length === 1 ? "member" : "members"} ·{" "}
        {trip.expenses.length}{" "}
        {trip.expenses.length === 1 ? "expense" : "expenses"}
      </span>
    </button>
  );
}
