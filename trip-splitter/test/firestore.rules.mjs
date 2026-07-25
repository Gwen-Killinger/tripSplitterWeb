import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const projectId = "trip-splitter-rules-test";
const emulatorAddress =
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const [host, portText] = emulatorAddress.split(":");
const rules = await readFile(
  new URL("../firestore.rules", import.meta.url),
  "utf8",
);
const testEnvironment = await initializeTestEnvironment({
  projectId,
  firestore: {
    host,
    port: Number(portText),
    rules,
  },
});

const ownerId = "owner-user";
const editorId = "editor-user";
const invitedId = "invited-user";
const unrelatedId = "unrelated-user";
const tripId = "shared-trip";
const inviteHash = "a".repeat(64);

function authenticatedDb(userId) {
  return testEnvironment
    .authenticatedContext(userId)
    .firestore();
}

function unauthenticatedDb() {
  return testEnvironment
    .unauthenticatedContext()
    .firestore();
}

async function seedDocuments(entries) {
  await testEnvironment.withSecurityRulesDisabled(
    async (context) => {
      const db = context.firestore();

      for (const [path, data] of entries) {
        await setDoc(doc(db, path), data);
      }
    },
  );
}

async function seedTrip({
  includeEditor = false,
  includeOwnerIndex = false,
} = {}) {
  const entries = [
    [
      `trips/${tripId}`,
      {
        name: "Shared Trip",
        currencyCode: "USD",
        ownerId,
        createdAt: new Date(),
      },
    ],
  ];

  if (includeEditor) {
    entries.push(
      [
        `trips/${tripId}/collaborators/${editorId}`,
        {
          role: "editor",
          joinedAt: new Date(),
          inviteHash,
        },
      ],
      [
        `users/${editorId}/tripAccess/${tripId}`,
        {
          tripId,
          role: "editor",
          grantedAt: new Date(),
        },
      ],
    );
  }

  if (includeOwnerIndex) {
    entries.push([
      `users/${ownerId}/tripAccess/${tripId}`,
      {
        tripId,
        role: "owner",
        grantedAt: new Date(),
      },
    ]);
  }

  await seedDocuments(entries);
}

async function seedActiveInvite() {
  await seedDocuments([
    [
      `tripInvites/${inviteHash}`,
      {
        tripId,
        createdByUserId: ownerId,
        status: "active",
        createdAt: new Date(),
      },
    ],
  ]);
}

async function redeemInvite(
  userId,
  targetTripId = tripId,
  targetUserId = userId,
) {
  const db = authenticatedDb(userId);

  return runTransaction(db, async (transaction) => {
    const inviteRef = doc(
      db,
      "tripInvites",
      inviteHash,
    );
    const inviteSnapshot =
      await transaction.get(inviteRef);
    const redeemedTripId =
      inviteSnapshot.data()?.tripId ?? targetTripId;
    const collaboratorRef = doc(
      db,
      "trips",
      targetTripId,
      "collaborators",
      targetUserId,
    );
    const accessRef = doc(
      db,
      "users",
      targetUserId,
      "tripAccess",
      targetTripId,
    );

    transaction.set(collaboratorRef, {
      role: "editor",
      joinedAt: serverTimestamp(),
      inviteHash,
    });
    transaction.set(accessRef, {
      tripId: redeemedTripId,
      role: "editor",
      grantedAt: serverTimestamp(),
    });
  });
}

