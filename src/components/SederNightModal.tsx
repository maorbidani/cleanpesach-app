import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  MapPin,
  Music,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DEFAULT_SEDER_CITY_ID,
  ISRAEL_CITY_SCHEDULES,
  filterIsraelCities,
} from '../data/israelCities';

interface SederNightModalProps {
  isOpen: boolean;
  checkedSimanim: string[];
  onToggleSiman: (simanId: string) => void;
  onResetSimanim: () => void;
  onClose: () => void;
}

const CITY_STORAGE_KEY = 'cleanpesach_seder_city_v1';

const SEDER_SIMANIM = [
  { id: 'kadesh', name: 'קַדֵּשׁ', desc: 'קידוש של יום טוב וכוס ראשונה בהסבה' },
  { id: 'urchatz', name: 'וּרְחַץ', desc: 'נטילת ידיים ללא ברכה לפני הכרפס' },
  { id: 'karpas', name: 'כַּרְפַּס', desc: 'טבילת ירק במי מלח וברכת בורא פרי האדמה' },
  { id: 'yachatz', name: 'יַחַץ', desc: 'חציית המצה האמצעית והחבאת האפיקומן' },
  { id: 'maggid', name: 'מַגִּיד', desc: 'קריאת ההגדה, מה נשתנה וכוס שנייה' },
  { id: 'rachtza', name: 'רָחְצָה', desc: 'נטילת ידיים עם ברכה לסעודה' },
  { id: 'motzi', name: 'מוֹצִיא', desc: 'ברכת המוציא לחם מן הארץ על המצות' },
  { id: 'matza', name: 'מַצָּה', desc: 'ברכת על אכילת מצה ואכילה בהסבה' },
  { id: 'maror', name: 'מָרוֹר', desc: 'טבילת המרור בחרוסת וברכת על אכילת מרור' },
  { id: 'korech', name: 'כּוֹרֵךְ', desc: 'כריכת מצה ומרור יחד זכר למקדש כהלל' },
  { id: 'shulchan', name: 'שֻׁלְחָן עוֹרֵךְ', desc: 'סעודת החג החגיגית בשמחה ובנחת' },
  { id: 'tzafun', name: 'צָפוּן', desc: 'אכילת האפיקומן לקינוח על השובע' },
  { id: 'barech', name: 'בָּרֵךְ', desc: 'ברכת המזון וכוס שלישית בהסבה' },
  { id: 'hallel', name: 'הַלֵּל', desc: 'שירת ההלל, נשמת כל חי וכוס רביעית' },
  { id: 'nirtza', name: 'נִרְצָה', desc: 'פיוטי הסיום, אחד מי יודע ולשנה הבאה בירושלים' },
];

