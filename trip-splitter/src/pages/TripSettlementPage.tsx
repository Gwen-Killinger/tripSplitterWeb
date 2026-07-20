import { calculateBalances } from "../domain/calculateBalances";
import { calculateSettlements } from "../domain/calculateSettlements";
import { useTripOutlet } from "../features/trips/hooks/useTripOutlet";
import { formatCurrency } from "../lib/currency";

export function TripSettlementPage() {
  const { trip } = useTripOutlet();

  const balances = calculateBalances(
    trip.members,
    trip.expenses,
  );

  const settlements = calculateSettlements(balances);

  function getMemberName(memberId: string): string {
    return (
      trip.members.find((member) => member.id === memberId)
        ?.displayName ?? "Unknown member"
    );
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Settle Up</h2>

          <p className="section-heading__subtitle">
            A compact payment plan for settling the trip.
          </p>
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🎉
          </span>

          <h3>Everyone is settled up!</h3>
          <p>No payments are needed.</p>
        </div>
      ) : (
        <div className="settlement-list">
          {settlements.map((settlement) => (
            <article
              className="settlement-card"
              key={`${settlement.fromMemberId}-${settlement.toMemberId}`}
            >
              <div>
                <strong>
                  {getMemberName(settlement.fromMemberId)}
                </strong>

                <span className="settlement-card__direction">
                  {" "}
                  pays{" "}
                </span>

                <strong>
                  {getMemberName(settlement.toMemberId)}
                </strong>
              </div>

              <strong className="settlement-card__amount">
                {formatCurrency(
                  settlement.amountCents,
                  trip.currencyCode,
                )}
              </strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}