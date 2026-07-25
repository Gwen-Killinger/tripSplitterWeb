import { useRef, useState } from "react";
import { MemberForm } from "../features/members/components/MemberForm";
import { useTripOutlet } from "../features/trips/hooks/useTripOutlet";
import { tripRepository } from "../repositories/repositoryInstance";

export function TripMembersPage() {
  const { trip, reload } = useTripOutlet();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] =
    useState<string | null>(null);
  const isSavingRef = useRef(false);

  async function handleSubmit(
    validatedDisplayName: string,
  ): Promise<void> {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      await tripRepository.addMember(trip.id, {
        displayName: validatedDisplayName,
      });

      setDisplayName("");
      reload();
    } catch (error) {
      console.error("Unable to add member:", error);

      const isDuplicateName =
        error instanceof Error &&
        error.message ===
          "A member with this name already exists.";

      setSaveError(
        isDuplicateName
          ? error.message
          : "Unable to add the member. Please try again.",
      );
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Members</h2>
          <p className="section-heading__subtitle">
            Add people who can pay for and share expenses.
          </p>
        </div>
      </div>

      <div className="expense-list">
        {trip.members.map((member) => (
          <article className="expense-card" key={member.id}>
            <div className="expense-card__content">
              <h3 className="expense-card__title">
                {member.displayName}
              </h3>
            </div>
          </article>
        ))}
      </div>

      <div className="form-page__header">
        <h2>Add a Member</h2>
      </div>

      <MemberForm
        members={trip.members}
        displayName={displayName}
        isSaving={isSaving}
        submitError={saveError}
        onDisplayNameChange={(value) => {
          setDisplayName(value);
          setSaveError(null);
        }}
        onSubmit={(value) => {
          void handleSubmit(value);
        }}
      />
    </section>
  );
}
