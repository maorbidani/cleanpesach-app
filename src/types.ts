export type TaskCategory = 'חובת חמץ' | 'ניקיון אביב';

export type RoomIconKey =
  | 'kitchen'
  | 'living'
  | 'master'
  | 'kids'
  | 'balcony'
  | 'storage'
  | 'car'
  | 'custom';

export type FamilyRole = 'מבוגר' | 'ילד/ה';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
}

export type CleaningLevel = 'חמץ בלבד' | 'מאוזן' | 'יסודי';

export interface CleaningTask {
  id: string;
  roomId: string;
  title: string;
  estimatedMinutes: number;
  category: TaskCategory;
  completed: boolean;
  isToday?: boolean;
  cleaningTip: string;
  recommendedSupplies: string[];
  isCustom?: boolean;
  assignedToId?: string | null;
}

export interface Room {
  id: string;
  name: string;
  subtitle: string;
  icon: RoomIconKey;
  isLocked: boolean;
}

export type RoomFilter = 'all' | 'in_progress' | 'locked';

export type RoomViewMode = 'cards' | 'floorplan';

export type TaskCategoryFilter = 'all' | TaskCategory;

export type TimerMode = 'focus' | 'break';

export type BottomDockTab = 'home' | 'planning' | 'family' | 'assistant';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
}

export interface FinalPrepItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// --- Phase 5: Holiday Planning ("התארגנות לחג") Types ---

export interface SederGuest {
  id: string;
  familyName: string;
  adults: number;
  children: number;
  notes: string;
  confirmed: boolean;
}

export interface SederDish {
  id: string;
  name: string;
  category: string;
  responsible: string;
  ready: boolean;
}

export interface SederChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export type KosheringMethod = 'הגעלה' | 'ליבון קל' | 'ליבון חמור';

export interface HagalaUtensil {
  id: string;
  name: string;
  method: KosheringMethod;
  completed: boolean;
}

export interface PesachWareItem {
  id: string;
  name: string;
  unpacked: boolean;
  missing: boolean;
}

export type ShoppingCategory =
  | 'חומרי ניקוי'
  | 'מצרכים כשרים לפסח'
  | 'יינות ומצות'
  | 'חד-פעמי';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  bought: boolean;
}

export interface MemberOutfitStatus {
  memberId: string;
  top: boolean;
  bottom: boolean;
  shoes: boolean;
}

export interface GiftItem {
  id: string;
  recipient: string;
  giftIdea: string;
  type: 'אפיקומן' | 'מתנת מארחים';
  purchased: boolean;
}

export interface CholHaMoedTrip {
  id: string;
  dayLabel: string;
  destination: string;
  gear: string;
  kosherLunch: string;
  ready: boolean;
}

export interface HolidayPlanningState {
  guests: SederGuest[];
  dishes: SederDish[];
  sederChecklist: SederChecklistItem[];
  hagalaUtensils: HagalaUtensil[];
  pesachWare: PesachWareItem[];
  shoppingItems: ShoppingItem[];
  outfitsByMember: Record<string, MemberOutfitStatus>;
  gifts: GiftItem[];
  trips: CholHaMoedTrip[];
}