async function acceptExistingInvite(userId) {
  const db = authenticatedDb(userId);

  return runTransaction(db, async (transaction) => {
    const inviteRef = doc(
      db,
      "tripInvites",
      inviteHash,
    );
    const collaboratorRef = doc(
      db,
      "trips",
      tripId,
      "collaborators",
      userId,
    );
    const accessRef = doc(
      db,
      "users",
      userId,
      "tripAccess",
      tripId,
    );
    const [
      inviteSnapshot,
      collaboratorSnapshot,
      accessSnapshot,
    ] = await Promise.all([
      transaction.get(inviteRef),
      transaction.get(collaboratorRef),
      transaction.get(accessRef),
    ]);

    if (
      inviteSnapshot.data()?.status == "active"
      && collaboratorSnapshot.exists()
      && !accessSnapshot.exists()
    ) {
      transaction.set(accessRef, {
        tripId,
        role: "editor",
        grantedAt: serverTimestamp(),
      });
    }
  });
}

const tests = [];

function test(name, body) {
  tests.push({ name, body });
}

test("denies unauthenticated access", async () => {
  await seedTrip();

  await assertFails(
    getDoc(doc(unauthenticatedDb(), "trips", tripId)),
  );
});

test("allows a legacy owner to read without an access index", async () => {
  await seedTrip();

  const snapshot = await assertSucceeds(
    getDoc(doc(authenticatedDb(ownerId), "trips", tripId)),
  );

  assert.equal(snapshot.data()?.ownerId, ownerId);
});

test("allows the exact new-trip creation batch", async () => {
  const db = authenticatedDb(ownerId);
  const newTripId = "new-trip";
  const batch = writeBatch(db);

  batch.set(doc(db, "trips", newTripId), {
    name: "New Trip",
    currencyCode: "USD",
    ownerId,
    ownerMemberId: ownerId,
    createdAt: serverTimestamp(),
  });
  batch.set(
    doc(
      db,
      "trips",
      newTripId,
      "members",
      ownerId,
    ),
    {
      displayName: "Gwen",
    },
  );
  batch.set(
    doc(
      db,
      "users",
      ownerId,
      "tripAccess",
      newTripId,
    ),
    {
      tripId: newTripId,
      role: "owner",
      grantedAt: serverTimestamp(),
    },
  );

  await assertSucceeds(batch.commit());
});

test("rejects malformed or incomplete new-trip bootstraps", async () => {
  async function commitBootstrap({
    newTripId,
    ownerMemberId = ownerId,
    displayName = "Gwen",
    includeOwnerMember = true,
  }) {
    const db = authenticatedDb(ownerId);
    const batch = writeBatch(db);

    batch.set(doc(db, "trips", newTripId), {
      name: "New Trip",
      currencyCode: "USD",
      ownerId,
      ownerMemberId,
      createdAt: serverTimestamp(),
    });

    if (includeOwnerMember) {
      batch.set(
        doc(
          db,
          "trips",
          newTripId,
          "members",
          ownerMemberId,
        ),
        { displayName },
      );
    }

    batch.set(
      doc(
        db,
        "users",
        ownerId,
        "tripAccess",
        newTripId,
      ),
      {
        tripId: newTripId,
        role: "owner",
        grantedAt: serverTimestamp(),
      },
    );

    return batch.commit();
  }

  await assertFails(
    commitBootstrap({
      newTripId: "wrong-owner-member",
      ownerMemberId: "someone-else",
    }),
  );
  await assertFails(
    commitBootstrap({
      newTripId: "missing-owner-member",
      includeOwnerMember: false,
    }),
  );
  await assertFails(
    commitBootstrap({
      newTripId: "blank-owner-name",
      displayName: "   ",
    }),
  );

  const db = authenticatedDb(ownerId);
  const missingFieldBatch = writeBatch(db);
  const missingFieldTripId = "missing-owner-member-id";

  missingFieldBatch.set(
    doc(db, "trips", missingFieldTripId),
    {
      name: "New Trip",
      currencyCode: "USD",
      ownerId,
      createdAt: serverTimestamp(),
    },
  );
  missingFieldBatch.set(
    doc(
      db,
      "trips",
      missingFieldTripId,
      "members",
      ownerId,
    ),
    { displayName: "Gwen" },
  );
  missingFieldBatch.set(
    doc(
      db,
      "users",
      ownerId,
      "tripAccess",
      missingFieldTripId,
    ),
    {
      tripId: missingFieldTripId,
      role: "owner",
      grantedAt: serverTimestamp(),
    },
  );

  await assertFails(missingFieldBatch.commit());
});

