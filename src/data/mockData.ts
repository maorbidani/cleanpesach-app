import {
  CleaningLevel,
  CleaningTask,
  FamilyMember,
  FinalPrepItem,
  Room,
  TaskCategory,
} from '../types';

export const DAYS_UNTIL_BEDIKAT_CHAMETZ = 14;

export const DEFAULT_SEDER_DATE_ISO = '2027-04-21';

export function getDefaultTargetDateISO(): string {
  return DEFAULT_SEDER_DATE_ISO;
}

export function calculateDaysRemaining(targetDateISO: string): number {
  if (!targetDateISO) return DAYS_UNTIL_BEDIKAT_CHAMETZ;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${targetDateISO}T00:00:00`);
  if (Number.isNaN(target.getTime())) return DAYS_UNTIL_BEDIKAT_CHAMETZ;
  const diffMs = target.getTime() - today.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function getTaskPoints(category: TaskCategory): number {
  return category === 'חובת חמץ' ? 20 : 10;
}

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'fm-1', name: 'אמא', role: 'מבוגר' },
  { id: 'fm-2', name: 'אבא', role: 'מבוגר' },
  { id: 'fm-3', name: 'נועה', role: 'ילד/ה' },
];

export const ROOM_CATALOG: Room[] = [
  {
    id: 'kitchen',
    name: 'מטבח',
    subtitle: 'תנור, מקרר, מקפיא ומזווה',
    icon: 'kitchen',
    isLocked: false,
  },
  {
    id: 'living',
    name: 'סלון',
    subtitle: 'ספות, שטיחים, מזנון וויטרינה',
    icon: 'living',
    isLocked: false,
  },
  {
    id: 'master',
    name: 'חדר הורים',
    subtitle: 'ארון בגדים, שידות ומיטה',
    icon: 'master',
    isLocked: false,
  },
  {
    id: 'kids',
    name: 'חדרי ילדים',
    subtitle: 'צעצועים, תיקים, ספרייה וארון',
    icon: 'kids',
    isLocked: false,
  },
  {
    id: 'balcony',
    name: 'מרפסת',
    subtitle: 'תריסים, פינת ישיבה ואדניות',
    icon: 'balcony',
    isLocked: false,
  },
  {
    id: 'storage',
    name: 'מחסן',
    subtitle: 'מדפי אחסון, ארגזים וכלים',
    icon: 'storage',
    isLocked: false,
  },
  {
    id: 'car',
    name: 'רכב',
    subtitle: 'מושבים, כיסאות בטיחות ותא מטען',
    icon: 'car',
    isLocked: false,
  },
];

export const INITIAL_ROOMS: Room[] = [
  ROOM_CATALOG[0],
  ROOM_CATALOG[1],
  { ...ROOM_CATALOG[2], isLocked: true },
  { ...ROOM_CATALOG[3], name: 'חדר ילדים' },
  ROOM_CATALOG[4],
  ROOM_CATALOG[6],
];

export const CATALOG_TASKS: CleaningTask[] = [
  // מטבח (6 משימות)
  {
    id: 't-kitchen-1',
    roomId: 'kitchen',
    title: 'ניקוי מדפי המקרר וגומיות הדלתות מחמץ',
    estimatedMinutes: 25,
    category: 'חובת חמץ',
    completed: false,
    isToday: true,
    assignedToId: 'fm-1',
    cleaningTip:
      'הוציאו את המדפים והמגירות ושטפו במים חמימים וסבון כלים. את חריצי גומיות הדלת נקו בעזרת מברשת שיניים רכה טבולה במים עם מעט חומץ או סבון עדין.',
    recommendedSupplies: [
      'סבון כלים עדין',
      'מטלית מיקרופייבר',
      'מברשת שיניים רכה',
      'קערת מים חמימים',
    ],
  },
  {
    id: 't-kitchen-2',
    roomId: 'kitchen',
    title: 'ניקוי תנור האפייה והכיריים לקראת הכשרה',
    estimatedMinutes: 45,
    category: 'חובת חמץ',
    completed: false,
    assignedToId: 'fm-2',
    cleaningTip:
      'מרחו משחה של סודה לשתייה ומים על דפנות התנור הפנימיות והמתינו 30 דקות לפני הניגוב. מומלץ להמתין 24 שעות ללא שימוש לפני ההכשרה בחום גבוה.',
    recommendedSupplies: [
      'מסיר שומנים עדין',
      'אבקת סודה לשתייה',
      'ספוג הפלא',
      'כפפות גומי',
    ],
  },
  {
    id: 't-kitchen-3',
    roomId: 'kitchen',
    title: 'מיון וניקוי ארונות המזווה והתבלינים',
    estimatedMinutes: 35,
    category: 'חובת חמץ',
    completed: true,
    assignedToId: 'fm-1',
    cleaningTip:
      'רוקנו מדף אחד בכל פעם, שאבו פינות ומסילות מפירורים ונגבו בתמיסת מים וחומץ טבעי. מרכזים את מוצרי החמץ הסגורים בארגז ייעודי למכירה או לצריכה.',
    recommendedSupplies: [
      'שואב אבק ידני',
      'חומץ טבעי',
      'מטלית לחה',
      'קופסאות אחסון למזון',
    ],
  },
  {
    id: 't-kitchen-4',
    roomId: 'kitchen',
    title: 'הפשרת מקפיא וניגוב יסודי של המגירות',
    estimatedMinutes: 30,
    category: 'חובת חמץ',
    completed: false,
    assignedToId: 'fm-2',
    cleaningTip:
      'נתקו מהחשמל והניחו מגבת סופגת בתחתית המקפיא. לאחר המסת הקרח נגבו עם מים חמימים ומעט סודה לשתייה לנטרול ריחות ומניעת קפיאה חוזרת.',
    recommendedSupplies: [
      'מגבות סופגות',
      'סודה לשתייה',
      'מטלית יבשה',
      'שקיות קירור זמניות',
    ],
  },
  {
    id: 't-kitchen-5',
    roomId: 'kitchen',
    title: 'ניקוי קולט אדים והמסננים משומנים',
    estimatedMinutes: 25,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'פרקו את רשתות המתכת והשרו אותן בכיור עם מים רותחים, סבון כלים ו-2 כפות סודה לשתייה למשך 20 דקות. השומן יימס בקלות ללא שפשוף אגרסיבי.',
    recommendedSupplies: [
      'אבקת סודה לשתייה',
      'סבון כלים',
      'מברשת ניקוי רכה',
      'מטלית נירוסטה',
    ],
  },
  {
    id: 't-kitchen-6',
    roomId: 'kitchen',
    title: 'הברקת חזיתות הארונות העליונים והשיש',
    estimatedMinutes: 20,
    category: 'ניקיון אביב',
    completed: true,
    assignedToId: 'fm-1',
    cleaningTip:
      'נגבו את דלתות הארונות מלמעלה למטה עם מטלית מיקרופייבר לחה ומעט חומר לניקוי כללי, ולאחר מכן עברו עם מטלית יבשה למניעת סימני טיפות.',
    recommendedSupplies: [
      'נוזל ניקוי רב-תכליתי',
      '2 מטליות מיקרופייבר',
      'מגב קטן לשיש',
    ],
  },

  // סלון (5 משימות)
  {
    id: 't-living-1',
    roomId: 'living',
    title: 'שאיבת ספות וכריות הסלון משאריות ופירורים',
    estimatedMinutes: 20,
    category: 'חובת חמץ',
    completed: true,
    isToday: true,
    assignedToId: 'fm-2',
    cleaningTip:
      'הסירו את הכריות הנשלפות ושאבו בעזרת פיה צרה את הקפלים והתפרים. לכתמים קלים על בד, טפחו בעדינות עם מטלית סחוטה במים וסבון טקסטיל.',
    recommendedSupplies: [
      'שואב אבק עם פיה צרה',
      'מטלית לחה',
      'סבון ניקוי לבדים',
    ],
  },
  {
    id: 't-living-2',
    roomId: 'living',
    title: 'ניעור ושאיבת השטיח המרכזי ופינות השולחן',
    estimatedMinutes: 20,
    category: 'חובת חמץ',
    completed: true,
    assignedToId: 'fm-3',
    cleaningTip:
      'שאבו את השטיח בשתי כיוונים (לאורך ולרוחב), גלגלו אותו ושאבו ושטפו גם את הרצפה שמתחתיו לפני החזרתו למקום.',
    recommendedSupplies: [
      'שואב אבק',
      'סודה לשתייה לריענון',
      'מגב ודלי שטיפה',
    ],
  },
  {
    id: 't-living-3',
    roomId: 'living',
    title: 'בדיקת וניקוי מגירות המזנון ושולחן הקפה',
    estimatedMinutes: 15,
    category: 'חובת חמץ',
    completed: false,
    assignedToId: 'fm-3',
    cleaningTip:
      'עברו על כל מגירה ומדף נמוך שילדים מגיעים אליהם, הוציאו פירורים באמצעות מברשת יבשה או שואב, ונגבו במגבון או מטלית לחה.',
    recommendedSupplies: ['שואב אבק ידני', 'מטלית לחה', 'סלסלת מיון'],
  },
  {
    id: 't-living-4',
    roomId: 'living',
    title: 'ניגוב אבק ממדפי הספרים והספרייה',
    estimatedMinutes: 25,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'נעררו קלות את הספרים החשודים בשימוש ליד אוכל (הגדות, סידורים, ספרי קריאה), ונגבו את המדפים במטלית יבשה ללכידת אבק לפני ניגוב לח.',
    recommendedSupplies: [
      'מברשת אבק / נוצה',
      'מטלית מיקרופייבר יבשה',
      'מטלית לחה',
    ],
  },
  {
    id: 't-living-5',
    roomId: 'living',
    title: 'הברקת ויטרינת הסלון, הזכוכיות והמסילות',
    estimatedMinutes: 30,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'התחילו משאיבת האבק מהמסילות התחתונות, ורק אחר כך נקו את הזכוכיות בתנועות אחידות עם תרסיס חלונות ומטלית ייעודית ללא סיבים.',
    recommendedSupplies: [
      'תרסיס לניקוי חלונות',
      'מטלית זכוכית ללא סיבים',
      'שואב אבק למסילות',
    ],
  },

  // חדר הורים (5 משימות)
  {
    id: 't-master-1',
    roomId: 'master',
    title: 'בדיקת כיסים בתיקים ומעילים בארון הבגדים',
    estimatedMinutes: 15,
    category: 'חובת חמץ',
    completed: true,
    assignedToId: 'fm-1',
    cleaningTip:
      'בדקו תיקי עבודה, ארנקים, כיסי מעילים וז׳קטים שבהם עלולים להישאר חטיפים או סוכריות. נעררו כל תיק הפוך מעל הכיור או הפח.',
    recommendedSupplies: [
      'פנס קטן לכיסים עמוקים',
      'שואב אבק ידני',
      'מטלית לחה',
    ],
  },
  {
    id: 't-master-2',
    roomId: 'master',
    title: 'שאיבת מזרן ומתחת למסגרת המיטה',
    estimatedMinutes: 20,
    category: 'ניקיון אביב',
    completed: true,
    assignedToId: 'fm-2',
    cleaningTip:
      'פזרו שכבה דקה של סודה לשתייה על המזרן החשוף, המתינו 15 דקות ושאבו היטב לרענון והסרת ריחות ואבק אביבי.',
    recommendedSupplies: ['שואב אבק', 'סודה לשתייה', 'מטלית לחה למסגרת'],
  },
  {
    id: 't-master-3',
    roomId: 'master',
    title: 'ניקוי מגירות שידות הלילה ומיון תכולה',
    estimatedMinutes: 15,
    category: 'חובת חמץ',
    completed: true,
    assignedToId: 'fm-1',
    cleaningTip:
      'רוקנו כל מגירה למגש, עברו עם שואב ומטלית לחה בפינות והחזירו רק את הפריטים השימושיים ליומיום.',
    recommendedSupplies: [
      'מטלית מיקרופייבר',
      'שואב אבק ידני',
      'ספריי חיטוי עדין',
    ],
  },
  {
    id: 't-master-4',
    roomId: 'master',
    title: 'החלפת מצעים ואוורור ארון הבגדים מבפנים',
    estimatedMinutes: 25,
    category: 'ניקיון אביב',
    completed: true,
    assignedToId: 'fm-1',
    cleaningTip:
      'השאירו את דלתות הארון פתוחות בזמן הניקיון, נגבו את המדפים במטלית לחה עם טיפת מרכך או שמן לבנדר והניחו שקית ריח חדשה.',
    recommendedSupplies: ['מטלית לחה', 'סט מצעים אביבי', 'שקית ריח לארון'],
  },
  {
    id: 't-master-5',
    roomId: 'master',
    title: 'ניקוי חלון, אדן ומסילות חדר ההורים',
    estimatedMinutes: 20,
    category: 'ניקיון אביב',
    completed: true,
    assignedToId: 'fm-2',
    cleaningTip:
      'השתמשו במברשת דקה לשחרור אבק שהצטבר בפינות המסילה, שאבו ונקו את הזכוכיות בתנועת S למראה מבריק.',
    recommendedSupplies: ['תרסיס חלונות', 'מברשת מסילות', 'מטלית זכוכית'],
  },

  // חדר ילדים (5 משימות)
  {
    id: 't-kids-1',
    roomId: 'kids',
    title: 'ניקוי ארגזי המשחקים ומגירות היצירה מפירורים',
    estimatedMinutes: 30,
    category: 'חובת חמץ',
    completed: true,
    assignedToId: 'fm-3',
    cleaningTip:
      'שפכו את תכולת ארגזי הלגו והקוביות על סדין פרוש, שטפו ארגזים ריקים במים וסבון, סננו פירורים והחזירו את הצעצועים פנימה.',
    recommendedSupplies: ['סדין פרוש למיון', 'מטליות לחות', 'קערת מים וסבון'],
  },
  {
    id: 't-kids-2',
    roomId: 'kids',
    title: 'בדיקה, ריקון ושטיפה של תיקי בית הספר והקלמרים',
    estimatedMinutes: 20,
    category: 'חובת חמץ',
    completed: false,
    assignedToId: 'fm-3',
    cleaningTip:
      'רוקנו את כל התאים כולל תאי הצד לבקבוקים, הפכו ונקו פירורים בפינות התחתונות. רוב ילקוטי הבד מתאימים לשטיפה ידנית עדינה וייבוש בצל.',
    recommendedSupplies: ['שואב אבק ידני', 'מברשת רכה', 'סבון כביסה עדין'],
  },
  {
    id: 't-kids-3',
    roomId: 'kids',
    title: 'בדיקה מתחת למיטות ובארגז המצעים מחמץ',
    estimatedMinutes: 15,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'בדקו עם פנס מתחת למיטות, מאחורי שידת ההחתלה או הספרייה — מקומות שילדים נוטים להחביא או להפיל בהם עוגיות ובייגלה.',
    recommendedSupplies: ['פנס', 'שואב אבק', 'מגב לח'],
  },
  {
    id: 't-kids-4',
    roomId: 'kids',
    title: 'מיון בגדי חורף והעברת פריטים שקטנו למסירה',
    estimatedMinutes: 35,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'הכינו 3 שקיות מראש: "אחסון לחורף הבא", "מסירה/תרומה" ו"תיקון". כך ההחלטה על כל בגד מהירה ויוצרת סדר בארון.',
    recommendedSupplies: [
      'שקיות אחסון ואקום',
      'שקיות למסירה',
      'מטלית לניגוב מדפים',
    ],
  },
  {
    id: 't-kids-5',
    roomId: 'kids',
    title: 'ניגוב שולחן הכתיבה, הכיסא וידיות הדלת',
    estimatedMinutes: 20,
    category: 'ניקיון אביב',
    completed: false,
    assignedToId: 'fm-3',
    cleaningTip:
      'לסימני צבעים ועפרונות על שולחן למינציה, השתמשו בעדינות בספוג הפלא לח ולאחר מכן עברו עם מטלית יבשה.',
    recommendedSupplies: [
      'ספוג הפלא',
      'תרסיס ניקוי כללי',
      'מטלית מיקרופייבר',
    ],
  },

  // מרפסת (5 משימות)
  {
    id: 't-balcony-1',
    roomId: 'balcony',
    title: 'ניקוי חלונות, תריסים ומסילות מהאבק האביבי',
    estimatedMinutes: 30,
    category: 'ניקיון אביב',
    completed: false,
    isToday: true,
    assignedToId: 'fm-2',
    cleaningTip:
      'לניקוי שלבי תריס במהירות, הלבישו גרב כותנה ישנה לחה על כף היד והחליקו לאורך כל שלב משני הצדדים בפעולה אחת.',
    recommendedSupplies: [
      'גרב כותנה ישנה / מברשת תריסים',
      'דלי מים עם חומר כללי',
      'תרסיס חלונות',
    ],
  },
  {
    id: 't-balcony-2',
    roomId: 'balcony',
    title: 'ניקוי שולחן המרפסת וכריות החוץ משאריות חמץ',
    estimatedMinutes: 15,
    category: 'חובת חמץ',
    completed: true,
    assignedToId: 'fm-1',
    cleaningTip:
      'נעררו היטב את כריות הישיבה ושאבו את הקפלים. נגבו את שולחן החוץ בתמיסת מים וסבון במיוחד בחיבורי העץ או הפלסטיק.',
    recommendedSupplies: ['מטלית לחה', 'סבון כלים', 'שואב אבק ידני'],
  },
  {
    id: 't-balcony-3',
    roomId: 'balcony',
    title: 'בדיקת ארון השירות במרפסת ומדפי האחסון',
    estimatedMinutes: 15,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'עברו על ארון השירות לוודא שאין שקיות מזון, מזון לבעלי חיים שמכיל חמץ או צידניות עם שאריות פיקניק.',
    recommendedSupplies: ['מטאטא ויעה', 'מטלית לחה', 'שקיות אשפה'],
  },
  {
    id: 't-balcony-4',
    roomId: 'balcony',
    title: 'שטיפת ריצוף המרפסת ומעקה הזכוכית',
    estimatedMinutes: 25,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'טאטאו היטב את העלים והחול יבשים לפני השטיפה במים כדי שהאבק לא יהפוך לבוץ. את מעקה הזכוכית ייבשו במגב גומי קטן.',
    recommendedSupplies: ['מטאטא חוץ', 'מגב גומי לזכוכית', 'נוזל רצפות'],
  },
  {
    id: 't-balcony-5',
    roomId: 'balcony',
    title: 'סידור, גיזום וטיפוח אדניות הצמחים לאביב',
    estimatedMinutes: 20,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'גזמו עלים יבשים, נגבו אבק מעלים רחבים במטלית לחה ונקו את תחתיות העציצים מבוץ עומד.',
    recommendedSupplies: ['מזמרה קטנה', 'משפך מים', 'מטלית לניגוב עלים'],
  },

  // מחסן (5 משימות - משמש באשף ההתאמה האישית)
  {
    id: 't-storage-1',
    roomId: 'storage',
    title: 'בדיקת ארגזים ושקיות מזון סגורים במחסן מחמץ',
    estimatedMinutes: 25,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'עברו על מדפי המלאי והמזווה הרזרבי במחסן. מרכזים חמץ סגור לארון מכירה ומנקים מדפים מאבק ופירורים.',
    recommendedSupplies: ['פנס', 'מטלית לחה', 'ארגז למכירת חמץ'],
  },
  {
    id: 't-storage-2',
    roomId: 'storage',
    title: 'ניקוי וסידור מדפי כלי הפסח והכשרתם להוצאה',
    estimatedMinutes: 30,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'נקו את האבק מארגזי כלי הפסח לפני הכנסתם למטבח והכינו עמדה נקייה ומוכנה לפריקה.',
    recommendedSupplies: ['מטלית יבשה', 'מטלית לחה', 'שואב אבק'],
  },
  {
    id: 't-storage-3',
    roomId: 'storage',
    title: 'בדיקת צידניות, ציוד קמפינג ותיקי טיולים',
    estimatedMinutes: 20,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'פתחו צידניות, מזרני שטח ושקי שינה, נעררו היטב ובדקו כיסים פנימיים משאריות חטיפים.',
    recommendedSupplies: ['שואב אבק ידני', 'מגבונים לחים', 'ספריי ניקוי'],
  },
  {
    id: 't-storage-4',
    roomId: 'storage',
    title: 'טאטוא, שאיבה ושטיפת רצפת המחסן',
    estimatedMinutes: 25,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'הרימו קופסאות מהרצפה על משטחי פלסטיק וטאטאו היטב פינות ואזורים מאחורי הדלת.',
    recommendedSupplies: ['מטאטא', 'יעה', 'דלי ומגב'],
  },
  {
    id: 't-storage-5',
    roomId: 'storage',
    title: 'מיון ציוד ישן ושחרור פריטים מיותרים לתרומה',
    estimatedMinutes: 35,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'כלל אצבע לפסח: חפץ שלא השתמשתם בו במשך שנה שלמה יכול למצוא בית חדש ומפנה אוויר נקי בבית.',
    recommendedSupplies: ['שקיות חזקות', 'מדבקות סימון', 'טוש'],
  },

  // רכב (5 משימות)
  {
    id: 't-car-1',
    roomId: 'car',
    title: 'פירוק ושאיבת כיסאות הבטיחות ומושבי הרכב',
    estimatedMinutes: 30,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'הוציאו את כיסאות הבטיחות מחוץ לרכב, נעררו אותם הפוך מעל המדרכה ושאבו את משטחי המושב שמתחתם — שם מצטברים רוב הפירורים.',
    recommendedSupplies: ['שואב אבק לרכב', 'מברשת לריפוד', 'מטליות לחות'],
  },
  {
    id: 't-car-2',
    roomId: 'car',
    title: 'ריקון תא הכפפות, דלתות הרכב ומחזיקי הכוסות',
    estimatedMinutes: 15,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'רוקנו את כל התאים לשקית, שלפו את תחתיות הגומי מתוך מחזיקי הכוסות לשטיפה בכיור והחזירו יבשות.',
    recommendedSupplies: ['שקית לאיסוף חפצים', 'סבון ומים', 'מטלית מיקרופייבר'],
  },
  {
    id: 't-car-3',
    roomId: 'car',
    title: 'שאיבת שטיחוני הרכב ותא המטען לעומק',
    estimatedMinutes: 25,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'הוציאו את השטיחונים, הברישו חול ואבק לפני השאיבה ושטפו שטיחוני גומי בצינור מים והעמידו לייבוש בשמש.',
    recommendedSupplies: [
      'שואב אבק חזק',
      'מברשת שטיחים קשיחה',
      'שקית לאשפה',
    ],
  },
  {
    id: 't-car-4',
    roomId: 'car',
    title: 'ניקוי חריצים שבין המושבים ומתחת למשענת היד',
    estimatedMinutes: 20,
    category: 'חובת חמץ',
    completed: false,
    cleaningTip:
      'הזיזו את המושבים הקדמיים עד הסוף קדימה ואז עד הסוף אחורה כדי להגיע בנוחות למסילות המושב עם פיה צרה.',
    recommendedSupplies: ['פיה צרה לשואב', 'פנס', 'מקלוני עץ / מברשת דקה'],
  },
  {
    id: 't-car-5',
    roomId: 'car',
    title: 'ניגוב הדשבורד, ההגה והשמשות מבפנים',
    estimatedMinutes: 15,
    category: 'ניקיון אביב',
    completed: false,
    cleaningTip:
      'השתמשו במברשת רכה (אפילו מברשת איפור נקייה) לפתחי המזגן והכפתורים, ובמטלית מיקרופייבר ייעודית לשמשה הפנימית ללא סינוור.',
    recommendedSupplies: [
      'מברשת רכה לפתחי מזגן',
      'תרסיס חלונות',
      'מטלית מיקרופייבר',
    ],
  },
];

export const INITIAL_TASKS: CleaningTask[] = CATALOG_TASKS.filter((task) =>
  INITIAL_ROOMS.some((room) => room.id === task.roomId)
);

export function createTasksForCustomRoom(
  room: Room,
  cleaningLevel: CleaningLevel
): CleaningTask[] {
  const baseTasks: CleaningTask[] = [
    {
      id: `t-${room.id}-1`,
      roomId: room.id,
      title: `בדיקה וניקוי מדפים, מגירות ופינות ב${room.name} מחמץ`,
      estimatedMinutes: 20,
      category: 'חובת חמץ',
      completed: false,
      cleaningTip:
        'עברו על פינות, מגירות, תיקים או מדפים נגישים, שאבו פירורים ונגבו במטלית לחה נקייה.',
      recommendedSupplies: ['שואב אבק ידני', 'מטלית לחה', 'פנס'],
    },
    {
      id: `t-${room.id}-2`,
      roomId: room.id,
      title: `הרמת חפצים ושאיבה יסודית של הרצפה והפאנלים ב${room.name}`,
      estimatedMinutes: 20,
      category: 'חובת חמץ',
      completed: false,
      cleaningTip:
        'הסיטו רהיטים קלים, שאבו לאורך הפאנלים ושטפו את האזור כך שלא יישאר זכר לפירורים.',
      recommendedSupplies: ['שואב אבק', 'מגב ודלי', 'נוזל רצפות'],
    },
    {
      id: `t-${room.id}-3`,
      roomId: room.id,
      title: `ניגוב אבק ממשטחים, דלתות וידיות ב${room.name}`,
      estimatedMinutes: 15,
      category: 'ניקיון אביב',
      completed: false,
      cleaningTip:
        'נגבו מלמעלה למטה עם מטלית מיקרופייבר וחומר ניקוי עדין, כולל משקופים ומתגי חשמל.',
      recommendedSupplies: ['מטלית מיקרופייבר', 'תרסיס ניקוי כללי'],
    },
    {
      id: `t-${room.id}-4`,
      roomId: room.id,
      title: `ניקוי חלון, אדן ומסילות ואוורור ב${room.name}`,
      estimatedMinutes: 25,
      category: 'ניקיון אביב',
      completed: false,
      cleaningTip:
        'שאבו אבק מהמסילות לפני השימוש בחומר רטוב והבריקו את הזכוכיות במטלית ייעודית.',
      recommendedSupplies: ['תרסיס חלונות', 'מטלית זכוכית', 'מברשת מסילות'],
    },
  ];

  if (cleaningLevel === 'חמץ בלבד') {
    return baseTasks.filter((t) => t.category === 'חובת חמץ');
  }
  if (cleaningLevel === 'מאוזן') {
    return baseTasks.slice(0, 3);
  }
  return baseTasks;
}

export function generateHomeFromOnboarding(params: {
  selectedStandardRoomIds: string[];
  customRooms: Room[];
  cleaningLevel: CleaningLevel;
  familyMembers: FamilyMember[];
}): { rooms: Room[]; tasks: CleaningTask[] } {
  const { selectedStandardRoomIds, customRooms, cleaningLevel, familyMembers } =
    params;

  const standardRooms = ROOM_CATALOG.filter((room) =>
    selectedStandardRoomIds.includes(room.id)
  ).map((room) => ({ ...room, isLocked: false }));

  const allRooms = [
    ...standardRooms,
    ...customRooms.map((r) => ({ ...r, isLocked: false })),
  ];

  const allTasks: CleaningTask[] = [];
  const defaultMemberIds = familyMembers.map((m) => m.id);
  let memberIdx = 0;

  for (const room of standardRooms) {
    let roomTasks = CATALOG_TASKS.filter((t) => t.roomId === room.id);

    if (cleaningLevel === 'חמץ בלבד') {
      roomTasks = roomTasks.filter((t) => t.category === 'חובת חמץ');
    } else if (cleaningLevel === 'מאוזן') {
      const chametz = roomTasks.filter((t) => t.category === 'חובת חמץ');
      const spring = roomTasks
        .filter((t) => t.category === 'ניקיון אביב')
        .slice(0, 2);
      roomTasks = [...chametz, ...spring];
    }

    for (const task of roomTasks) {
      const assignedToId =
        defaultMemberIds.length > 0
          ? defaultMemberIds[memberIdx % defaultMemberIds.length]
          : null;
      memberIdx += 1;

      allTasks.push({
        ...task,
        completed: false,
        isToday: false,
        assignedToId,
      });
    }
  }

  for (const customRoom of customRooms) {
    const customTasks = createTasksForCustomRoom(customRoom, cleaningLevel);
    for (const task of customTasks) {
      const assignedToId =
        defaultMemberIds.length > 0
          ? defaultMemberIds[memberIdx % defaultMemberIds.length]
          : null;
      memberIdx += 1;

      allTasks.push({
        ...task,
        assignedToId,
      });
    }
  }

  // Flag up to 3 featured tasks across rooms for "המשימות להיום"
  const todayAssignedRooms = new Set<string>();
  let todayCount = 0;
  for (const task of allTasks) {
    if (todayCount >= 3) break;
    if (!todayAssignedRooms.has(task.roomId)) {
      task.isToday = true;
      todayAssignedRooms.add(task.roomId);
      todayCount += 1;
    }
  }
  for (const task of allTasks) {
    if (todayCount >= 3) break;
    if (!task.isToday) {
      task.isToday = true;
      todayCount += 1;
    }
  }

  return { rooms: allRooms, tasks: allTasks };
}

export function calculateRoomProgress(
  room: Room,
  tasks: CleaningTask[]
): { completedCount: number; totalCount: number; percentage: number } {
  const roomTasks = tasks.filter((t) => t.roomId === room.id);
  const totalCount = roomTasks.length;

  if (room.isLocked) {
    return {
      completedCount: totalCount,
      totalCount,
      percentage: 100,
    };
  }

  const completedCount = roomTasks.filter((t) => t.completed).length;
  const rawPercentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const percentage = Number.isFinite(rawPercentage)
    ? Math.max(0, Math.min(100, rawPercentage))
    : 0;

  return { completedCount, totalCount, percentage };
}

export function calculateOverallProgress(
  rooms: Room[],
  tasks: CleaningTask[]
): {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  lockedRooms: number;
} {
  let effectiveCompleted = 0;
  let totalTasks = 0;
  let lockedRooms = 0;

  for (const room of rooms) {
    const roomStats = calculateRoomProgress(room, tasks);
    effectiveCompleted += roomStats.completedCount;
    totalTasks += roomStats.totalCount;
    if (room.isLocked) {
      lockedRooms += 1;
    }
  }

  const rawPercentage =
    totalTasks === 0
      ? rooms.length === 0
        ? 0
        : Math.round((lockedRooms / rooms.length) * 100)
      : Math.round((effectiveCompleted / totalTasks) * 100);

  const percentage = Number.isFinite(rawPercentage)
    ? Math.max(0, Math.min(100, rawPercentage))
    : 0;

  return {
    completedTasks: effectiveCompleted,
    totalTasks,
    percentage,
    lockedRooms,
  };
}

export function calculateFamilyStats(
  members: FamilyMember[],
  tasks: CleaningTask[]
): {
  memberStats: Array<{
    member: FamilyMember;
    completedCount: number;
    assignedCount: number;
    points: number;
  }>;
  totalPoints: number;
} {
  let totalPoints = 0;

  for (const task of tasks) {
    if (task.completed) {
      totalPoints += getTaskPoints(task.category);
    }
  }

  const memberStats = members.map((member) => {
    const assigned = tasks.filter((t) => t.assignedToId === member.id);
    const completed = assigned.filter((t) => t.completed);
    const points = completed.reduce(
      (sum, task) => sum + getTaskPoints(task.category),
      0
    );

    return {
      member,
      completedCount: completed.length,
      assignedCount: assigned.length,
      points: Number.isFinite(points) ? points : 0,
    };
  });

  return {
    memberStats,
    totalPoints: Number.isFinite(totalPoints) ? totalPoints : 0,
  };
}

export const INITIAL_FINAL_PREP_ITEMS: FinalPrepItem[] = [
  {
    id: 'prep-sell-chametz',
    title: 'מכירת חמץ',
    description:
      'מילוי טופס מכירת חמץ סגור ומוצרים שאינם כשרים לפסח (דרך הרבנות המקומית או אונליין) לפני שעת האיסור בערב החג.',
    completed: false,
  },
  {
    id: 'prep-bedika-kit',
    title: 'הכנת ערכת בדיקת חמץ (נר, נוצה, כף עץ)',
    description:
      'הכנת נר שעווה יחיד, נוצה, כף עץ, שקית נייר ו-10 פתיתי לחם עטופים מראש לקראת ליל י״ד בניסן.',
    completed: false,
  },
  {
    id: 'prep-seder-table',
    title: 'סידור שולחן הסדר',
    description:
      'הכנת קערת ליל הסדר (זרוע, ביצה, מרור, חרוסת, כרפס וחזרת), הגדות, מצות שמורות ויין או מיץ ענבים.',
    completed: false,
  },
];

export function buildWhatsAppTaskUrl(params: {
  memberName: string;
  taskTitle: string;
  roomName: string;
  estimatedMinutes: number;
}): string {
  const message = `היי ${params.memberName}! 🌿 נשמח לעזרה במשימת פסח בקליןפסח: "${params.taskTitle}" (חדר: ${params.roomName}, כ-${params.estimatedMinutes} דקות). תודה! ✨`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