const SEDER_SONGS = [
  {
    id: 'ma-nishtana',
    title: 'מה נשתנה הלילה הזה',
    mood: 'פתיחת מגיד · מסורת משפחתית',
    lyrics: `מַה נִּשְׁתַּנָּה הַלַּיְלָה הַזֶּה מִכָּל הַלֵּילוֹת?
שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין חָמֵץ וּמַצָּה – הַלַּיְלָה הַזֶּה כֻּלּוֹ מַצָּה.
שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין שְׁאָר יְרָקוֹת – הַלַּיְלָה הַזֶּה מָרוֹר.
שֶׁבְּכָל הַלֵּילוֹת אֵין אָנוּ מַטְבִּילִין אֲפִילוּ פַּעַם אֶחָת – הַלַּיְלָה הַזֶּה שְׁתֵּי פְעָמִים.
שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין בֵּין יוֹשְׁבִין וּבֵין מְסֻבִּין – הַלַּיְלָה הַזֶּה כֻּלָּנוּ מְסֻבִּין.`,
  },
  {
    id: 'dayenu',
    title: 'דַּיֵּינוּ',
    mood: 'שירת ההודיה · קצב שמח',
    lyrics: `אִלּוּ הוֹצִיאָנוּ מִמִּצְרַיִם וְלֹא עָשָׂה בָהֶם שְׁפָטִים – דַּיֵּינוּ!
אִלּוּ קֵרְבָנוּ לִפְנֵי הַר סִינַי וְלֹא נָתַן לָנוּ אֶת הַתּוֹרָה – דַּיֵּינוּ!
אִלּוּ נָתַן לָנוּ אֶת הַתּוֹרָה וְלֹא הִכְנִיסָנוּ לְאֶרֶץ יִשְׂרָאֵל – דַּיֵּינוּ!
אִלּוּ הִכְנִיסָנוּ לְאֶרֶץ יִשְׂרָאֵל וּבָנָה לָנוּ אֶת בֵּית הַבְּחִירָה – דַּיֵּינוּ!`,
  },
  {
    id: 'echad-mi-yodea',
    title: 'אֶחָד מִי יוֹדֵעַ?',
    mood: 'נרצה · שיתוף ילדים ומבוגרים',
    lyrics: `אֶחָד מִי יוֹדֵעַ? אֶחָד אֲנִי יוֹדֵעַ: אֶחָד אֱלֹהֵינוּ שֶׁבַּשָּׁמַיִם וּבָאָרֶץ.
שְׁנַיִם מִי יוֹדֵעַ? שְׁנַיִם אֲנִי יוֹדֵעַ: שְׁנֵי לֻחוֹת הַבְּרִית, אֶחָד אֱלֹהֵינוּ...
שְׁלֹשָׁה מִי יוֹדֵעַ? שְׁלֹשָׁה אָבוֹת, שְׁנֵי לֻחוֹת הַבְּרִית...
אַרְבַּע אִמָּהוֹת, חֲמִשָּׁה חֻמְשֵׁי תוֹרָה, שִׁשָּׁה סִדְרֵי מִשְׁנָה, שִׁבְעָה יְמֵי שַׁבָּתָא!`,
  },
  {
    id: 'vehie-sheamda',
    title: 'וְהִיא שֶׁעָמְדָה',
    mood: 'מגיד · רגע מרגש סביב השולחן',
    lyrics: `וְהִיא שֶׁעָמְדָה לַאֲבוֹתֵינוּ וְלָנוּ.
שֶׁלֹּא אֶחָד בִּלְבַד עָמַד עָלֵינוּ לְכַלּוֹתֵנוּ,
אֶלָּא שֶׁבְּכָל דּוֹר וָדוֹר עוֹמְדִים עָלֵינוּ לְכַלּוֹתֵנוּ,
וְהַקָּדוֹשׁ בָּרוּךְ הוּא מַצִּילֵנוּ מִיָּדָם.`,
  },
];

