import { calculateBalances } from "../domain/calculateBalances";
import { formatCurrency } from "../lib/currency";
import { mockTrip } from "../lib/mockTrip";

export function TripBalancesPage() {
  const balances = calculateBalances(
    mockTrip.members,
    mockTrip.expenses,
  );

  return (
    <section>
      <h2>Balances</h2>

      <div className="expense-list">
        {balances.map((balance) => {
          const member = mockTrip.members.find(
            (m) => m.id === balance.memberId,
          );

          return (
            <article
              key={balance.memberId}
              className="expense-card"
            >
              <div className="expense-card__content">
                <div>
                  <h3>{member?.displayName}</h3>

                  <p>
                    Paid{" "}
                    {formatCurrency(balance.paidCents)}
                  </p>

                  <p>
                    Owes{" "}
                    {formatCurrency(balance.owedCents)}
                  </p>
                </div>

                <strong>
                  {balance.balanceCents >= 0
                    ? "+"
                    : "-"}
                  {formatCurrency(
                    Math.abs(balance.balanceCents),
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