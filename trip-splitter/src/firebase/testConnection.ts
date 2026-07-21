import { collection, getDocs } from "firebase/firestore";
import { db } from "./firestore";

export async function testFirestoreConnection() {
  const snapshot = await getDocs(collection(db, "test"));
  console.log("Connected to Firestore!");
  console.log("Documents:", snapshot.size);
}