function getInitialCityId(): string {
  try {
    const saved = localStorage.getItem(CITY_STORAGE_KEY);
    if (saved && ISRAEL_CITY_SCHEDULES.some((c) => c.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_SEDER_CITY_ID;
}

export function SederNightModal({
  isOpen,
  checkedSimanim,
  onToggleSiman,
  onResetSimanim,
  onClose,
}: SederNightModalProps) {
  const [selectedCityId, setSelectedCityId] = useState<string>(getInitialCityId);
  const [cityQuery, setCityQuery] = useState('');
  const [isCityListOpen, setIsCityListOpen] = useState(false);
  const [activeSongId, setActiveSongId] = useState<string>('ma-nishtana');
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CITY_STORAGE_KEY, selectedCityId);
    } catch {
      // Ignore storage write errors
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (!isOpen) {
      setIsCityListOpen(false);
      setCityQuery('');
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCityListOpen) {
          setIsCityListOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCityListOpen, onClose]);

  useEffect(() => {
    if (!isCityListOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCityListOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isCityListOpen]);

  const activeCity = useMemo(
    () =>
      ISRAEL_CITY_SCHEDULES.find((c) => c.id === selectedCityId) ||
      ISRAEL_CITY_SCHEDULES[0],
    [selectedCityId]
  );

  const filteredCities = useMemo(
    () => filterIsraelCities(cityQuery),
    [cityQuery]
  );

  const handleSelectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    setCityQuery('');
    setIsCityListOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seder-mode-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2D312E]/45 dark:bg-black/70 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 p-5 sm:p-8 shadow-2xl text-[#2D312E] dark:text-[#FAF8F5] space-y-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F6EBCD] dark:bg-[#3A3320] text-[#B88128] dark:text-[#E5C17A] flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="seder-mode-title"
                    className="font-display text-2xl sm:text-3xl font-bold"
                  >
                    מצב ערב פסח וליל הסדר
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8]">
                    זמני היום והדלקת נרות, סימני הסדר לאור הנרות ושירון משפחתי
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="סגור מצב ערב פסח"
                className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:bg-[#EFECE6] dark:hover:bg-[#273630] cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Section 1: Erev Pesach Times by City with Searchable Autocomplete */}
            <section className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock
                      className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A]"
                      aria-hidden="true"
                    />
                    <h3 className="font-display text-lg font-bold">
                      לוח זמנים לערב פסח (כ״א באפריל 2027)
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#456B5E] dark:text-[#E5C17A]">
                    <MapPin className="w-3.5 h-3.5 text-[#5E8C7D] dark:text-[#E5C17A]" aria-hidden="true" />
                    <span>
                      עיר נבחרת: {activeCity.name} ({activeCity.region})
                    </span>
                  </span>
                </div>

                {/* Searchable Autocomplete City Combobox */}
                <div ref={cityDropdownRef} className="relative">
                  <div className="flex items-center gap-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/14 dark:border-white/15 px-3 min-h-[44px] focus-within:ring-2 focus-within:ring-[#5E8C7D] dark:focus-within:ring-[#E5C17A]">
                    <Search
                      className="w-4 h-4 text-[#5A605C] dark:text-[#C2CEC8] shrink-0"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={cityQuery}
                      onFocus={() => setIsCityListOpen(true)}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        setIsCityListOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredCities.length > 0) {
                          e.preventDefault();
                          handleSelectCity(filteredCities[0].id);
                        }
                      }}
                      aria-label="חיפוש ובחירת עיר בארץ לזמני החג"
                      aria-expanded={isCityListOpen}
                      placeholder={`חפש עיר בארץ (כעת: ${activeCity.name}) — למשל נתיבות, אשדוד, צפת...`}
                      className="w-full py-2 bg-transparent text-xs sm:text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/75 dark:placeholder:text-[#C2CEC8]/65 focus:outline-none"
                    />
                    {cityQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setCityQuery('');
                          setIsCityListOpen(true);
                        }}
                        aria-label="נקה חיפוש עיר"
                        className="p-1 rounded-lg text-[#5A605C] dark:text-[#C2CEC8] hover:bg-[#EFECE6] dark:hover:bg-[#273630] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCityListOpen((prev) => !prev)}
                      aria-label={
                        isCityListOpen ? 'סגור רשימת ערים' : 'פתח רשימת ערים'
                      }
                      className="p-1 rounded-lg text-[#5A605C] dark:text-[#C2CEC8] hover:bg-[#EFECE6] dark:hover:bg-[#273630] cursor-pointer shrink-0"
                    >
                      {isCityListOpen ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {isCityListOpen && (
                    <div
                      role="listbox"
                      aria-label="רשימת ערים בישראל"
                      className="absolute right-0 left-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/15 dark:border-white/15 shadow-xl z-30 divide-y divide-[#2D312E]/6 dark:divide-white/8"
                    >
                      {filteredCities.length === 0 ? (
                        <div className="px-4 py-4 text-center text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8]">
                          לא נמצאה עיר בשם &quot;{cityQuery}&quot;. נסו להקליד שם עיר סמוכה.
                        </div>
                      ) : (
                        filteredCities.map((city) => {
                          const isSelected = city.id === activeCity.id;
                          return (
                            <button
                              key={city.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleSelectCity(city.id)}
                              className={`w-full px-3.5 py-2.5 text-right flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E1ECE8] dark:bg-[#243E35] text-[#2D312E] dark:text-[#FAF8F5]'
                                  : 'hover:bg-[#EFECE6] dark:hover:bg-[#273630] text-[#2D312E] dark:text-[#FAF8F5]'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="text-sm font-bold block truncate">
                                  {city.name}
                                </span>
                                <span className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8] block">
                                  {city.region}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-semibold text-[#B88128] dark:text-[#E5C17A] tabular-nums">
                                  נרות {city.candleLighting}
                                </span>
                                {isSelected && (
                                  <Check
                                    className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10 p-3.5">
                  <span className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] block">
                    סוף זמן אכילת חמץ
                  </span>
                  <span className="font-display text-xl font-bold text-[#9B4D1E] dark:text-[#F4B68C] tabular-nums mt-1 block">
                    {activeCity.eatChametzEnd}
                  </span>
                </div>
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10 p-3.5">
                  <span className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] block">
                    סוף זמן ביעור חמץ
                  </span>
                  <span className="font-display text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5] tabular-nums mt-1 block">
                    {activeCity.burnChametzEnd}
                  </span>
                </div>
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10 p-3.5">
                  <span className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] block">
                    הדלקת נרות חג
                  </span>
                  <span className="font-display text-xl font-bold text-[#B88128] dark:text-[#E5C17A] tabular-nums mt-1 block">
                    {activeCity.candleLighting}
                  </span>
                </div>
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10 p-3.5">
                  <span className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] block">
                    צאת הכוכבים וליל הסדר
                  </span>
                  <span className="font-display text-xl font-bold text-[#5E8C7D] dark:text-[#8FB8CA] tabular-nums mt-1 block">
                    {activeCity.tzeitHakochavim}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8]">
                הזמנים הינם משוערים לפי חישוב אסטרונומי לאופק העיר (יש לוודא זמנים מדויקים לפי לוח השנה המקומי ומנהג הקהילה).
              </p>
            </section>

            {/* Section 2: Interactive 15 Seder Simanim */}
            <section className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A]"
                    aria-hidden="true"
                  />
                  <h3 className="font-display text-lg font-bold">
                    סימני הסדר האינטראקטיביים ({checkedSimanim.length}/
                    {SEDER_SIMANIM.length})
                  </h3>
                </div>
                {checkedSimanim.length > 0 && (
                  <button
                    type="button"
                    onClick={onResetSimanim}
                    className="text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8] hover:underline cursor-pointer"
                  >
                    אפס סימונים
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SEDER_SIMANIM.map((siman, idx) => {
                  const checked = checkedSimanim.includes(siman.id);
                  return (
                    <button
                      key={siman.id}
                      type="button"
                      onClick={() => onToggleSiman(siman.id)}
                      className={`text-right rounded-xl p-3 border transition-all flex items-start gap-2.5 cursor-pointer ${
                        checked
                          ? 'bg-[#E1ECE8] dark:bg-[#243E35] border-[#5E8C7D]/45 dark:border-[#E5C17A]/45'
                          : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/10 dark:border-white/10 hover:border-[#5E8C7D]/40'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                          checked
                            ? 'bg-[#5E8C7D] text-white'
                            : 'bg-[#EFECE6] dark:bg-[#273630] text-[#5A605C] dark:text-[#C2CEC8]'
                        }`}
                      >
                        {checked ? (
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`font-display text-sm font-bold block ${
                            checked
                              ? 'line-through text-[#456B5E] dark:text-[#E5C17A]'
                              : ''
                          }`}
                        >
                          {siman.name}
                        </span>
                        <span className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8] leading-snug block">
                          {siman.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Section 3: Seder Shironim & Playlist */}
            <section className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Music
                  className="w-5 h-5 text-[#8FB8CA]"
                  aria-hidden="true"
                />
                <h3 className="font-display text-lg font-bold">
                  שירון ורשימת השמעה לליל הסדר
                </h3>
              </div>

              <div className="space-y-2.5">
                {SEDER_SONGS.map((song) => {
                  const isExpanded = activeSongId === song.id;
                  return (
                    <div
                      key={song.id}
                      className="rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/10 dark:border-white/10 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSongId(isExpanded ? '' : song.id)
                        }
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-right cursor-pointer hover:bg-[#EFECE6]/40 dark:hover:bg-white/5"
                      >
                        <div>
                          <span className="font-display text-sm sm:text-base font-bold block">
                            {song.title}
                          </span>
                          <span className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8]">
                            {song.mood}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 shrink-0 text-[#5E8C7D] dark:text-[#E5C17A]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0 text-[#5A605C] dark:text-[#C2CEC8]" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#2D312E]/8 dark:border-white/10 text-sm leading-relaxed whitespace-pre-line text-[#2D312E] dark:text-[#FAF8F5]">
                          {song.lyrics}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
