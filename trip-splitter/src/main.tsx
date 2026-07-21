import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/router";
import "./index.css";
import "./styles/layout.css";

import { auth } from "./firebase/auth";
import { db } from "./firebase/firestore";
import { ensureAuthenticated } from "./firebase/ensureAuthenticated";
import { testFirestoreConnection } from "./firebase/testConnection";

async function initializeFirebase() {
  const user = await ensureAuthenticated();

  console.log("Signed in anonymously:", user.uid);

  await testFirestoreConnection();
}

void initializeFirebase();
void testFirestoreConnection();

console.log("Firebase App:", auth.app.name);
console.log("Project ID:", db.app.options.projectId);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);