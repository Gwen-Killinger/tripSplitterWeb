import type { Auth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
} from "firebase/firestore";
import type {
  AcceptTripInviteResult,
  AccessibleTrip,
  Expense,
  Trip,
  TripInvite,
  TripMember,
  TripRole,
} from "../domain/models";
import { validateMemberDisplayName } from "../domain/validateMemberDisplayName";
import {
  generateInviteToken,
  hashInviteToken,
} from "../lib/inviteToken";
import type {
  AddExpenseInput,
  AddMemberInput,
  CreateTripInput,
  TripRepository,
  UpdateExpenseInput,
} from "./TripRepository";

type AuthorizedTrip = {
  tripSnapshot: DocumentSnapshot<DocumentData>;
  role: TripRole;
};

class TripAccessDeniedError extends Error {}

export class FirestoreTripRepository
  implements TripRepository
{
  private readonly db: Firestore;
  private readonly auth: Auth;

  constructor(db: Firestore, auth: Auth) {
    this.db = db;
    this.auth = auth;
  }

  private getCurrentUserId(): string {
    const currentUser = this.auth.currentUser;

    if (currentUser === null) {
      throw new Error("User is not authenticated.");
    }

    return currentUser.uid;
  }

  private async authorizeTrip(
    tripId: string,
  ): Promise<AuthorizedTrip | null> {
    const currentUserId = this.getCurrentUserId();
    const tripSnapshot = await getDoc(
      doc(this.db, "trips", tripId),
    );

    if (!tripSnapshot.exists()) {
      return null;
    }

    if (tripSnapshot.data().ownerId === currentUserId) {
      return {
        tripSnapshot,
        role: "owner",
      };
    }

    const collaboratorSnapshot = await getDoc(
      doc(
        this.db,
        "trips",
        tripId,
        "collaborators",
        currentUserId,
      ),
    );

    if (
      collaboratorSnapshot.exists() &&
      collaboratorSnapshot.data().role === "editor"
    ) {
      return {
        tripSnapshot,
        role: "editor",
      };
    }

    throw new TripAccessDeniedError(
      "User is not authorized to access this trip.",
    );
  }

  private async requireTripAccess(
    tripId: string,
  ): Promise<AuthorizedTrip> {
    const authorizedTrip = await this.authorizeTrip(tripId);

    if (authorizedTrip === null) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    return authorizedTrip;
  }

  private async requireTripOwner(
    tripId: string,
  ): Promise<AuthorizedTrip> {
    const authorizedTrip =
      await this.requireTripAccess(tripId);

    if (authorizedTrip.role !== "owner") {
      throw new Error(
        "User is not authorized to manage this trip.",
      );
    }

    return authorizedTrip;
  }

  private async loadTrip(
    tripSnapshot: DocumentSnapshot<DocumentData>,
  ): Promise<Trip> {
    const tripId = tripSnapshot.id;
    const [membersSnapshot, expensesSnapshot] =
      await Promise.all([
        getDocs(
          collection(
            this.db,
            "trips",
            tripId,
            "members",
          ),
        ),
        getDocs(
          collection(
            this.db,
            "trips",
            tripId,
            "expenses",
          ),
        ),
      ]);

    const members: TripMember[] =
      membersSnapshot.docs.map((memberDocument) => ({
        id: memberDocument.id,
        displayName: memberDocument.data().displayName,
      }));
    const expenses: Expense[] =
      expensesSnapshot.docs.map((expenseDocument) => {
        const expenseData = expenseDocument.data();

        return {
          id: expenseDocument.id,
          description: expenseData.description,
          amountCents: expenseData.amountCents,
          expenseDate: expenseData.expenseDate,
          paidByMemberId: expenseData.paidByMemberId,
          participantMemberIds:
            expenseData.participantMemberIds,
          splits: expenseData.splits,
          splitMode: expenseData.splitMode ?? "equal",
          notes: expenseData.notes,
        };
      });
    const tripData = tripSnapshot.data();

    return {
      id: tripId,
      name: tripData?.name,
      currencyCode: tripData?.currencyCode,
      members,
      expenses,
    };
  }

  async getTrip(
    tripId: string,
  ): Promise<AccessibleTrip | null> {
    const authorizedTrip = await this.authorizeTrip(tripId);

    if (authorizedTrip === null) {
      return null;
    }

    return {
      trip: await this.loadTrip(
        authorizedTrip.tripSnapshot,
      ),
      role: authorizedTrip.role,
    };
  }

  async getTrips(): Promise<AccessibleTrip[]> {
    const currentUserId = this.getCurrentUserId();
    const [ownedTripsSnapshot, accessSnapshot] =
      await Promise.all([
        getDocs(
          query(
            collection(this.db, "trips"),
            where("ownerId", "==", currentUserId),
          ),
        ),
        getDocs(
          collection(
            this.db,
            "users",
            currentUserId,
            "tripAccess",
          ),
        ),
      ]);

    const ownedTripIds = new Set(
      ownedTripsSnapshot.docs.map(
        (tripDocument) => tripDocument.id,
      ),
    );
    const ownedTripsPromise = Promise.all(
      ownedTripsSnapshot.docs.map(
        async (tripDocument): Promise<AccessibleTrip> => ({
          trip: await this.loadTrip(tripDocument),
          role: "owner",
        }),
      ),
    );
    const sharedTripsPromise = Promise.all(
      accessSnapshot.docs
        .filter(
          (accessDocument) =>
            !ownedTripIds.has(accessDocument.id),
        )
        .map(async (accessDocument) => {
          try {
            return await this.getTrip(accessDocument.id);
          } catch (error) {
            if (error instanceof TripAccessDeniedError) {
              return null;
            }

            throw error;
          }
        }),
    );
    const [ownedTrips, sharedTrips] = await Promise.all([
      ownedTripsPromise,
      sharedTripsPromise,
    ]);

    return [
      ...ownedTrips,
      ...sharedTrips.filter(
        (accessibleTrip): accessibleTrip is AccessibleTrip =>
          accessibleTrip !== null,
      ),
    ];
  }

  async createTrip(input: CreateTripInput): Promise<Trip> {
    const currentUserId = this.getCurrentUserId();
    const tripRef = doc(collection(this.db, "trips"));
    const batch = writeBatch(this.db);

    batch.set(tripRef, {
      name: input.name,
      currencyCode: input.currencyCode,
      ownerId: currentUserId,
      createdAt: serverTimestamp(),
    });
    batch.set(
      doc(
        this.db,
        "trips",
        tripRef.id,
        "members",
        currentUserId,
      ),
      {
        displayName: "You",
      },
    );
    batch.set(
      doc(
        this.db,
        "users",
        currentUserId,
        "tripAccess",
        tripRef.id,
      ),
      {
        tripId: tripRef.id,
        role: "owner",
        grantedAt: serverTimestamp(),
      },
    );

    await batch.commit();

    return {
      id: tripRef.id,
      name: input.name,
      currencyCode: input.currencyCode,
      members: [
        {
          id: currentUserId,
          displayName: "You",
        },
      ],
      expenses: [],
    };
  }

  async createTripInvite(
    tripId: string,
  ): Promise<TripInvite> {
    const currentUserId = this.getCurrentUserId();
    const token = generateInviteToken();
    const inviteHash = await hashInviteToken(token);
    const tripRef = doc(this.db, "trips", tripId);
    const inviteRef = doc(
      this.db,
      "tripInvites",
      inviteHash,
    );

    await runTransaction(this.db, async (transaction) => {
      const tripSnapshot = await transaction.get(tripRef);

      if (!tripSnapshot.exists()) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      if (
        tripSnapshot.data().ownerId !== currentUserId
      ) {
        throw new Error(
          "User is not authorized to create an invite.",
        );
      }

      transaction.set(inviteRef, {
        tripId,
        createdByUserId: currentUserId,
        status: "active",
        createdAt: serverTimestamp(),
      });
    });

    return { token };
  }

  async acceptTripInvite(
    inviteToken: string,
  ): Promise<AcceptTripInviteResult> {
    const currentUserId = this.getCurrentUserId();
    const inviteHash = await hashInviteToken(inviteToken);

    const inviteRef = doc(
      this.db,
      "tripInvites",
      inviteHash,
    );

    return runTransaction(this.db, async (transaction) => {
      const inviteSnapshot =
        await transaction.get(inviteRef);

      if (!inviteSnapshot.exists()) {
        throw new Error("Invite is invalid.");
      }

      const inviteData = inviteSnapshot.data();

      if (inviteData.status !== "active") {
        throw new Error("Invite is no longer active.");
      }

      const tripId = inviteData.tripId;

      if (inviteData.createdByUserId === currentUserId) {
        return {
          tripId,
          status: "already-owner",
        };
      }

      const collaboratorRef = doc(
        this.db,
        "trips",
        tripId,
        "collaborators",
        currentUserId,
      );

      const accessRef = doc(
        this.db,
        "users",
        currentUserId,
        "tripAccess",
        tripId,
      );

      const [
        collaboratorSnapshot,
        accessSnapshot,
      ] = await Promise.all([
        transaction.get(collaboratorRef),
        transaction.get(accessRef),
      ]);

      if (collaboratorSnapshot.exists()) {
        if (!accessSnapshot.exists()) {
          transaction.set(accessRef, {
            tripId,
            role: "editor",
            grantedAt: serverTimestamp(),
          });
        }

        return {
          tripId,
          status: "already-collaborator",
        };
      }

      transaction.set(collaboratorRef, {
        role: "editor",
        joinedAt: serverTimestamp(),
        inviteHash,
      });

      transaction.set(accessRef, {
        tripId,
        role: "editor",
        grantedAt: serverTimestamp(),
      });

      return {
        tripId,
        status: "joined",
      };
    });
  }

  async deleteTrip(tripId: string): Promise<void> {
    const authorizedTrip =
      await this.requireTripOwner(tripId);
    const tripRef = authorizedTrip.tripSnapshot.ref;
    const ownerId =
      authorizedTrip.tripSnapshot.data()?.ownerId;
    const [
      membersSnapshot,
      expensesSnapshot,
      collaboratorsSnapshot,
      invitesSnapshot,
    ] = await Promise.all([
      getDocs(
        collection(
          this.db,
          "trips",
          tripId,
          "members",
        ),
      ),
      getDocs(
        collection(
          this.db,
          "trips",
          tripId,
          "expenses",
        ),
      ),
      getDocs(
        collection(
          this.db,
          "trips",
          tripId,
          "collaborators",
        ),
      ),
      getDocs(
        query(
          collection(this.db, "tripInvites"),
          where("tripId", "==", tripId),
        ),
      ),
    ]);

    const deletionGroups: DocumentReference<DocumentData>[][] =
      [
        ...membersSnapshot.docs.map((document) => [
          document.ref,
        ]),
        ...expensesSnapshot.docs.map((document) => [
          document.ref,
        ]),
        ...invitesSnapshot.docs.map((document) => [
          document.ref,
        ]),
        ...collaboratorsSnapshot.docs.map((document) => [
          document.ref,
          doc(
            this.db,
            "users",
            document.id,
            "tripAccess",
            tripId,
          ),
        ]),
        [
          doc(
            this.db,
            "users",
            ownerId,
            "tripAccess",
            tripId,
          ),
        ],
      ];
    let pendingReferences: DocumentReference<DocumentData>[] =
      [];

    for (const group of deletionGroups) {
      if (pendingReferences.length + group.length > 500) {
        await this.commitDeleteBatch(pendingReferences);
        pendingReferences = [];
      }

      pendingReferences.push(...group);
    }

    if (pendingReferences.length === 500) {
      await this.commitDeleteBatch(pendingReferences);
      pendingReferences = [];
    }

    const finalBatch = writeBatch(this.db);

    for (const reference of pendingReferences) {
      finalBatch.delete(reference);
    }

    finalBatch.delete(tripRef);
    await finalBatch.commit();
  }

  private async commitDeleteBatch(
    references: DocumentReference<DocumentData>[],
  ): Promise<void> {
    const batch = writeBatch(this.db);

    for (const reference of references) {
      batch.delete(reference);
    }

    await batch.commit();
  }

  async addMember(
    tripId: string,
    input: AddMemberInput,
  ): Promise<TripMember> {
    await this.requireTripAccess(tripId);

    const membersRef = collection(
      this.db,
      "trips",
      tripId,
      "members",
    );
    const membersSnapshot = await getDocs(membersRef);
    const members: TripMember[] =
      membersSnapshot.docs.map((memberDocument) => ({
        id: memberDocument.id,
        displayName: memberDocument.data().displayName,
      }));
    const displayName = validateMemberDisplayName(
      input.displayName,
      members,
    );
    const memberRef = await addDoc(membersRef, {
      displayName,
    });

    return {
      id: memberRef.id,
      displayName,
    };
  }

  async addExpense(
    tripId: string,
    input: AddExpenseInput,
  ): Promise<Expense> {
    const currentUserId = this.getCurrentUserId();
    await this.requireTripAccess(tripId);

    const expenseRef = await addDoc(
      collection(
        this.db,
        "trips",
        tripId,
        "expenses",
      ),
      {
        ...input,
        notes: input.notes ?? "",
        createdByUserId: currentUserId,
        createdAt: serverTimestamp(),
      },
    );

    return {
      id: expenseRef.id,
      ...input,
    };
  }

  async updateExpense(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<Expense> {
    const currentUserId = this.getCurrentUserId();
    await this.requireTripAccess(tripId);

    await updateDoc(
      doc(
        this.db,
        "trips",
        tripId,
        "expenses",
        expenseId,
      ),
      {
        ...input,
        notes: input.notes ?? "",
        updatedByUserId: currentUserId,
        updatedAt: serverTimestamp(),
      },
    );

    return {
      id: expenseId,
      ...input,
    };
  }

  async deleteExpense(
    tripId: string,
    expenseId: string,
  ): Promise<void> {
    await this.requireTripAccess(tripId);
    await deleteDoc(
      doc(
        this.db,
        "trips",
        tripId,
        "expenses",
        expenseId,
      ),
    );
  }
}
