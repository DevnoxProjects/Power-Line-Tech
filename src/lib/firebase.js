import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize core client instance
const app = initializeApp(firebaseConfig);

// Configure references with correct database bindings
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity Check: Verifies immediate Firebase network accessibility
async function testConnection() {
  try {
    const testDocRef = doc(db, "settings", "content");
    await getDoc(testDocRef);
    console.log("Firebase Connection Verified: Firestore is online.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("EPLT Alert: Local browser is offline. Check Firebase configuration.");
    } else {
      console.log("Firebase initialized. settings/content document may not exist yet, which is normal.");
    }
  }
}
testConnection();

export const OperationType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  GET: "get",
  WRITE: "write"
};

/**
 * Handles Firestore security rule violations and serializes them in structured JSON error formats
 */
export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      providerInfo: auth.currentUser?.providerData?.map(prov => ({
        providerId: prov.providerId,
        email: prov.email
      })) || []
    }
  };
  
  console.error("Firestore Security Halt:", JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
