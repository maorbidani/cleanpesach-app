import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  CleaningLevel,
  CleaningTask,
  FamilyMember,
  FinalPrepItem,
  HolidayPlanningState,
  Room,
} from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface FamilySyncPayload {
  rooms: Room[];
  tasks: CleaningTask[];
  familyMembers: FamilyMember[];
  finalPrepItems: FinalPrepItem[];
  sederSimanimChecked: string[];
  targetDate: string;
  cleaningLevel: CleaningLevel;
  holidayPlanning: HolidayPlanningState;
}

export interface FamilyWorkspaceDoc extends FamilySyncPayload {
  familyCode: string;
  ownerUid: string;
  memberUids: string[];
  updatedByUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export function normalizeFamilyCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 24);
}

export function isValidFamilyCodeFormat(code: string): boolean {
  return /^[A-Z0-9_-]{4,24}$/.test(code);
}

export function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PESACH-${suffix}`;
}

/**
 * Strips undefined values and enforces volumetric boundaries declared in firebase-blueprint.json
 * and firestore.rules before writing to Firestore.
 */
export function sanitizeSyncPayload(
  payload: FamilySyncPayload
): FamilySyncPayload {
  const cleanJson = JSON.parse(JSON.stringify(payload)) as FamilySyncPayload;
  return {
    rooms: (cleanJson.rooms || []).slice(0, 30),
    tasks: (cleanJson.tasks || []).slice(0, 200),
    familyMembers: (cleanJson.familyMembers || []).slice(0, 20),
    finalPrepItems: (cleanJson.finalPrepItems || []).slice(0, 30),
    sederSimanimChecked: (cleanJson.sederSimanimChecked || []).slice(0, 20),
    targetDate: String(cleanJson.targetDate || '2027-04-21').slice(0, 20),
    cleaningLevel:
      cleanJson.cleaningLevel === 'חמץ בלבד' ||
      cleanJson.cleaningLevel === 'מאוזן' ||
      cleanJson.cleaningLevel === 'יסודי'
        ? cleanJson.cleaningLevel
        : 'מאוזן',
    holidayPlanning: {
      guests: (cleanJson.holidayPlanning?.guests || []).slice(0, 80),
      dishes: (cleanJson.holidayPlanning?.dishes || []).slice(0, 80),
      sederChecklist: (cleanJson.holidayPlanning?.sederChecklist || []).slice(
        0,
        60
      ),
      hagalaUtensils: (cleanJson.holidayPlanning?.hagalaUtensils || []).slice(
        0,
        80
      ),
      pesachWare: (cleanJson.holidayPlanning?.pesachWare || []).slice(0, 80),
      shoppingItems: (cleanJson.holidayPlanning?.shoppingItems || []).slice(
        0,
        150
      ),
      outfitsByMember: Object.fromEntries(
        Object.entries(cleanJson.holidayPlanning?.outfitsByMember || {}).slice(
          0,
          25
        )
      ),
      gifts: (cleanJson.holidayPlanning?.gifts || []).slice(0, 80),
      trips: (cleanJson.holidayPlanning?.trips || []).slice(0, 40),
    },
  };
}

export function getFriendlyCloudErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  if (raw.includes('popup-closed-by-user')) {
    return 'חלון ההתחברות נסגר לפני השלמת הכניסה. נסו שוב כשתרצו.';
  }
  if (raw.includes('popup-blocked')) {
    return 'הדפדפן חסם את חלון ההתחברות הקופץ. אפשרו חלונות קופצים ונסו שוב.';
  }
  if (
    raw.includes('network-request-failed') ||
    raw.includes('client is offline') ||
    raw.includes('unavailable')
  ) {
    return 'אין כרגע חיבור יציב לרשת. הנתונים נשמרים מקומית במכשיר.';
  }
  if (raw.includes('unauthorized-domain')) {
    return 'הדומיין הנוכחי אינו מורשה להתחברות Google בהגדרות Firebase.';
  }
  if (
    raw.includes('permission-denied') ||
    raw.includes('Missing or insufficient permissions')
  ) {
    return 'אין הרשאה לבצע פעולה זו. ודאו שאתם מחוברים לחשבון Google מאומת.';
  }
  if (raw.includes('תפוס') || raw.includes('לא נמצא') || raw.includes('מכסת') || raw.includes('חייב לכלול')) {
    return raw;
  }
  return 'לא הצלחנו להשלים את החיבור לענן כרגע. הנתונים שלכם בטוחים ונשמרים מקומית.';
}

export async function signInWithGooglePopup(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw new Error(getFriendlyCloudErrorMessage(error));
  }
}

export async function signOutFromCloud(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function fetchUserActiveFamilyCode(
  uid: string
): Promise<string | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as { activeFamilyCode?: string };
    const code = normalizeFamilyCode(data.activeFamilyCode || '');
    return isValidFamilyCodeFormat(code) ? code : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserActiveFamilyCode(
  uid: string,
  displayName: string,
  activeFamilyCode: string
): Promise<void> {
  const path = `users/${uid}`;
  const cleanCode = activeFamilyCode ? normalizeFamilyCode(activeFamilyCode) : '';
  const safeName = (displayName || 'בן משפחה').slice(0, 100);

  try {
    const ref = doc(db, 'users', uid);
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        uid,
        displayName: safeName,
        activeFamilyCode: cleanCode,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName: safeName,
        activeFamilyCode: cleanCode,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createOrReplaceOwnFamilyWorkspace(
  familyCode: string,
  ownerUid: string,
  payload: FamilySyncPayload
): Promise<void> {
  const code = normalizeFamilyCode(familyCode);
  if (!isValidFamilyCodeFormat(code)) {
    throw new Error('קוד המשפחה חייב לכלול 4 עד 24 תווים באנגלית או ספרות.');
  }

  const path = `families/${code}`;
  const sanitized = sanitizeSyncPayload(payload);

  try {
    const ref = doc(db, 'families', code);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      throw new Error('קוד משפחה זה כבר תפוס. בחרו קוד אחר או הצטרפו אליו.');
    }

    await setDoc(ref, {
      familyCode: code,
      ownerUid,
      memberUids: [ownerUid],
      updatedByUid: ownerUid,
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('תפוס')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function joinExistingFamilyWorkspace(
  familyCode: string,
  memberUid: string
): Promise<FamilyWorkspaceDoc> {
  const code = normalizeFamilyCode(familyCode);
  if (!isValidFamilyCodeFormat(code)) {
    throw new Error('קוד המשפחה חייב לכלול 4 עד 24 תווים באנגלית או ספרות.');
  }

  const path = `families/${code}`;
  try {
    const ref = doc(db, 'families', code);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('לא נמצא בית עם קוד המשפחה הזה. בדקו את הקוד ונסו שוב.');
    }

    const data = snap.data() as FamilyWorkspaceDoc;
    const currentMembers = Array.isArray(data.memberUids) ? data.memberUids : [];

    if (!currentMembers.includes(memberUid)) {
      if (currentMembers.length >= 20) {
        throw new Error('הבית הגיע למכסת החברים המרבית לסנכרון.');
      }
      await updateDoc(ref, {
        memberUids: [...currentMembers, memberUid],
        updatedByUid: memberUid,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      ...data,
      memberUids: currentMembers.includes(memberUid)
        ? currentMembers
        : [...currentMembers, memberUid],
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('לא נמצא') || error.message.includes('מכסת'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncFamilyWorkspaceState(
  familyCode: string,
  memberUid: string,
  payload: FamilySyncPayload
): Promise<void> {
  const code = normalizeFamilyCode(familyCode);
  if (!isValidFamilyCodeFormat(code)) return;

  const path = `families/${code}`;
  const sanitized = sanitizeSyncPayload(payload);

  try {
    await updateDoc(doc(db, 'families', code), {
      ...sanitized,
      updatedByUid: memberUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToFamilyWorkspace(
  familyCode: string,
  onData: (workspace: FamilyWorkspaceDoc) => void,
  onError?: (err: Error) => void
): () => void {
  const code = normalizeFamilyCode(familyCode);
  const path = `families/${code}`;

  return onSnapshot(
    doc(db, 'families', code),
    (snapshot) => {
      if (!snapshot.exists()) return;
      onData(snapshot.data() as FamilyWorkspaceDoc);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}