test("allows the owned-trip listing query", async () => {
  await seedTrip();
  const db = authenticatedDb(ownerId);

  const snapshot = await assertSucceeds(
    getDocs(
      query(
        collection(db, "trips"),
        where("ownerId", "==", ownerId),
      ),
    ),
  );

  assert.equal(snapshot.size, 1);
});

test("allows an editor and denies an unrelated user", async () => {
  await seedTrip({ includeEditor: true });

  await assertSucceeds(
    getDoc(doc(authenticatedDb(editorId), "trips", tripId)),
  );
  await assertFails(
    getDoc(
      doc(authenticatedDb(unrelatedId), "trips", tripId),
    ),
  );
});

test("allows editors to manage members and expenses", async () => {
  await seedTrip({ includeEditor: true });
  const db = authenticatedDb(editorId);
  const memberRef = doc(
    db,
    "trips",
    tripId,
    "members",
    "member-one",
  );
  const expenseRef = doc(
    db,
    "trips",
    tripId,
    "expenses",
    "expense-one",
  );

  await assertSucceeds(
    setDoc(memberRef, { displayName: "Alex" }),
  );
  await assertSucceeds(
    updateDoc(memberRef, { displayName: "Alexandra" }),
  );
  await assertSucceeds(
    setDoc(expenseRef, {
      description: "Dinner",
      amountCents: 1000,
    }),
  );
  await assertSucceeds(
    updateDoc(expenseRef, { amountCents: 1200 }),
  );
  await assertSucceeds(deleteDoc(expenseRef));
  await assertSucceeds(deleteDoc(memberRef));
});

