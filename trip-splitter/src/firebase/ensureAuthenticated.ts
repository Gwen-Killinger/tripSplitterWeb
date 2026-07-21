import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { auth } from "./auth";

export function ensureAuthenticated(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();

        if (user) {
          resolve(user);
          return;
        }

        try {
          const credential = await signInAnonymously(auth);
          resolve(credential.user);
        } catch (error) {
          reject(error);
        }
      },
      reject,
    );
  });
}