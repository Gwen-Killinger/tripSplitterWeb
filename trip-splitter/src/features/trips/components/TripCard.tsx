import type { AccessibleTrip } from "../../../domain/models";

type TripCardProps = {
  accessibleTrip: AccessibleTrip;
  onSelect: () => void;
};

export function TripCard({
  accessibleTrip,
  onSelect,
}: TripCardProps) {
  const { trip, role } = accessibleTrip;

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

      <span className="trip-list-card__role">
        {role === "owner" ? "Owned" : "Shared"}
      </span>
    </button>
  );
}
