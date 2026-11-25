/**
 * CleanPesach Firestore Rules Verification Specification (Dirty Dozen Cases)
 * Documents expected PERMISSION_DENIED vs ALLOW assertions against firestore.rules.
 */
export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated read on /users/u1', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unauthenticated write on /families/PESACH27', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Collection list scrape on /families', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Cross-user read on /users/otherUid', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Unverified email creating /families/PESACH27', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Shadow field isAdmin injected into /families/PESACH27', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Identity spoofing ownerUid !== auth.uid on create', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Client-forged updatedAt !== request.time', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Invalid familyCode exceeding 24 chars', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Invalid cleaningLevel enum value', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Non-member overwriting tasks before joining', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Joining user removing existing memberUids', expected: 'PERMISSION_DENIED' },
] as const;
