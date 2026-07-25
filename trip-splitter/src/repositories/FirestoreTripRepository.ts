import type { Auth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type {
  Expense,
  Trip,
  TripMember,
} from "../domain/models";
import { validateMemberDisplayName } from "../domain/validateMemberDisplayName";

import type {
  AddExpenseInput,
  AddMemberInput,
  CreateTripInput,
  TripRepository,
  UpdateExpenseInput,
} from "./TripRepository";

export class FirestoreTripRepository
  implements TripRepository
{
  private readonly db: Firestore;
  private readonly auth: Auth;

  constructor(db: Firestore, auth: Auth) {
    this.db = db;
    this.auth = auth;
  }

  async getTrip(tripId: string): Promise<Trip | null> {
    const tripRef = doc(this.db, "trips", tripId);
    const membersRef = collection(
      this.db,
      "trips",
      tripId,
      "members",
    );
    const expensesRef = collection(
      this.db,
      "trips",
      tripId,
      "expenses",
    );

    const [
      tripSnapshot,
      membersSnapshot,
      expensesSnapshot,
    ] = await Promise.all([
      getDoc(tripRef),
      getDocs(membersRef),
      getDocs(expensesRef),
    ]);

    if (!tripSnapshot.exists()) {
      return null;
    }

    const tripData = tripSnapshot.data();

    const members: TripMember[] =
      membersSnapshot.docs.map((memberDocument) => {
        const memberData = memberDocument.data();

        return {
          id: memberDocument.id,
          displayName: memberData.displayName,
        };
      });

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
          notes: expenseData.notes,
        };
      });

    return {
      id: tripSnapshot.id,
      name: tripData.name,
      currencyCode: tripData.currencyCode,
      members,
      expenses,
    };
  }

  async getTrips(): Promise<Trip[]> {
    throw new Error("getTrips is not implemented yet.");
  }

  async createTrip(
    input: CreateTripInput,
  ): Promise<Trip> {
    const currentUser = this.auth.currentUser;

    if (currentUser === null) {
      throw new Error("User is not authenticated.");
    }

    const tripRef = await addDoc(
      collection(this.db, "trips"),
      {
        name: input.name,
        currencyCode: input.currencyCode,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
      },
    );

    await setDoc(
      doc(
        this.db,
        "trips",
        tripRef.id,
        "members",
        currentUser.uid,
      ),
      {
        displayName: "You",
      },
    );

    return {
      id: tripRef.id,
      name: input.name,
      currencyCode: input.currencyCode,
      members: [
        {
          id: currentUser.uid,
          displayName: "You",
        },
      ],
      expenses: [],
    };
  }

  async addMember(
    tripId: string,
    input: AddMemberInput,
  ): Promise<TripMember> {
    const currentUser = this.auth.currentUser;

    if (currentUser === null) {
      throw new Error("User is not authenticated.");
    }

    const tripRef = doc(this.db, "trips", tripId);
    const membersRef = collection(
      this.db,
      "trips",
      tripId,
      "members",
    );

    const [tripSnapshot, membersSnapshot] =
      await Promise.all([
        getDoc(tripRef),
        getDocs(membersRef),
      ]);

    if (!tripSnapshot.exists()) {
      throw new Error(`Trip not found: ${tripId}`);
    }

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
    const currentUser = this.auth.currentUser;

    if (currentUser === null) {
      throw new Error("User is not authenticated.");
    }

    const expenseRef = await addDoc(
      collection(
        this.db,
        "trips",
        tripId,
        "expenses",
      ),
      {
        description: input.description,
        amountCents: input.amountCents,
        expenseDate: input.expenseDate,
        paidByMemberId: input.paidByMemberId,
        participantMemberIds: input.participantMemberIds,
        splits: input.splits,
        notes: input.notes ?? "",
        createdByUserId: currentUser.uid,
        createdAt: serverTimestamp(),
      },
    );

    return {
      id: expenseRef.id,
      description: input.description,
      amountCents: input.amountCents,
      expenseDate: input.expenseDate,
      paidByMemberId: input.paidByMemberId,
      participantMemberIds: input.participantMemberIds,
      splits: input.splits,
      notes: input.notes,
    };
  }

async updateExpense(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<Expense> {
    const currentUser = this.auth.currentUser;

    if (currentUser === null) {
      throw new Error("User is not authenticated.");
    }

    const expenseRef = doc(
      this.db,
      "trips",
      tripId,
      "expenses",
      expenseId,
    );

    await updateDoc(expenseRef, {
      description: input.description,
      amountCents: input.amountCents,
      expenseDate: input.expenseDate,
      paidByMemberId: input.paidByMemberId,
      participantMemberIds: input.participantMemberIds,
      splits: input.splits,
      notes: input.notes ?? "",
      updatedByUserId: currentUser.uid,
      updatedAt: serverTimestamp(),
    });

    return {
      id: expenseId,
      description: input.description,
      amountCents: input.amountCents,
      expenseDate: input.expenseDate,
      paidByMemberId: input.paidByMemberId,
      participantMemberIds: input.participantMemberIds,
      splits: input.splits,
      notes: input.notes,
    };
  }

  async deleteExpense(
    tripId: string,
    expenseId: string,
  ): Promise<void> {
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
