# CleanPesach Firestore Security Specification

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, updated, or deleted by the authenticated owner whose `request.auth.uid == userId`, with `uid` immutable and `updatedAt == request.time`.
2. A `FamilyWorkspace` document at `/families/{familyCode}` enforces strict path ID format (`^[A-Z0-9_\-]{4,24}$`), forbids collection listing (`allow list: if false`), requires `request.auth.token.email_verified == true`, preserves `ownerUid`, `familyCode`, and `createdAt` immutably, and requires `updatedByUid == request.auth.uid` and `updatedAt == request.time`.
3. Only authenticated members listed in `memberUids` may update household cleaning state, and joining a family room strictly limits `affectedKeys()` to `['memberUids', 'updatedByUid', 'updatedAt']` while preserving all existing members.

## 2. The "Dirty Dozen" Attack Payloads
1. Unauthenticated read of `/users/user1`.
2. Unauthenticated read or write of `/families/PESACH27`.
3. Collection `list` scraping on `/families` or `/users`.
4. Cross-user read or write on `/users/otherUserUid`.
5. Unverified email account attempting to create or update `/families/PESACH27`.
6. Shadow field injection (`isAdmin: true`) inside `/users/{uid}` or `/families/PESACH27`.
7. Identity spoofing (`ownerUid: "victimUid"` or `updatedByUid: "victimUid"`) on create/update.
8. Client-forged `createdAt` or `updatedAt` timestamp instead of `request.time`.
9. Oversized path variable (`150`-char `familyCode`) or oversized array (`tasks.size() > 200`).
10. Invalid `cleaningLevel` enum (`"אחר"` instead of allowlist).
11. Non-member attempting to overwrite `tasks` or `rooms` without being in `existing().memberUids`.
12. Non-member trying to remove existing members during `join` (`!incoming().memberUids.hasAll(existing().memberUids)`).
