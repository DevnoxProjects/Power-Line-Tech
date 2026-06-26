# Database Architecture Guide: Firebase Integration & Admin Auth (EPLT)

This guide provides a comprehensive, production-ready blueprint to transition **Power Line Tech (EPLT)** from its initial server-local JSON file storage (`data/content.json` and `data/inquiries.json`) to a cloud-based, real-time infrastructure powered by **Google Firebase**.

We will integrate **Firebase Authentication** for Admin Sign-In & Self-Service Password Recovery, and **Cloud Firestore** for dynamic content publishing and client inquiry tracking (CRM Leads ledger), backed by Zero-Trust **Firestore Security Rules**.

---

## 1. Architecture Overview & Package Setup

### Current State vs. Firebase Cloud Architecture

| Feature | Current Local Setup | Proposed Firebase Setup |
| :--- | :--- | :--- |
| **Data Persistence** | Local JSON files (`content.json`, `inquiries.json`) | **Cloud Firestore** (NoSQL Real-Time Database) |
| **Admin Authentication** | Hardcoded properties in `content.json` checked via `/api/admin/verify` | **Firebase Authentication** (Secure token-based auth) |
| **Password Recovery** | None (requires manual server-side file edits) | **Forgot Password Self-Service** (Firebase Reset Emails) |
| **Scalability** | Standard file I/O bottlenecked by concurrent requests | Cloud infrastructure supporting millions of concurrent read/writes |

### Package Installation

Run the following command in your terminal to install the client SDK dependencies:

```bash
npm install firebase
```

For security hardening and rules verification during development, install the Firebase ESLint rules:

```bash
npm install --save-dev @firebase/eslint-plugin-security-rules
```

---

## 2. Setting Up the Firebase Project & Authentication

To provision Firebase for this application, follow these sequential steps:

### Step 2.1: Create Project in Firebase Console
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, name it `eplt-substation-systems`, and complete creation.
3. In the sidebar, click the **Settings Cog (Project Settings)** and scroll to **Your Apps**. Click the Web Icon (`</>`) to register a new Web App.
4. Copy the generated `firebaseConfig` keys. You will save them locally in a file named `firebase-applet-config.json` in your project root:

```json
{
  "apiKey": "AIzaSyA1...",
  "authDomain": "eplt-substation-systems.firebaseapp.com",
  "projectId": "eplt-substation-systems",
  "storageBucket": "eplt-substation-systems.appspot.com",
  "messagingSenderId": "1234567890",
  "appId": "1:1234567890:web:abcdef123456",
  "firestoreDatabaseId": "(default)"
}
```

### Step 2.2: Enable Email/Password Authentication
1. In the Firebase Console sidebar, click **Authentication** and then **Get Started**.
2. Go to the **Sign-in Method** tab.
3. Select **Email/Password**, toggle **Enabled**, and save.
4. Navigate to the **Users** tab and click **Add User** to seed your first administrative account:
   * **Email**: `admin@eplt.com`
   * **Password**: Create a temporary secure password.

---

## 3. Database Modeling: `firebase-blueprint.json`

To declare the formal schema structure of EPLT's published content and lead database, we construct the intermediate schema representation in `/firebase-blueprint.json` as shown below.

