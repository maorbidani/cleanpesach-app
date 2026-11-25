import { FormEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Backpack,
  CalendarDays,
  Check,
  Compass,
  Flame,
  Gift,
  Loader2,
  PackageOpen,
  Plus,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import {
  FamilyMember,
  HolidayPlanningState,
  KosheringMethod,
  ShoppingCategory,
} from '../types';
import { PLANNING_BANNER_IMAGES } from '../data/visualThemes';
import { ResilientImage } from './ResilientImage';

interface AiTripRecommendation {
  destination: string;
  description: string;
  recommendedGear: string;
  kosherLunchIdea: string;
  suggestedDay: string;
}

const TRIP_QUICK_PROMPTS = [
  'מסלול מים קצר בצפון עם ילדים',
  'פארק מוצל ופיקניק בדרום',
  'אטרקציה מקורה וממוזגת במרכז',
];

type PlanningSubTab = 'seder' | 'koshering' | 'shopping' | 'trips';

interface HolidayPlanningViewProps {
  planning: HolidayPlanningState;
  familyMembers: FamilyMember[];
  onUpdatePlanning: (
    updater: (prev: HolidayPlanningState) => HolidayPlanningState
  ) => void;
}

const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  'חומרי ניקוי',
  'מצרכים כשרים לפסח',
  'יינות ומצות',
  'חד-פעמי',
];

const KOSHERING_METHODS: KosheringMethod[] = [
  'הגעלה',
  'ליבון קל',
  'ליבון חמור',
];

const DISH_CATEGORIES = ['ראשונה', 'דגים', 'עיקרית', 'תוספת', 'סלטים', 'קינוח'];

