import type { Auth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type {
  Expense,
  Trip,
  TripMember,
} from "../domain/models";

import type {
  AddExpenseInput,
  CreateTripInput,
  TripRepository,
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

  async addExpense(
    _tripId: string,
    _input: AddExpenseInput,
  ): Promise<Expense> {
    throw new Error("addExpense is not implemented yet.");
  }
}