```json
{
  "entities": {
    "content": {
      "title": "EPLT Dynamic Page Configuration",
      "description": "Dynamic layout texts, slide headers, supplier origins, and product technical sheets.",
      "type": "object",
      "properties": {
        "brandName": { "type": "string", "description": "Corporate title e.g. Remix: Power Line Tech" },
        "brandAbbr": { "type": "string", "description": "Abbreviated brand e.g. EPLT" },
        "headerHotline": { "type": "string", "description": "Direct administrative support phone" },
        "contact": {
          "type": "object",
          "properties": {
            "address": { "type": "string" },
            "email": { "type": "string", "format": "email" },
            "hotline1": { "type": "string" },
            "hotline2": { "type": "string" },
            "gsheetWebhookUrl": { "type": "string", "format": "uri" }
          }
        },
        "about": {
          "type": "object",
          "properties": {
            "mission": { "type": "string" },
            "vision": { "type": "string" },
            "qualityPolicy": { "type": "string" }
          }
        },
        "materials": {
          "type": "object",
          "properties": {
            "coreOrigin": { "type": "string" },
            "insulationOrigin": { "type": "string" },
            "oilOrigin": { "type": "string" },
            "copperOrigin": { "type": "string" }
          }
        },
        "transformers": {
          "type": "array",
          "description": "Technical matrix of substation power & distribution transformers"
        }
      },
      "required": ["brandName", "brandAbbr", "contact"]
    },
    "inquiry": {
      "title": "Customer Substation Inquiry",
      "description": "Inbound CRM leads logged via dynamic request matrices.",
      "type": "object",
      "properties": {
        "id": { "type": "string", "description": "Unique inquiry token" },
        "name": { "type": "string", "description": "Customer name" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string", "description": "Contact phone" },
        "requirements": { "type": "string", "description": "Substation capacity or losses specs requested" },
        "status": { "type": "string", "enum": ["New", "In Progress", "Completed", "Archived"] },
        "adminNotes": { "type": "string", "description": "Confidential corporate admin notes" },
        "timestamp": { "type": "string", "format": "date-time" }
      },
      "required": ["name", "email", "phone", "status"]
    }
  },
  "firestore": {
    "/settings/content": {
      "schema": "content",
      "description": "Singleton configuration holding general copy, product specs, and slider layouts."
    },
    "/inquiries/{inquiryId}": {
      "schema": "inquiry",
      "description": "Dynamic leads collection generated by incoming quotation requests."
    }
  }
}
```

---

## 4. Initializing Firebase SDK in the React Client

Create `/src/lib/firebase.js` to establish and validate connection to Firestore and Authentication safely:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize core client instance
const app = initializeApp(firebaseConfig);

// Configure references with correct database bindings
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity Check: Verifies immediate Firebase network accessibility
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "settings", "content"));
    console.log("Firebase Connection Verified: Firestore is online.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("EPLT Alert: Local browser is offline. Check Firebase configuration.");
    }
  }
}
testConnection();
```

---

## 5. Implementing Admin Authentication (`Admin.jsx`)

Refactor `/src/pages/Admin.jsx` to replace the local mock verification with secure **Firebase Authentication** tokens, active listener hooks, and self-service password reset utilities.

### Step 5.1: Auth State Monitor & Sign-In Controller
Update the top-level logic inside the `Admin` component:

```javascript
import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase.js";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function Admin({ onViewChange }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);

  // Password recovery states
  const [resetEmail, setResetEmail] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);

  // Sync state with active Auth Sessions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    try {
      // Secure client token retrieval directly against Firebase servers
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let customMsg = "Verification failed. Check credentials and try again.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        customMsg = "Invalid administrative email or password.";
      } else if (err.code === "auth/too-many-requests") {
        customMsg = "Account temporarily locked out due to multiple failed logins. Reset password or try later.";
      }
      setLoginError(customMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout process exception:", err);
    }
  };
```

---

## 6. Implementing "Forgot Password" Self-Service Recovery

When administrative credentials are forgotten, admins can initiate self-service email-based password resets directly from the login page.

### Step 6.1: Add Trigger Code
In `/src/pages/Admin.jsx`, add the password recovery submit handler:

```javascript
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus({ success: false, message: "Please supply a valid administrative email." });
      return;
    }
    setLoading(true);
    setResetStatus(null);

    try {
      // Directs Firebase Auth to dispatch standard, template-based recovery links
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatus({ 
        success: true, 
        message: "A password recovery email was successfully dispatched to " + resetEmail + ". Check your junk or spam folder." 
      });
      setTimeout(() => {
        setIsResetMode(false);
        setResetStatus(null);
      }, 6000);
    } catch (err) {
      let customError = "Failed to dispatch recovery link.";
      if (err.code === "auth/user-not-found") {
        customError = "The administrative email address provided is not registered.";
      }
      setResetStatus({ success: false, message: customError });
    } finally {
      setLoading(false);
    }
  };