export function HolidayPlanningView({
  planning,
  familyMembers,
  onUpdatePlanning,
}: HolidayPlanningViewProps) {
  const [subTab, setSubTab] = useState<PlanningSubTab>('seder');
  const [formError, setFormError] = useState<{
    section: string;
    message: string;
  } | null>(null);

  // --- Seder Hosting forms ---
  const [guestFamilyName, setGuestFamilyName] = useState('');
  const [guestAdults, setGuestAdults] = useState(2);
  const [guestChildren, setGuestChildren] = useState(0);
  const [guestNotes, setGuestNotes] = useState('');

  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('עיקרית');
  const [dishResponsible, setDishResponsible] = useState('');

  // --- Koshering & Ware forms ---
  const [utensilName, setUtensilName] = useState('');
  const [utensilMethod, setUtensilMethod] = useState<KosheringMethod>('הגעלה');
  const [wareName, setWareName] = useState('');

  // --- Shopping, Outfits & Gifts forms ---
  const [shoppingFilter, setShoppingFilter] = useState<'הכל' | ShoppingCategory>(
    'הכל'
  );
  const [shopItemName, setShopItemName] = useState('');
  const [shopItemCategory, setShopItemCategory] =
    useState<ShoppingCategory>('מצרכים כשרים לפסח');

  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftIdea, setGiftIdea] = useState('');
  const [giftType, setGiftType] = useState<'אפיקומן' | 'מתנת מארחים'>(
    'אפיקומן'
  );

  // --- Chol HaMoed Trips form & AI Trip Recommender ---
  const [tripDay, setTripDay] = useState('');
  const [tripDestination, setTripDestination] = useState('');
  const [tripGear, setTripGear] = useState('');
  const [tripLunch, setTripLunch] = useState('');

  const [tripAiQuery, setTripAiQuery] = useState('');
  const [tripRecommendations, setTripRecommendations] = useState<
    AiTripRecommendation[]
  >([]);
  const [isGeneratingTrips, setIsGeneratingTrips] = useState(false);
  const [tripAiError, setTripAiError] = useState('');
  const [addedRecIndices, setAddedRecIndices] = useState<number[]>([]);
  const tripAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      tripAbortRef.current?.abort();
    };
  }, []);

  // Computed stats
  const totalGuestsCount = planning.guests.reduce(
    (sum, g) => sum + g.adults + g.children,
    0
  );
  const confirmedGuestsCount = planning.guests
    .filter((g) => g.confirmed)
    .reduce((sum, g) => sum + g.adults + g.children, 0);

  const checklistDone = planning.sederChecklist.filter((i) => i.checked).length;
  const kosheringDone = planning.hagalaUtensils.filter((u) => u.completed).length;
  const shoppingDone = planning.shoppingItems.filter((s) => s.bought).length;
  const tripsReady = planning.trips.filter((t) => t.ready).length;

  // Handlers
  const handleAddGuest = (e: FormEvent) => {
    e.preventDefault();
    const name = guestFamilyName.trim();
    if (!name) {
      setFormError({
        section: 'guest',
        message: 'יש להזין שם משפחה או אורח לפני ההוספה.',
      });
      return;
    }
    setFormError(null);
    onUpdatePlanning((prev) => ({
      ...prev,
      guests: [
        ...prev.guests,
        {
          id: `g-${Date.now()}`,
          familyName: name,
          adults: Math.max(0, Math.min(30, guestAdults || 0)),
          children: Math.max(0, Math.min(30, guestChildren || 0)),
          notes: guestNotes.trim(),
          confirmed: true,
        },
      ],
    }));
    setGuestFamilyName('');
    setGuestAdults(2);
    setGuestChildren(0);
    setGuestNotes('');
  };

  const handleAddDish = (e: FormEvent) => {
    e.preventDefault();
    const name = dishName.trim();
    if (!name) {
      setFormError({
        section: 'dish',
        message: 'יש להזין שם מנה לפני ההוספה לתפריט.',
      });
      return;
    }
    setFormError(null);
    onUpdatePlanning((prev) => ({
      ...prev,
      dishes: [
        ...prev.dishes,
        {
          id: `d-${Date.now()}`,
          name,
          category: dishCategory,
          responsible: dishResponsible.trim() || 'המארחים',
          ready: false,
        },
      ],
    }));
    setDishName('');
    setDishResponsible('');
  };

  const handleAddUtensil = (e: FormEvent) => {
    e.preventDefault();
    const name = utensilName.trim();
    if (!name) {
      setFormError({
        section: 'utensil',
        message: 'יש להזין שם כלי לפני ההוספה לרשימת ההכשרה.',
      });
      return;
    }
    setFormError(null);
    onUpdatePlanning((prev) => ({
      ...prev,
      hagalaUtensils: [
        ...prev.hagalaUtensils,
        {
          id: `hu-${Date.now()}`,
          name,
          method: utensilMethod,
          completed: false,
        },
      ],
    }));
    setUtensilName('');
  };

  const handleAddWare = (e: FormEvent) => {
    e.preventDefault();
    const name = wareName.trim();
    if (!name) {
      setFormError({
        section: 'ware',
        message: 'יש להזין שם פריט לפני ההוספה.',
      });
      return;
    }
    setFormError(null);
    onUpdatePlanning((prev) => ({
      ...prev,
      pesachWare: [
        ...prev.pesachWare,
        {
          id: `pw-${Date.now()}`,
          name,
          unpacked: false,
          missing: false,
        },
      ],
    }));
    setWareName('');
  };

  const handleAddShopItem = (e: FormEvent) => {
    e.preventDefault();
    const name = shopItemName.trim();
    if (!name) {
      setFormError({
        section: 'shop',
        message: 'יש להזין שם פריט לפני ההוספה לרשימת הקניות.',
      });
      return;
    }
    setFormError(null);
    onUpdatePlanning((prev) => ({
      ...prev,
      shoppingItems: [
        {
          id: `sh-${Date.now()}`,
          name,
          category: shopItemCategory,
          bought: false,
        },
        ...prev.shoppingItems,
      ],
    }));
    setShopItemName('');
  };

  const handleToggleOutfitPiece = (
    memberId: string,
    piece: 'top' | 'bottom' | 'shoes'
  ) => {
    onUpdatePlanning((prev) => {
      const current = prev.outfitsByMember[memberId] ?? {
        memberId,
        top: false,
        bottom: false,
        shoes: false,
      };
      return {
        ...prev,
        outfitsByMember: {
          ...prev.outfitsByMember,
          [memberId]: {
            ...current,
            [piece]: !current[piece],
          },
        },
      };
    });
  };

  const handleAddGift = (e: FormEvent) => {
    e.preventDefault();
    const recipient = giftRecipient.trim();
    const idea = giftIdea.trim();
    if (!recipient || !idea) {
      setFormError({
        section: 'gift',
        message: 'יש למלא גם למי המתנה וגם את הרעיון למתנה.',
      });
      return;
    }
    setFormError(null);
    onUpdatePlanning((prev) => ({
      ...prev,
      gifts: [
        ...prev.gifts,
        {
          id: `gf-${Date.now()}`,
          recipient,
          giftIdea: idea,
          type: giftType,
          purchased: false,
        },
      ],
    }));
    setGiftRecipient('');
    setGiftIdea('');
  };

  const handleAddTrip = (e: FormEvent) => {
    e.preventDefault();
    const dayLabel = tripDay.trim();
    const destination = tripDestination.trim();
    if (!dayLabel || !destination) {
      setFormError({
        section: 'trip',
        message: 'יש למלא יום ויעד לטיול לפני ההוספה.',
      });
      return;
    }
    setFormError(null);
    onUpdatePlanning((prev) => ({
      ...prev,
      trips: [
        ...prev.trips,
        {
          id: `tr-${Date.now()}`,
          dayLabel,
          destination,
          gear: tripGear.trim() || 'מים, כובעים וקרם הגנה',
          kosherLunch: tripLunch.trim() || 'ארוחה ארוזה כשרה לפסח',
          ready: false,
        },
      ],
    }));
    setTripDay('');
    setTripDestination('');
    setTripGear('');
    setTripLunch('');
  };

  const handleRecommendTrips = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = tripAiQuery.trim();
    if (trimmed.length < 2) {
      setTripAiError('כתבו תיאור קצר (למשל: אזור בארץ, גילאי הילדים או מסלול מים).');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setTripAiError('נראה שאין חיבור לאינטרנט כרגע. בדקו חיבור ונסו שוב.');
      return;
    }

    tripAbortRef.current?.abort();
    const controller = new AbortController();
    tripAbortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    setIsGeneratingTrips(true);
    setTripAiError('');

    try {
      const response = await fetch('/api/recommend-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as {
        recommendations?: AiTripRecommendation[];
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          data?.error || 'לא הצלחתי לקבל המלצות טיול כרגע. נסו שוב.'
        );
      }

      const recs = Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];
      if (recs.length === 0) {
        throw new Error(
          'לא נמצאו הצעות מתאימות לתיאור. נסו לציין אזור או סגנון טיול.'
        );
      }

      setTripRecommendations(recs);
      setAddedRecIndices([]);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setTripAiError('החיפוש ארך זמן רב מדי. נסו שוב בעוד רגע.');
      } else {
        setTripAiError(
          error instanceof Error
            ? error.message
            : 'שגיאה בקבלת המלצות טיול מהשרת.'
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsGeneratingTrips(false);
    }
  };

  const handleAddRecommendedTrip = (rec: AiTripRecommendation, idx: number) => {
    const normalizedDest = rec.destination.trim().toLowerCase();
    onUpdatePlanning((prev) => {
      const alreadyExists = prev.trips.some(
        (t) => t.destination.trim().toLowerCase() === normalizedDest
      );
      if (alreadyExists) {
        return prev;
      }
      return {
        ...prev,
        trips: [
          ...prev.trips,
          {
            id: `tr-ai-${Date.now()}-${idx}`,
            dayLabel: rec.suggestedDay || 'חול המועד',
            destination: rec.destination.trim(),
            gear: rec.recommendedGear || 'מים, כובעים וקרם הגנה',
            kosherLunch: rec.kosherLunchIdea || 'ארוחה ארוזה כשרה לפסח',
            ready: false,
          },
        ],
      };
    });
    setAddedRecIndices((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const visibleShoppingItems =
    shoppingFilter === 'הכל'
      ? planning.shoppingItems
      : planning.shoppingItems.filter((i) => i.category === shoppingFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-7"
    >
      {/* Hero Banner */}
      <section className="rounded-[22px] bg-gradient-to-br from-[#FFF9EE] via-[#EFECE6] to-[#EAF4EE] dark:from-[#273630] dark:via-[#22302B] dark:to-[#1C2A24] border border-[#E6B87A]/35 dark:border-white/10 p-6 sm:p-8 shadow-[0_8px_26px_-8px_rgba(45,49,46,0.1)] dark:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B86A14] dark:text-[#FFD86B]">
              מרכז הלוגיסטיקה והחג של הבית
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2D312E] dark:text-[#FAF8F5] mt-1">
              התארגנות לחג הפסח
            </h1>
            <p className="text-sm sm:text-base text-[#5A605C] dark:text-[#C2CEC8] mt-1.5">
              ליל הסדר ואירוח, הגעלת כלים, קניות ובגדי חג, וטיולי חול המועד — הכל במקום אחד מסודר.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#1E2B26] border border-[#E6AF2E]/35 dark:border-white/10 px-3.5 py-2.5 text-center">
              <p className="text-lg font-bold text-[#9A6000] dark:text-[#FFD86B] tabular-nums">
                {confirmedGuestsCount}/{totalGuestsCount}
              </p>
              <p className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8]">
                אורחים מאושרים
              </p>
            </div>
            <div className="rounded-2xl bg-[#FFF9F4] dark:bg-[#1E2B26] border border-[#E88D5D]/35 dark:border-white/10 px-3.5 py-2.5 text-center">
              <p className="text-lg font-bold text-[#C85A26] dark:text-[#FFB38A] tabular-nums">
                {kosheringDone}/{planning.hagalaUtensils.length}
              </p>
              <p className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8]">
                כלים הוכשרו
              </p>
            </div>
            <div className="rounded-2xl bg-[#F3FBFD] dark:bg-[#1E2B26] border border-[#28B7C5]/35 dark:border-white/10 px-3.5 py-2.5 text-center">
              <p className="text-lg font-bold text-[#116F7D] dark:text-[#7CE4F0] tabular-nums">
                {shoppingDone}/{planning.shoppingItems.length}
              </p>
              <p className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8]">
                פריטים נקנו
              </p>
            </div>
            <div className="rounded-2xl bg-[#F3FBF5] dark:bg-[#1E2B26] border border-[#4CC374]/35 dark:border-white/10 px-3.5 py-2.5 text-center">
              <p className="text-lg font-bold text-[#1F703C] dark:text-[#8BE8A7] tabular-nums">
                {tripsReady}/{planning.trips.length}
              </p>
              <p className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8]">
                טיולים מוכנים
              </p>
            </div>
          </div>
        </div>

        {/* 4 Module Sub-Tabs */}
        <div
          className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10"
          role="tablist"
          aria-label="מודולי התארגנות לחג"
        >
          {(
            [
              {
                id: 'seder',
                label: 'ליל הסדר ואירוח',
                Icon: UtensilsCrossed,
                activeClass:
                  'bg-gradient-to-l from-[#D4912A] to-[#C85A26] text-white shadow-sm',
              },
              {
                id: 'koshering',
                label: 'הכשרת מטבח וציוד',
                Icon: Flame,
                activeClass:
                  'bg-gradient-to-l from-[#D96934] to-[#E25A34] text-white shadow-sm',
              },
              {
                id: 'shopping',
                label: 'קניות, בגדים ואפיקומן',
                Icon: ShoppingBasket,
                activeClass:
                  'bg-gradient-to-l from-[#1D8C9B] to-[#28B7C5] text-white shadow-sm',
              },
              {
                id: 'trips',
                label: 'טיולי חול המועד',
                Icon: Compass,
                activeClass:
                  'bg-gradient-to-l from-[#2E8B52] to-[#4CC374] text-white shadow-sm',
              },
            ] as Array<{
              id: PlanningSubTab;
              label: string;
              Icon: typeof UtensilsCrossed;
              activeClass: string;
            }>
          ).map(({ id, label, Icon, activeClass }) => {
            const active = subTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSubTab(id);
                  setFormError(null);
                }}
                className={`min-h-[46px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  active
                    ? activeClass
                    : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:bg-[#EFECE6]/70 dark:hover:bg-white/6'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: SEDER TABLE & HOSTING */}
      {subTab === 'seder' && (
        <div className="space-y-6">
          {/* Seder Category Visual Banner */}
          <div className="relative h-36 sm:h-48 rounded-[20px] overflow-hidden border border-[#E6AF2E]/40 dark:border-white/15 shadow-[0_10px_26px_-10px_rgba(45,49,46,0.2)]">
            <ResilientImage
              src={PLANNING_BANNER_IMAGES.seder}
              alt="שולחן ליל הסדר ערוך בחגיגיות עם קערת פסח, נרות ופרחי אביב"
              fallbackGradient="from-[#FFE5B8] via-[#F9D6BE] to-[#E6B87A]"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-l from-[#2D1F12]/85 via-[#3B2A1A]/50 to-transparent"
              aria-hidden="true"
            />
            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
              <span className="text-xs font-bold text-[#FFD86B]">
                סדר כהלכתו ואווירת חג
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                שולחן ליל הסדר, אורחים ותפריט החג
              </h2>
            </div>
          </div>
          {/* Guests & RSVPs */}
          <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Users
                  className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  רשימת אורחים ואישורי הגעה
                </h2>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                סה״כ {totalGuestsCount} מסובים ({confirmedGuestsCount} אישרו)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {planning.guests.map((guest) => (
                <div
                  key={guest.id}
                  className={`rounded-2xl p-4 border transition-colors flex flex-col justify-between gap-3 ${
                    guest.confirmed
                      ? 'bg-[#DFE9E4]/75 dark:bg-[#243D33] border-[#5E8C7D]/35 dark:border-[#5E8C7D]/50'
                      : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-[#2D312E] dark:text-[#FAF8F5]">
                        {guest.familyName}
                      </h3>
                      <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8] mt-0.5 tabular-nums">
                        {guest.adults} מבוגרים · {guest.children} ילדים
                      </p>
                      {guest.notes && (
                        <p className="text-xs text-[#456B5E] dark:text-[#E5C17A] mt-1.5">
                          הערה: {guest.notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          guests: prev.guests.filter((g) => g.id !== guest.id),
                        }))
                      }
                      aria-label={`הסר את ${guest.familyName}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlanning((prev) => ({
                        ...prev,
                        guests: prev.guests.map((g) =>
                          g.id === guest.id
                            ? { ...g, confirmed: !g.confirmed }
                            : g
                        ),
                      }))
                    }
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      guest.confirmed
                        ? 'bg-[#5E8C7D] text-white'
                        : 'bg-[#EFECE6] dark:bg-[#273630] text-[#2D312E] dark:text-[#FAF8F5] border border-[#2D312E]/10 dark:border-white/15'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {guest.confirmed ? 'אישרו הגעה ✓' : 'ממתין לאישור'}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddGuest}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-3 border-t border-[#2D312E]/10 dark:border-white/10"
            >
              <input
                type="text"
                value={guestFamilyName}
                onChange={(e) => {
                  setGuestFamilyName(e.target.value);
                  if (formError?.section === 'guest') setFormError(null);
                }}
                placeholder="שם משפחה / אורחים"
                className="sm:col-span-4 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
              />
              <input
                type="number"
                min={0}
                max={30}
                value={guestAdults}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  setGuestAdults(
                    Number.isFinite(parsed)
                      ? Math.max(0, Math.min(30, parsed))
                      : 0
                  );
                }}
                aria-label="מספר מבוגרים"
                placeholder="מבוגרים"
                className="sm:col-span-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] tabular-nums"
              />
              <input
                type="number"
                min={0}
                max={30}
                value={guestChildren}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  setGuestChildren(
                    Number.isFinite(parsed)
                      ? Math.max(0, Math.min(30, parsed))
                      : 0
                  );
                }}
                aria-label="מספר ילדים"
                placeholder="ילדים"
                className="sm:col-span-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] tabular-nums"
              />
              <input
                type="text"
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                placeholder="רגישויות / הערות"
                className="sm:col-span-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
              />
              <button
                type="submit"
                className="sm:col-span-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>הוסף אורח</span>
              </button>
              {formError?.section === 'guest' && (
                <p className="sm:col-span-12 text-xs font-medium text-[#B84A39] dark:text-[#F4B68C]">
                  {formError.message}
                </p>
              )}
            </form>
          </section>

          {/* Menu & Cooking Assignments + Seder Plate Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seder Menu */}
            <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  תפריט החג וחלוקת בישולים
                </h2>
                <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                  {planning.dishes.filter((d) => d.ready).length}/
                  {planning.dishes.length} מוכנות
                </span>
              </div>

              <div className="space-y-2.5">
                {planning.dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 transition-colors ${
                      dish.ready
                        ? 'bg-[#DFE9E4]/70 dark:bg-[#243D33] border-[#5E8C7D]/35'
                        : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          dishes: prev.dishes.map((d) =>
                            d.id === dish.id ? { ...d, ready: !d.ready } : d
                          ),
                        }))
                      }
                      className="flex items-center gap-3 flex-1 min-w-0 text-right cursor-pointer"
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${
                          dish.ready
                            ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                            : 'border-[#2D312E]/25 dark:border-white/25'
                        }`}
                      >
                        {dish.ready && (
                          <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            dish.ready
                              ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                              : 'text-[#2D312E] dark:text-[#FAF8F5]'
                          }`}
                        >
                          {dish.name}
                        </p>
                        <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                          {dish.category} · אחראי/ת: {dish.responsible}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          dishes: prev.dishes.filter((d) => d.id !== dish.id),
                        }))
                      }
                      aria-label={`הסר מנה ${dish.name}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddDish}
                className="space-y-2.5 pt-3 border-t border-[#2D312E]/10 dark:border-white/10"
              >
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => {
                    setDishName(e.target.value);
                    if (formError?.section === 'dish') setFormError(null);
                  }}
                  placeholder="שם מנה חדשה בתפריט..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    aria-label="קטגוריית מנה"
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] dark:[&>option]:bg-[#1E2B26] dark:[&>option]:text-[#FAF8F5]"
                  >
                    {DISH_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={dishResponsible}
                    onChange={(e) => setDishResponsible(e.target.value)}
                    placeholder="מי מכין/מביא?"
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>הוסף מנה</span>
                  </button>
                </div>
                {formError?.section === 'dish' && (
                  <p className="text-xs font-medium text-[#B84A39] dark:text-[#F4B68C]">
                    {formError.message}
                  </p>
                )}
              </form>
            </section>

            {/* Seder Plate & Table Checklist */}
            <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  צ׳ק-ליסט קערת הסדר והשולחן
                </h2>
                <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                  {checklistDone}/{planning.sederChecklist.length} מוכנים
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {planning.sederChecklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onUpdatePlanning((prev) => ({
                        ...prev,
                        sederChecklist: prev.sederChecklist.map((c) =>
                          c.id === item.id ? { ...c, checked: !c.checked } : c
                        ),
                      }))
                    }
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center gap-2.5 text-right transition-colors cursor-pointer ${
                      item.checked
                        ? 'bg-[#DFE9E4]/80 dark:bg-[#243D33] border-[#5E8C7D]/45'
                        : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10 hover:border-[#5E8C7D]/50'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                        item.checked
                          ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                          : 'border-[#2D312E]/25 dark:border-white/25'
                      }`}
                    >
                      {item.checked && (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                      )}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        item.checked
                          ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                          : 'text-[#2D312E] dark:text-[#FAF8F5]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: KOSHERING & PESACH WARE */}
      {subTab === 'koshering' && (
        <div className="space-y-6">
          {/* Koshering Category Visual Banner */}
          <div className="relative h-36 sm:h-48 rounded-[20px] overflow-hidden border border-[#E88D5D]/40 dark:border-white/15 shadow-[0_10px_26px_-10px_rgba(45,49,46,0.2)]">
            <ResilientImage
              src={PLANNING_BANNER_IMAGES.koshering}
              alt="סירים נוצצים וכלי פסח נקיים מוכנים להכשרה ולהגעלה"
              fallbackGradient="from-[#F9D6BE] via-[#FDE4D3] to-[#F3B08A]"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-l from-[#331D12]/85 via-[#4A2B1B]/45 to-transparent"
              aria-hidden="true"
            />
            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
              <span className="text-xs font-bold text-[#FFB38A]">
                הכשרה והתחדשות במטבח
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                הגעלת כלים, ליבון ופריקת ארגזי הפסח
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hagala / Libun Utensils */}
          <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flame
                  className="w-5 h-5 text-[#9B4D1E] dark:text-[#E5C17A]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  רשימת כלים להגעלה וליבון
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                {kosheringDone}/{planning.hagalaUtensils.length} הוכשרו
              </span>
            </div>

            <div className="space-y-2.5">
              {planning.hagalaUtensils.map((utensil) => (
                <div
                  key={utensil.id}
                  className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 transition-colors ${
                    utensil.completed
                      ? 'bg-[#DFE9E4]/70 dark:bg-[#243D33] border-[#5E8C7D]/35'
                      : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlanning((prev) => ({
                        ...prev,
                        hagalaUtensils: prev.hagalaUtensils.map((u) =>
                          u.id === utensil.id
                            ? { ...u, completed: !u.completed }
                            : u
                        ),
                      }))
                    }
                    className="flex items-center gap-3 flex-1 min-w-0 text-right cursor-pointer"
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${
                        utensil.completed
                          ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                          : 'border-[#2D312E]/25 dark:border-white/25'
                      }`}
                    >
                      {utensil.completed && (
                        <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-bold ${
                          utensil.completed
                            ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                            : 'text-[#2D312E] dark:text-[#FAF8F5]'
                        }`}
                      >
                        {utensil.name}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          utensil.method === 'הגעלה'
                            ? 'bg-[#DFECF2] dark:bg-[#1F3A44] text-[#2B5D73] dark:text-[#9AC9DB]'
                            : 'bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C]'
                        }`}
                      >
                        {utensil.method}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlanning((prev) => ({
                        ...prev,
                        hagalaUtensils: prev.hagalaUtensils.filter(
                          (u) => u.id !== utensil.id
                        ),
                      }))
                    }
                    aria-label={`הסר ${utensil.name}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddUtensil}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t border-[#2D312E]/10 dark:border-white/10"
            >
              <input
                type="text"
                value={utensilName}
                onChange={(e) => {
                  setUtensilName(e.target.value);
                  if (formError?.section === 'utensil') setFormError(null);
                }}
                placeholder="הוסף כלי להכשרה (למשל: פלטה/סיר)"
                className="sm:col-span-6 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
              />
              <select
                value={utensilMethod}
                onChange={(e) =>
                  setUtensilMethod(e.target.value as KosheringMethod)
                }
                aria-label="שיטת הכשרה"
                className="sm:col-span-3 min-h-[44px] px-2.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] dark:[&>option]:bg-[#1E2B26] dark:[&>option]:text-[#FAF8F5]"
              >
                {KOSHERING_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="sm:col-span-3 min-h-[44px] px-3 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>הוסף כלי</span>
              </button>
              {formError?.section === 'utensil' && (
                <p className="sm:col-span-12 text-xs font-medium text-[#B84A39] dark:text-[#F4B68C]">
                  {formError.message}
                </p>
              )}
            </form>
          </section>

          {/* Pesach Ware Unpacking & Shortage Check */}
          <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PackageOpen
                  className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  פריקת כלי פסח ובדיקת חוסרים
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#9B4D1E] dark:text-[#E5C17A] tabular-nums">
                {planning.pesachWare.filter((w) => w.missing).length} חסרים
              </span>
            </div>

            <div className="space-y-2.5">
              {planning.pesachWare.map((ware) => (
                <div
                  key={ware.id}
                  className={`rounded-2xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    ware.missing
                      ? 'bg-[#F5E1D3]/65 dark:bg-[#422D25] border-[#B84A39]/40'
                      : ware.unpacked
                      ? 'bg-[#DFE9E4]/70 dark:bg-[#243D33] border-[#5E8C7D]/35'
                      : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlanning((prev) => ({
                        ...prev,
                        pesachWare: prev.pesachWare.map((w) =>
                          w.id === ware.id
                            ? { ...w, unpacked: !w.unpacked }
                            : w
                        ),
                      }))
                    }
                    className="flex items-center gap-3 flex-1 min-w-0 text-right cursor-pointer"
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${
                        ware.unpacked
                          ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                          : 'border-[#2D312E]/25 dark:border-white/25'
                      }`}
                    >
                      {ware.unpacked && (
                        <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                      )}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        ware.unpacked
                          ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                          : 'text-[#2D312E] dark:text-[#FAF8F5]'
                      }`}
                    >
                      {ware.name}
                    </span>
                  </button>

                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          pesachWare: prev.pesachWare.map((w) =>
                            w.id === ware.id
                              ? { ...w, missing: !w.missing }
                              : w
                          ),
                        }))
                      }
                      className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                        ware.missing
                          ? 'bg-[#B84A39] text-white'
                          : 'bg-[#EFECE6] dark:bg-[#273630] text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{ware.missing ? 'חסר להשלמה!' : 'סמן כחסר'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          pesachWare: prev.pesachWare.filter(
                            (w) => w.id !== ware.id
                          ),
                        }))
                      }
                      aria-label={`הסר ${ware.name}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddWare}
              className="space-y-2 pt-3 border-t border-[#2D312E]/10 dark:border-white/10"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wareName}
                  onChange={(e) => {
                    setWareName(e.target.value);
                    if (formError?.section === 'ware') setFormError(null);
                  }}
                  placeholder="הוסף פריט מארגזי הפסח (למשל: מגש למצות)..."
                  className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>הוסף</span>
                </button>
              </div>
              {formError?.section === 'ware' && (
                <p className="text-xs font-medium text-[#B84A39] dark:text-[#F4B68C]">
                  {formError.message}
                </p>
              )}
            </form>
          </section>
          </div>
        </div>
      )}

      {/* TAB 3: SHOPPING, HOLIDAY OUTFITS & AFIKOMAN GIFTS */}
      {subTab === 'shopping' && (
        <div className="space-y-6">
          {/* Shopping Category Visual Banner */}
          <div className="relative h-36 sm:h-48 rounded-[20px] overflow-hidden border border-[#28B7C5]/40 dark:border-white/15 shadow-[0_10px_26px_-10px_rgba(45,49,46,0.2)]">
            <ResilientImage
              src={PLANNING_BANNER_IMAGES.shopping}
              alt="סל קניות צבעוני ורענן עם פירות אביב, חומרי ניקוי ואריזות מתנה לחג"
              fallbackGradient="from-[#BFEAF0] via-[#E2F6F8] to-[#BDE7C8]"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-l from-[#102E35]/85 via-[#18444D]/45 to-transparent"
              aria-hidden="true"
            />
            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
              <span className="text-xs font-bold text-[#7CE4F0]">
                קניות, חידושים והפתעות
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                קניות כשרות לפסח, בגדי חג ומתנות אפיקומן
              </h2>
            </div>
          </div>

          {/* Categorized Shopping List */}
          <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShoppingBasket
                  className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  רשימת קניות חכמה לפסח
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['הכל', ...SHOPPING_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setShoppingFilter(cat)}
                    className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      shoppingFilter === cat
                        ? 'bg-[#5E8C7D] text-white'
                        : 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleAddShopItem}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2"
            >
              <input
                type="text"
                value={shopItemName}
                onChange={(e) => {
                  setShopItemName(e.target.value);
                  if (formError?.section === 'shop') setFormError(null);
                }}
                placeholder="הוסף פריט לרשימת הקניות..."
                className="sm:col-span-6 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
              />
              <select
                value={shopItemCategory}
                onChange={(e) =>
                  setShopItemCategory(e.target.value as ShoppingCategory)
                }
                aria-label="קטגוריית קניות"
                className="sm:col-span-4 min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] dark:[&>option]:bg-[#1E2B26] dark:[&>option]:text-[#FAF8F5]"
              >
                {SHOPPING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="sm:col-span-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>הוסף</span>
              </button>
              {formError?.section === 'shop' && (
                <p className="sm:col-span-12 text-xs font-medium text-[#B84A39] dark:text-[#F4B68C]">
                  {formError.message}
                </p>
              )}
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {visibleShoppingItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl px-4 py-3 border flex items-center justify-between gap-3 transition-colors ${
                    item.bought
                      ? 'bg-[#DFE9E4]/70 dark:bg-[#243D33] border-[#5E8C7D]/35'
                      : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlanning((prev) => ({
                        ...prev,
                        shoppingItems: prev.shoppingItems.map((s) =>
                          s.id === item.id ? { ...s, bought: !s.bought } : s
                        ),
                      }))
                    }
                    className="flex items-center gap-3 flex-1 min-w-0 text-right cursor-pointer"
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${
                        item.bought
                          ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                          : 'border-[#2D312E]/25 dark:border-white/25'
                      }`}
                    >
                      {item.bought && (
                        <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          item.bought
                            ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                            : 'text-[#2D312E] dark:text-[#FAF8F5]'
                        }`}
                      >
                        {item.name}
                      </p>
                      <span className="text-[11px] text-[#456B5E] dark:text-[#E5C17A]">
                        {item.category}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlanning((prev) => ({
                        ...prev,
                        shoppingItems: prev.shoppingItems.filter(
                          (s) => s.id !== item.id
                        ),
                      }))
                    }
                    aria-label={`הסר ${item.name}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Holiday Outfits & Afikoman Gifts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Family Outfits */}
            <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Shirt
                  className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  בגדי חג לבני המשפחה
                </h2>
              </div>

              <div className="space-y-3">
                {familyMembers.map((member) => {
                  const status = planning.outfitsByMember[member.id] ?? {
                    memberId: member.id,
                    top: false,
                    bottom: false,
                    shoes: false,
                  };
                  const allReady = status.top && status.bottom && status.shoes;

                  return (
                    <div
                      key={member.id}
                      className={`rounded-2xl p-4 border transition-colors ${
                        allReady
                          ? 'bg-[#DFE9E4]/75 dark:bg-[#243D33] border-[#5E8C7D]/40'
                          : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm sm:text-base text-[#2D312E] dark:text-[#FAF8F5]">
                          {member.name} ({member.role})
                        </span>
                        {allReady && (
                          <span className="text-xs font-bold text-[#456B5E] dark:text-[#E5C17A]">
                            לבוש חגיגי מוכן ✨
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { key: 'top', label: 'חולצה / שמלה' },
                            { key: 'bottom', label: 'מכנס / חצאית' },
                            { key: 'shoes', label: 'נעלי חג' },
                          ] as const
                        ).map(({ key, label }) => {
                          const checked = status[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                handleToggleOutfitPiece(member.id, key)
                              }
                              className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                                checked
                                  ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                                  : 'bg-[#EFECE6] dark:bg-[#273630] border-[#2D312E]/10 dark:border-white/10 text-[#5A605C] dark:text-[#C2CEC8]'
                              }`}
                            >
                              {checked && (
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                              <span className="truncate">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Afikoman & Host Gifts */}
            <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Gift
                  className="w-5 h-5 text-[#D49A3A] dark:text-[#E5C17A]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  מתנות אפיקומן ומארחים
                </h2>
              </div>

              <div className="space-y-2.5">
                {planning.gifts.map((gift) => (
                  <div
                    key={gift.id}
                    className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 transition-colors ${
                      gift.purchased
                        ? 'bg-[#DFE9E4]/70 dark:bg-[#243D33] border-[#5E8C7D]/35'
                        : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          gifts: prev.gifts.map((g) =>
                            g.id === gift.id
                              ? { ...g, purchased: !g.purchased }
                              : g
                          ),
                        }))
                      }
                      className="flex items-center gap-3 flex-1 min-w-0 text-right cursor-pointer"
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${
                          gift.purchased
                            ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                            : 'border-[#2D312E]/25 dark:border-white/25'
                        }`}
                      >
                        {gift.purchased && (
                          <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            gift.purchased
                              ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                              : 'text-[#2D312E] dark:text-[#FAF8F5]'
                          }`}
                        >
                          {gift.recipient}: {gift.giftIdea}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F6EBD2] dark:bg-[#493D22] text-[#7A500E] dark:text-[#E5C17A]">
                          {gift.type}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          gifts: prev.gifts.filter((g) => g.id !== gift.id),
                        }))
                      }
                      aria-label={`הסר מתנה ל${gift.recipient}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddGift}
                className="space-y-2 pt-3 border-t border-[#2D312E]/10 dark:border-white/10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={giftRecipient}
                    onChange={(e) => {
                      setGiftRecipient(e.target.value);
                      if (formError?.section === 'gift') setFormError(null);
                    }}
                    placeholder="למי המתנה? (למשל: אורי)"
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
                  />
                  <select
                    value={giftType}
                    onChange={(e) =>
                      setGiftType(e.target.value as 'אפיקומן' | 'מתנת מארחים')
                    }
                    aria-label="סוג מתנה"
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] dark:[&>option]:bg-[#1E2B26] dark:[&>option]:text-[#FAF8F5]"
                  >
                    <option value="אפיקומן">אפיקומן</option>
                    <option value="מתנת מארחים">מתנת מארחים</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftIdea}
                    onChange={(e) => {
                      setGiftIdea(e.target.value);
                      if (formError?.section === 'gift') setFormError(null);
                    }}
                    placeholder="רעיון למתנה..."
                    className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>הוסף</span>
                  </button>
                </div>
                {formError?.section === 'gift' && (
                  <p className="text-xs font-medium text-[#B84A39] dark:text-[#F4B68C]">
                    {formError.message}
                  </p>
                )}
              </form>
            </section>
          </div>
        </div>
      )}

      {/* TAB 4: CHOL HAMOED TRIP PLANNER */}
      {subTab === 'trips' && (
        <div className="space-y-6">
          {/* Trips Category Visual Banner */}
          <div className="relative h-36 sm:h-48 rounded-[20px] overflow-hidden border border-[#4CC374]/40 dark:border-white/15 shadow-[0_10px_26px_-10px_rgba(45,49,46,0.2)]">
            <ResilientImage
              src={PLANNING_BANNER_IMAGES.trips}
              alt="שביל טבע ירוק ופורח בגליל באור השמש האביבי"
              fallbackGradient="from-[#BDE7C8] via-[#E4F6E8] to-[#87D19E]"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-l from-[#132E1C]/85 via-[#1E472D]/45 to-transparent"
              aria-hidden="true"
            />
            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
              <span className="text-xs font-bold text-[#8BE8A7]">
                יוצאים לטבע האביבי
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                טיולי חול המועד והמלצות חכמות למשפחה
              </h2>
            </div>
          </div>

          <section className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Compass
                className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A]"
                aria-hidden="true"
              />
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                מתכנן טיולים לחול המועד
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
              {tripsReady} מתוך {planning.trips.length} טיולים ארוזים ומוכנים
            </span>
          </div>

          {/* AI Trip Recommender Card */}
          <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#5E8C7D]/25 dark:border-[#E5C17A]/25 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#DFECF2] dark:bg-[#1F3A44] text-[#2B5D73] dark:text-[#9AC9DB] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                    ✨ קבל המלצות טיול מותאמות אישית
                  </h3>
                  <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8] mt-0.5">
                    ספרו איפה תרצו לטייל, מה גילאי הילדים או מה הסגנון (מסלול מים, פארק, אטרקציה מקורה) וקבלו 3 רעיונות כשרים לפסח למשפחות.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRecommendTrips} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={tripAiQuery}
                  onChange={(e) => {
                    setTripAiQuery(e.target.value);
                    if (tripAiError) setTripAiError('');
                  }}
                  placeholder="לדוגמה: טיול מים קצר בצפון לילדים בני 4 ו-8, נגיש לעגלה..."
                  aria-label="תיאור הטיול המבוקש"
                  className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EFECE6]/70 dark:bg-[#273630] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/75 dark:placeholder:text-[#C2CEC8]/60 focus:outline-none focus:ring-2 focus:ring-[#5E8C7D] dark:focus:ring-[#E5C17A]"
                />
                <button
                  type="submit"
                  disabled={isGeneratingTrips}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] disabled:opacity-65 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors"
                >
                  {isGeneratingTrips ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>מחפש הצעות...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>הצע לי טיולים</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] ml-1">
                  רעיונות מהירים:
                </span>
                {TRIP_QUICK_PROMPTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTripAiQuery(preset);
                      setTripAiError('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E4DFD6] dark:hover:bg-[#31443D] text-[11px] font-semibold text-[#2D312E] dark:text-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </form>

            {tripAiError && (
              <p
                role="alert"
                className="text-xs sm:text-sm font-medium text-[#B84A39] dark:text-[#F4B68C] bg-[#F5E1D3]/55 dark:bg-[#492D21]/60 px-3.5 py-2.5 rounded-xl"
              >
                {tripAiError}
              </p>
            )}

            {tripRecommendations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {tripRecommendations.map((rec, idx) => {
                  const normalizedDest = rec.destination.trim().toLowerCase();
                  const isAdded =
                    addedRecIndices.includes(idx) ||
                    planning.trips.some(
                      (t) => t.destination.trim().toLowerCase() === normalizedDest
                    );
                  return (
                    <div
                      key={`${rec.destination}-${idx}`}
                      className="rounded-2xl bg-[#EFECE6]/75 dark:bg-[#273630] border border-[#2D312E]/10 dark:border-white/10 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-[#456B5E] dark:text-[#E5C17A] block">
                          {rec.suggestedDay}
                        </span>
                        <h4 className="font-display text-base font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                          {rec.destination}
                        </h4>
                        <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed">
                          {rec.description}
                        </p>
                        <div className="pt-1 space-y-1 text-[11px] text-[#5A605C] dark:text-[#C2CEC8]">
                          <p>
                            <strong className="text-[#2D312E] dark:text-[#FAF8F5]">
                              ציוד:{' '}
                            </strong>
                            {rec.recommendedGear}
                          </p>
                          <p>
                            <strong className="text-[#2D312E] dark:text-[#FAF8F5]">
                              אוכל לפסח:{' '}
                            </strong>
                            {rec.kosherLunchIdea}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddRecommendedTrip(rec, idx)}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-[#DFE9E4] dark:bg-[#243D33] text-[#3D6357] dark:text-[#E5C17A] cursor-default'
                            : 'bg-[#5E8C7D] hover:bg-[#4E796B] text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>נוסף לתוכנית שלנו</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>+ הוסף לתוכנית שלנו</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planning.trips.map((trip) => (
              <div
                key={trip.id}
                className={`rounded-[20px] p-5 border flex flex-col justify-between gap-4 transition-colors ${
                  trip.ready
                    ? 'bg-[#DFE9E4]/75 dark:bg-[#243D33] border-[#5E8C7D]/45'
                    : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/8 dark:border-white/10'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#456B5E] dark:text-[#E5C17A]">
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        {trip.dayLabel}
                      </span>
                      <h3 className="font-display text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5] mt-1">
                        {trip.destination}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlanning((prev) => ({
                          ...prev,
                          trips: prev.trips.filter((t) => t.id !== trip.id),
                        }))
                      }
                      aria-label={`הסר טיול ${trip.destination}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8]">
                    <p className="flex items-start gap-2">
                      <Backpack
                        className="w-4 h-4 text-[#8FB8CA] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="text-[#2D312E] dark:text-[#FAF8F5]">
                          ציוד נדרש:{' '}
                        </strong>
                        {trip.gear}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <UtensilsCrossed
                        className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="text-[#2D312E] dark:text-[#FAF8F5]">
                          אוכל כשר לפסח לדרך:{' '}
                        </strong>
                        {trip.kosherLunch}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdatePlanning((prev) => ({
                      ...prev,
                      trips: prev.trips.map((t) =>
                        t.id === trip.id ? { ...t, ready: !t.ready } : t
                      ),
                    }))
                  }
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    trip.ready
                      ? 'bg-[#5E8C7D] text-white'
                      : 'bg-[#EFECE6] dark:bg-[#273630] text-[#2D312E] dark:text-[#FAF8F5] border border-[#2D312E]/10 dark:border-white/15'
                  }`}
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>{trip.ready ? 'התיק והאוכל מוכנים ✓' : 'סמן כמוכן ליציאה'}</span>
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddTrip}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-4 border-t border-[#2D312E]/10 dark:border-white/10"
          >
            <input
              type="text"
              value={tripDay}
              onChange={(e) => {
                setTripDay(e.target.value);
                if (formError?.section === 'trip') setFormError(null);
              }}
              placeholder="יום (למשל: יום ג׳ חוה״מ)"
              className="lg:col-span-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
            />
            <input
              type="text"
              value={tripDestination}
              onChange={(e) => {
                setTripDestination(e.target.value);
                if (formError?.section === 'trip') setFormError(null);
              }}
              placeholder="יעד / אטרקציה"
              className="lg:col-span-3 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
            />
            <input
              type="text"
              value={tripGear}
              onChange={(e) => setTripGear(e.target.value)}
              placeholder="ציוד נדרש..."
              className="lg:col-span-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
            />
            <input
              type="text"
              value={tripLunch}
              onChange={(e) => setTripLunch(e.target.value)}
              placeholder="אוכל כשר לפסח לדרך..."
              className="lg:col-span-3 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60"
            />
            <button
              type="submit"
              className="lg:col-span-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>הוסף טיול</span>
            </button>
            {formError?.section === 'trip' && (
              <p className="sm:col-span-2 lg:col-span-12 text-xs font-medium text-[#B84A39] dark:text-[#F4B68C]">
                {formError.message}
              </p>
            )}
          </form>
        </section>
        </div>
      )}
    </motion.div>
  );
}
