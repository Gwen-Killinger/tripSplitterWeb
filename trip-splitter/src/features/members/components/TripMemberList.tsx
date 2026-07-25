import type { TripMember } from "../../../domain/models";

type TripMemberListProps = {
  members: TripMember[];
  ownerMemberId: string;
};

export function TripMemberList({
  members,
  ownerMemberId,
}: TripMemberListProps) {
  return (
    <div className="expense-list">
      {members.map((member) => {
        const isOwner = member.id === ownerMemberId;
        const visibleName =
          isOwner && member.displayName === "You"
            ? "Owner"
            : member.displayName;

        return (
          <article className="expense-card" key={member.id}>
            <div className="expense-card__content">
              <h3 className="expense-card__title member-name">
                <span>{visibleName}</span>
                {isOwner && (
                  <span className="role-badge">Owner</span>
                )}
              </h3>
            </div>
          </article>
        );
      })}
    </div>
  );
}