```

### Step 6.2: Refactor UI Sign-In Panel
Render a stateful view supporting toggling between the login page and the password recovery panel:

```javascript
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-plt-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Syncing Admin Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-24 bg-white text-slate-800">
        <div className="max-w-md w-full bg-slate-50 border border-slate-200 p-8 rounded-2xl relative shadow-sm space-y-6">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-plt-purple"></div>
          
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-display font-bold text-slate-900">EPLT Substation Portal</h2>
            <p className="text-xs text-slate-600">
              {isResetMode 
                ? "Self-service administrative password restoration" 
                : "Manage dynamic substation catalog copy, sliders, & CRM inquiries"
              }
            </p>
          </div>

          {!isResetMode ? (
            /* SIGN-IN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">ADMIN EMAIL</label>
                <input
                  type="email"
                  placeholder="admin@eplt.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-950 focus:outline-none focus:ring-2 focus:ring-plt-purple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">PASSWORD</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-950 focus:outline-none focus:ring-2 focus:ring-plt-purple"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-xs leading-relaxed font-mono">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-plt-purple hover:bg-plt-violet text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Verify Access
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-xs text-plt-purple hover:underline cursor-pointer"
                >
                  Forgot administrative password?
                </button>
              </div>
            </form>
          ) : (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">REGISTERED ADMIN EMAIL</label>
                <input
                  type="email"
                  placeholder="admin@eplt.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-950 focus:outline-none focus:ring-2 focus:ring-plt-purple"
                />
              </div>

              {resetStatus && (
                <div className={`p-3 border rounded text-xs leading-relaxed font-mono ${
                  resetStatus.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-600"
                }`}>
                  {resetStatus.message}
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-plt-purple hover:bg-plt-violet text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? "Dispatching Email..." : "Send Recovery Instructions"}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsResetMode(false); setResetStatus(null); }}
                  className="w-full py-2 bg-transparent border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Return to Sign-In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
```

---

## 7. Connecting CRM Leads and Dynamic Settings

With authorization validated securely client-side, we interact with Firestore documents directly, enforcing proper exception mapping using standard schemas.

### Step 7.1: Setup Firestore Standard Exception Handler
Add this function to `/src/lib/firebase.js` (and export it) to automatically format security-related denials for system reporting:

```javascript
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
```

### Step 7.2: Refactoring Client inquiry Form Submission
In `/src/pages/Home.jsx` (or your modal inquiry handler), replace the backend POST dispatch to use direct Firestore write APIs encapsulated inside our standard error boundary wrapper:

```javascript
import { db, handleFirestoreError, OperationType } from "../lib/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const submitClientInquiry = async (formData) => {
  const pathForWrite = "inquiries";
  try {
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      requirements: formData.requirements || "",
      status: "New",
      adminNotes: "",
      timestamp: serverTimestamp() // Forces trusted, manipulation-proof server timestamps
    };
    
    // Writes directly to Cloud database securely
    await addDoc(collection(db, pathForWrite), payload);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pathForWrite);
  }
};
```

---

## 8. Hardening the Cloud Database with Zero-Trust Security Rules

To ensure total system security, we implement a robust **Attribute-Based Access Control (ABAC)** layer in `/firestore.rules`. This blocks query-scraping, identity spoofing, and rogue state bypasses.

Create or update `/firestore.rules` in your project root with the following definitions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ==========================================
    // 8.1 GLOBAL SAFETY NET
    // ==========================================
    // Default-deny catches any unmapped path blocks immediately
    match /{document=**} {
      allow read, write: if false;
    }

    // ==========================================
    // 8.2 GLOBAL HARDENED HELPERS
    // ==========================================
    function isValidId(id) { 
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$'); 
    }
    
    function incoming() { 
      return request.resource.data; 
    }
    
    function existing() { 
      return resource.data; 
    }
    
    function isSignedIn() { 
      return request.auth != null; 
    }

    // Ensures user's email was fully verified via the reset link flow
    function isVerifiedAdmin() {
      return isSignedIn() 
        && request.auth.token.email_verified == true 
        && request.auth.token.email.matches('.+@eplt\\.com$');
    }

    // ==========================================
    // 8.3 SINGLETON WEBSITE CONTENT RULES
    // ==========================================
    match /settings/content {
      // General public website reads from the company homepage
      allow get: if true;
      
      // Updates are locked strictly to validated corporate admins
      allow write: if isVerifiedAdmin() 
        && isValidContentSchema(incoming())
        && (resource == null || incoming().brandName == existing().brandName); // Brand Name immutability check
    }

    // Strict schema blueprint verifying exact key definitions and size boundaries
    function isValidContentSchema(data) {
      return data.brandName is string && data.brandName.size() <= 100
        && data.brandAbbr is string && data.brandAbbr.size() <= 10
        && data.headerHotline is string && data.headerHotline.size() <= 30;
    }

    // ==========================================
    // 8.4 INQUIRY LEDGER & CRM LEADS RULES
    // ==========================================
    match /inquiries/{inquiryId} {
      // Prevents rogue ID injection attacks
      allow get: if isVerifiedAdmin() && isValidId(inquiryId);
      
      // Forces secure query structures; clients cannot query-scrape other leads
      allow list: if isVerifiedAdmin();
      
      // Incoming quotation submission: Allowed publicly but rigorously schema validated
      allow create: if isValidId(inquiryId)
        && isValidInquirySchema(incoming())
        && incoming().status == "New" // Hardlocks starting state
        && incoming().timestamp == request.time; // Forces temporal database-aligned timestamp
        
      // Administrative CRM changes
      allow update: if isVerifiedAdmin()
        && isValidId(inquiryId)
        && isValidInquirySchema(incoming())
        && incoming().timestamp == existing().timestamp // Lock immutable fields
        && (
          // Action 1: Status Change (Enforce single field boundary modification)
          (incoming().diff(existing()).affectedKeys().hasOnly(['status', 'adminNotes']))
        )
        && (existing().status != "Completed" || incoming().status == "Completed"); // Prevent tampering with completed records
        
      allow delete: if isVerifiedAdmin() && isValidId(inquiryId);
    }

    function isValidInquirySchema(data) {
      return data.name is string && data.name.size() <= 100
        && data.email is string && data.email.size() <= 120
        && data.phone is string && data.phone.size() <= 40
        && data.status in ["New", "In Progress", "Completed", "Archived"]
        && (data.adminNotes is string && data.adminNotes.size() <= 2000);
    }
  }
}
```

Once rules are written, compile and deploy them to the active Firebase project:

```bash
# Deploys the strict rule structure immediately
firebase deploy --only firestore:rules
```

---

## 9. Admin Self-Correction Checklist (Red Team Defense)

Ensure the following security checks are verified before moving to production:

- [x] **Email Spoofing Prevention**: Rules strictly check `request.auth.token.email_verified == true`. Sending unverified admin emails will be blocked instantly.
- [x] **State Shortcutting Block**: Creating a lead with `status: "In Progress"` or updating a terminal state `status: "Completed"` back to `New` is blocked by state-locking guards.
- [x] **No Blanket Collection Reads**: The rules block any blanket list attempts. All list actions are rejected unless initiated by verified, email-checked admin accounts.
- [x] **Denial of Wallet Block**: All size bounds are checked statically (`.size() <= 100`) *prior* to database lookups to prevent massive performance or quota drain.
- [x] **Structured Errors Enabled**: The connection client will map all auth/rules blockages into compliant debug logs immediately.
