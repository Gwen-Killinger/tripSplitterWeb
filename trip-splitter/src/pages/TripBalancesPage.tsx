import { calculateBalances } from "../domain/calculateBalances";
import { useTripOutlet } from "../features/trips/hooks/useTripOutlet";
import { formatCurrency } from "../lib/currency";

export function TripBalancesPage() {
  const { trip } = useTripOutlet();

  const balances = calculateBalances(
    trip.members,
    trip.expenses,
  );

  return (
    <section>
      <h2>Balances</h2>

      <div className="expense-list">
        {balances.map((balance) => {
          const member = trip.members.find(
            (candidate) =>
              candidate.id === balance.memberId,
          );

          return (
            <article
              key={balance.memberId}
              className="expense-card"
            >
              <div className="expense-card__content">
                <div>
                  <h3>{member?.displayName ?? "Unknown member"}</h3>

                  <p>
                    Paid{" "}
                    {formatCurrency(
                      balance.paidCents,
                      trip.currencyCode,
                    )}
                  </p>

                  <p>
                    Owes{" "}
                    {formatCurrency(
                      balance.owedCents,
                      trip.currencyCode,
                    )}
                  </p>
                </div>

                <strong>
                  {balance.balanceCents >= 0 ? "+" : "−"}
                  {formatCurrency(
                    Math.abs(balance.balanceCents),
                    trip.currencyCode,
                  )}
                </strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}