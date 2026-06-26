# Security Specification for Firestore Security Rules

## 1. Data Invariants
- **Inquiry Integrity**: Any client can submit (create) an inquiry with a maximum timestamp of `request.time`.
- **Administrative Isolation**: Only registered administrative accounts (with email verified) and authenticated owners can read, list, update, or delete inquiry documents.
- **Strict Keys**: Field values for inquiries must be bounded in length to prevent "Denial of Wallet" space exhaustion.
- **Immutable Timestamps**: No user or admin is permitted to falsify the original creation timestamp after initialization.

## 2. The "Dirty Dozen" Payloads (Exploit Scenarios)
1. **Unauthenticated Read Attack**: Attempting to list all inquiries from the collection without authentication.
2. **Anonymous Data Harvesting**: Querying specific customer inquiries using client-side spoofing parameters.
3. **Ghost Fields Update**: Attempting to update an inquiry document with un-whitelisted fields (e.g. adding `shadowField: true`).
4. **Self-Elevated Permissions**: Attempting to write a document with custom security role claims.
5. **ID Poisoning Attack**: Attempting to write an inquiry with a document ID containing special junk characters or exceeding 128 characters.
6. **Denial of Wallet (String Bloating)**: Attempting to create an inquiry where `requirements` exceeds 10,000 characters.
7. **PII Leakage Query**: Searching or retrieving private email and phone numbers without admin validation.
8. **Malicious State Transition**: Client trying to alter administrative notes (`adminNotes`) or change status to a non-existent status.
9. **Creation Timestamp Spoofing**: Submitting a falsified `timestamp` string representing a future date.
10. **Malicious Administrative Spoof**: Trying to login and perform writes pretending to be the user `office.devnoxit@gmail.com` with unverified email.
11. **Orphaned Writes**: Trying to perform updates that bypass the parent verification chain.
12. **Mass Deletion Exploit**: Unauthenticated or contributor account attempting to purge the inquiries database collection.

## 3. Security Rules Matrix
| Collection | Document | Read | Create | Update | Delete |
|------------|----------|------|--------|--------|--------|
| `inquiries` | `{inquiryId}` | `isAdmin()` | `true` (valid schema) | `isAdmin()` | `isAdmin()` |