test("prevents editors from creating invites or deleting trips", async () => {
  await seedTrip({ includeEditor: true });
  const db = authenticatedDb(editorId);

  await assertFails(
    setDoc(doc(db, "tripInvites", "b".repeat(64)), {
      tripId,
      createdByUserId: editorId,
      status: "active",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    deleteDoc(doc(db, "trips", tripId)),
  );
});

test("allows an owner to create a correctly shaped invite", async () => {
  await seedTrip();
  const db = authenticatedDb(ownerId);

  await assertSucceeds(
    runTransaction(db, async (transaction) => {
      await transaction.get(doc(db, "trips", tripId));
      transaction.set(
        doc(db, "tripInvites", inviteHash),
        {
          tripId,
          createdByUserId: ownerId,
          status: "active",
          createdAt: serverTimestamp(),
        },
      );
    }),
  );
});

test("accepts a valid invite atomically for the invited user", async () => {
  await seedTrip();
  await seedActiveInvite();

  await assertSucceeds(redeemInvite(invitedId));

  const db = authenticatedDb(invitedId);
  await assertSucceeds(
    getDoc(doc(db, "trips", tripId)),
  );
  await assertSucceeds(
    getDoc(
      doc(db, "users", invitedId, "tripAccess", tripId),
    ),
  );
});

test("rejects partial and malformed invite redemption", async () => {
  await seedTrip();
  await seedActiveInvite();
  const db = authenticatedDb(invitedId);

  await assertFails(
    setDoc(
      doc(
        db,
        "trips",
        tripId,
        "collaborators",
        invitedId,
      ),
      {
        role: "editor",
        joinedAt: serverTimestamp(),
        inviteHash,
      },
    ),
  );

  const malformedBatch = writeBatch(db);
  malformedBatch.set(
    doc(
      db,
      "trips",
      tripId,
      "collaborators",
      invitedId,
    ),
    {
      role: "editor",
      joinedAt: serverTimestamp(),
      inviteHash,
    },
  );
  malformedBatch.set(
    doc(
      db,
      "users",
      invitedId,
      "tripAccess",
      tripId,
    ),
    {
      tripId: "different-trip",
      role: "editor",
      grantedAt: serverTimestamp(),
    },
  );

  await assertFails(malformedBatch.commit());
});

test("prevents arbitrary or cross-user access grants", async () => {
  await seedTrip();
  await seedActiveInvite();
  const db = authenticatedDb(invitedId);

  await assertFails(
    setDoc(
      doc(
        db,
        "users",
        invitedId,
        "tripAccess",
        tripId,
      ),
      {
        tripId,
        role: "editor",
        grantedAt: serverTimestamp(),
      },
    ),
  );
  await assertFails(
    redeemInvite(invitedId, tripId, unrelatedId),
  );
});

test("does not treat an access index as permission", async () => {
  await seedTrip();
  await seedDocuments([
    [
      `users/${unrelatedId}/tripAccess/${tripId}`,
      {
        tripId,
        role: "editor",
        grantedAt: new Date(),
      },
    ],
  ]);

  await assertFails(
    getDoc(
      doc(authenticatedDb(unrelatedId), "trips", tripId),
    ),
  );
});

test("prevents reading another user's access index", async () => {
  await seedTrip({ includeEditor: true });

  await assertFails(
    getDoc(
      doc(
        authenticatedDb(unrelatedId),
        "users",
        editorId,
        "tripAccess",
        tripId,
      ),
    ),
  );
});

test("allows repeated acceptance and access-index repair", async () => {
  await seedTrip({ includeEditor: true });
  await seedActiveInvite();

  await assertSucceeds(acceptExistingInvite(editorId));

  await testEnvironment.withSecurityRulesDisabled(
    async (context) => {
      await deleteDoc(
        doc(
          context.firestore(),
          "users",
          editorId,
          "tripAccess",
          tripId,
        ),
      );
    },
  );

  await assertSucceeds(
    acceptExistingInvite(editorId),
  );
});

test("allows the owner deletion flow to clean sharing data", async () => {
  await seedTrip({
    includeEditor: true,
    includeOwnerIndex: true,
  });
  await seedActiveInvite();
  await seedDocuments([
    [
      `trips/${tripId}/members/member-one`,
      { displayName: "Alex" },
    ],
    [
      `trips/${tripId}/expenses/expense-one`,
      { description: "Dinner", amountCents: 1000 },
    ],
  ]);
  const db = authenticatedDb(ownerId);
  const collaborators = await assertSucceeds(
    getDocs(
      collection(
        db,
        "trips",
        tripId,
        "collaborators",
      ),
    ),
  );
  const invites = await assertSucceeds(
    getDocs(
      query(
        collection(db, "tripInvites"),
        where("tripId", "==", tripId),
      ),
    ),
  );
  const childBatch = writeBatch(db);

  childBatch.delete(
    doc(db, "trips", tripId, "members", "member-one"),
  );
  childBatch.delete(
    doc(
      db,
      "trips",
      tripId,
      "expenses",
      "expense-one",
    ),
  );
  childBatch.delete(collaborators.docs[0].ref);
  childBatch.delete(
    doc(
      db,
      "users",
      editorId,
      "tripAccess",
      tripId,
    ),
  );
  childBatch.delete(
    doc(
      db,
      "users",
      ownerId,
      "tripAccess",
      tripId,
    ),
  );
  childBatch.delete(invites.docs[0].ref);

  await assertSucceeds(childBatch.commit());
  await assertSucceeds(
    deleteDoc(doc(db, "trips", tripId)),
  );
});

let failures = 0;

try {
  for (const { name, body } of tests) {
    await testEnvironment.clearFirestore();

    try {
      await body();
      console.log(`✓ ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`✗ ${name}`);
      console.error(error);
    }
  }
} finally {
  await testEnvironment.cleanup();
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${tests.length} Firestore rules tests passed.`);
}
