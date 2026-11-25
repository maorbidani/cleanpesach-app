import heroSpringHomeImg from '../assets/images/hero_spring_home_1795604278789.jpg';
import roomKitchenImg from '../assets/images/room_kitchen_bright_1795604279699.jpg';
import roomLivingImg from '../assets/images/room_living_room_1795604280101.jpg';
import roomMasterImg from '../assets/images/room_master_bedroom_1795604279773.jpg';
import roomKidsImg from '../assets/images/room_kids_playroom_1795604280922.jpg';
import roomBalconyImg from '../assets/images/room_blooming_balcony_1795604281203.jpg';
import roomStorageImg from '../assets/images/room_tidy_storage_1795604281119.jpg';
import roomCarImg from '../assets/images/room_clean_car_1795604282721.jpg';
import planSederTableImg from '../assets/images/plan_seder_table_1795604283327.jpg';
import planKosherKitchenwareImg from '../assets/images/plan_kosher_kitchenware_1795604363947.jpg';
import planShoppingBasketImg from '../assets/images/plan_shopping_basket_1795604288651.jpg';
import planSpringTrailImg from '../assets/images/plan_spring_trail_1795604347290.jpg';
import avatarMotherImg from '../assets/images/avatar_mother_smiling_1795604283907.jpg';
import avatarFatherImg from '../assets/images/avatar_father_smiling_1795604283968.jpg';
import avatarGirlImg from '../assets/images/avatar_girl_smiling_1795604284865.jpg';
import avatarBoyImg from '../assets/images/avatar_boy_smiling_1795604363138.jpg';

import { FamilyMember, RoomIconKey } from '../types';

export const HERO_SPRING_HOME_IMAGE = heroSpringHomeImg;

export const PLANNING_BANNER_IMAGES = {
  seder: planSederTableImg,
  koshering: planKosherKitchenwareImg,
  shopping: planShoppingBasketImg,
  trips: planSpringTrailImg,
} as const;

export interface RoomVisualTheme {
  imageSrc: string | null;
  imageAlt: string;
  gradientBg: string;
  cardTintClass: string;
  borderClass: string;
  iconBgClass: string;
  accentTextClass: string;
  progressBarClass: string;
  buttonClass: string;
}

export const ROOM_VISUAL_THEMES: Record<RoomIconKey, RoomVisualTheme> = {
  kitchen: {
    imageSrc: roomKitchenImg,
    imageAlt: 'מטבח מואר ונקי עם משטח עבודה מסודר ולימונים טריים לאור השמש',
    gradientBg: 'from-[#F9D6BE] via-[#FBE9DB] to-[#F3B08A]',
    cardTintClass:
      'bg-gradient-to-b from-[#FFF5EE] to-[#FAECE2] dark:from-[#33251E] dark:to-[#271F1A]',
    borderClass: 'border-[#E88D5D]/35 dark:border-[#F2A679]/35',
    iconBgClass:
      'bg-[#FDE4D3] dark:bg-[#4B2F21] text-[#C85A26] dark:text-[#FFB38A]',
    accentTextClass: 'text-[#B54B1C] dark:text-[#FFB38A]',
    progressBarClass: 'bg-gradient-to-l from-[#F28444] to-[#E25A34]',
    buttonClass: 'bg-[#D96934] hover:bg-[#C25724] text-white',
  },
  living: {
    imageSrc: roomLivingImg,
    imageAlt: 'סלון חמים ומרווח עם כריות טורקיז, שטיח נקי ואור אביבי',
    gradientBg: 'from-[#BFEAF0] via-[#E2F6F8] to-[#8AD4DF]',
    cardTintClass:
      'bg-gradient-to-b from-[#F0FAFC] to-[#E3F4F6] dark:from-[#1B3338] dark:to-[#17282C]',
    borderClass: 'border-[#33A8B8]/35 dark:border-[#5AD0DF]/35',
    iconBgClass:
      'bg-[#D4F1F5] dark:bg-[#1E454D] text-[#116F7D] dark:text-[#7CE4F0]',
    accentTextClass: 'text-[#0E6977] dark:text-[#7CE4F0]',
    progressBarClass: 'bg-gradient-to-l from-[#28B7C5] to-[#178FA3]',
    buttonClass: 'bg-[#1D8C9B] hover:bg-[#167481] text-white',
  },
  master: {
    imageSrc: roomMasterImg,
    imageAlt: 'חדר הורים רגוע ומסודר עם מצעים בהירים ופרחי אביב לבנים',
    gradientBg: 'from-[#DFD3F0] via-[#F2ECF9] to-[#C5B0E2]',
    cardTintClass:
      'bg-gradient-to-b from-[#F9F5FD] to-[#EFE8F8] dark:from-[#2C2438] dark:to-[#231D2D]',
    borderClass: 'border-[#9673C2]/35 dark:border-[#B99CE0]/35',
    iconBgClass:
      'bg-[#EAE0F7] dark:bg-[#3D3052] text-[#6A4596] dark:text-[#D5BDF5]',
    accentTextClass: 'text-[#623D8E] dark:text-[#D5BDF5]',
    progressBarClass: 'bg-gradient-to-l from-[#9D77CC] to-[#7B52B0]',
    buttonClass: 'bg-[#7A56AB] hover:bg-[#664495] text-white',
  },
  kids: {
    imageSrc: roomKidsImg,
    imageAlt: 'חדר ילדים צבעוני ומסודר עם קופסאות צעצועים צהובות וכחולות',
    gradientBg: 'from-[#FFE89D] via-[#FFF6D6] to-[#FFD166]',
    cardTintClass:
      'bg-gradient-to-b from-[#FFFBEF] to-[#FFF2CC] dark:from-[#362E19] dark:to-[#2B2415]',
    borderClass: 'border-[#E6AF2E]/45 dark:border-[#F7C948]/40',
    iconBgClass:
      'bg-[#FDEBA8] dark:bg-[#4F4019] text-[#9A6000] dark:text-[#FFD86B]',
    accentTextClass: 'text-[#8F5800] dark:text-[#FFD86B]',
    progressBarClass: 'bg-gradient-to-l from-[#F7B538] to-[#EA8C1E]',
    buttonClass: 'bg-[#C97C10] hover:bg-[#B06A09] text-white',
  },
  balcony: {
    imageSrc: roomBalconyImg,
    imageAlt: 'מרפסת פורחת ושטופת שמש עם עציצי תבלין ופרחי אביב צבעוניים',
    gradientBg: 'from-[#BDE7C8] via-[#E4F6E8] to-[#87D19E]',
    cardTintClass:
      'bg-gradient-to-b from-[#F2FBF4] to-[#E3F4E7] dark:from-[#1B3524] dark:to-[#16291D]',
    borderClass: 'border-[#4CAF6E]/40 dark:border-[#6CD48E]/35',
    iconBgClass:
      'bg-[#D3F1DB] dark:bg-[#224A2F] text-[#1F703C] dark:text-[#8BE8A7]',
    accentTextClass: 'text-[#1D6B39] dark:text-[#8BE8A7]',
    progressBarClass: 'bg-gradient-to-l from-[#4CC374] to-[#2C9654]',
    buttonClass: 'bg-[#2E8B52] hover:bg-[#237141] text-white',
  },
  storage: {
    imageSrc: roomStorageImg,
    imageAlt: 'מחסן ומזווה מאורגנים עם סלסלות קש ומדפי עץ נקיים',
    gradientBg: 'from-[#F4D9B0] via-[#FBF1E0] to-[#E5BA7D]',
    cardTintClass:
      'bg-gradient-to-b from-[#FCF7EE] to-[#F6EAD6] dark:from-[#342A1C] dark:to-[#292116]',
    borderClass: 'border-[#CF9645]/35 dark:border-[#E5B46C]/35',
    iconBgClass:
      'bg-[#F6E2C0] dark:bg-[#4B3920] text-[#8E5710] dark:text-[#F4CA85]',
    accentTextClass: 'text-[#85510E] dark:text-[#F4CA85]',
    progressBarClass: 'bg-gradient-to-l from-[#DFA043] to-[#BD7A1E]',
    buttonClass: 'bg-[#B47218] hover:bg-[#9B5F10] text-white',
  },
  car: {
    imageSrc: roomCarImg,
    imageAlt: 'רכב משפחתי מבריק ונקי חונה ברחוב פורח באביב',
    gradientBg: 'from-[#C2E2FC] via-[#E5F2FE] to-[#8BC5F8]',
    cardTintClass:
      'bg-gradient-to-b from-[#F1F8FE] to-[#E1F0FC] dark:from-[#1A2D3E] dark:to-[#152432]',
    borderClass: 'border-[#4A9BE0]/40 dark:border-[#74BAEE]/35',
    iconBgClass:
      'bg-[#D3E9FC] dark:bg-[#1E3F5C] text-[#1B609B] dark:text-[#8ACAFA]',
    accentTextClass: 'text-[#175991] dark:text-[#8ACAFA]',
    progressBarClass: 'bg-gradient-to-l from-[#4EA8EE] to-[#2A78C9]',
    buttonClass: 'bg-[#2A77C2] hover:bg-[#1F61A3] text-white',
  },
  custom: {
    imageSrc: null,
    imageAlt: 'חדר נקי ומסודר בבית לקראת פסח',
    gradientBg: 'from-[#FAD2CC] via-[#FCEAE6] to-[#B7E1D3]',
    cardTintClass:
      'bg-gradient-to-b from-[#FEF6F4] to-[#F5EBE7] dark:from-[#2C2526] dark:to-[#222826]',
    borderClass: 'border-[#DF7B68]/35 dark:border-[#E59C8C]/35',
    iconBgClass:
      'bg-[#FADAD3] dark:bg-[#492D29] text-[#A84835] dark:text-[#F5B2A3]',
    accentTextClass: 'text-[#A04230] dark:text-[#F5B2A3]',
    progressBarClass: 'bg-gradient-to-l from-[#E87A64] to-[#5E8C7D]',
    buttonClass: 'bg-[#C45D47] hover:bg-[#AB4B37] text-white',
  },
};

export interface FamilyMemberVisual {
  avatarSrc: string;
  ringClass: string;
  gradientBarClass: string;
  accentBgClass: string;
}

const MEMBER_COLOR_PALETTES = [
  {
    ringClass: 'ring-[#F28444]/60 dark:ring-[#FFB38A]/60',
    gradientBarClass: 'bg-gradient-to-l from-[#F28444] to-[#F7B538]',
    accentBgClass: 'bg-[#FDECE2] dark:bg-[#462B1E]',
  },
  {
    ringClass: 'ring-[#28B7C5]/60 dark:ring-[#7CE4F0]/60',
    gradientBarClass: 'bg-gradient-to-l from-[#28B7C5] to-[#4EA8EE]',
    accentBgClass: 'bg-[#E1F5F7] dark:bg-[#1A3B42]',
  },
  {
    ringClass: 'ring-[#F2B705]/65 dark:ring-[#FFD86B]/60',
    gradientBarClass: 'bg-gradient-to-l from-[#F7B538] to-[#5E8C7D]',
    accentBgClass: 'bg-[#FFF5D4] dark:bg-[#3F3519]',
  },
  {
    ringClass: 'ring-[#9D77CC]/60 dark:ring-[#D5BDF5]/60',
    gradientBarClass: 'bg-gradient-to-l from-[#9D77CC] to-[#EC6E8A]',
    accentBgClass: 'bg-[#F0E8FA] dark:bg-[#332745]',
  },
];

export function getFamilyMemberVisual(
  member: FamilyMember,
  index: number
): FamilyMemberVisual {
  const normalized = member.name.trim().toLowerCase();
  const palette = MEMBER_COLOR_PALETTES[index % MEMBER_COLOR_PALETTES.length];

  const isFemaleHint =
    normalized.includes('אמא') ||
    normalized.includes('אמה') ||
    normalized.includes('סבתא') ||
    normalized.includes('דודה') ||
    normalized.includes('נועה') ||
    normalized.includes('תמר') ||
    normalized.includes('מאיה') ||
    normalized.includes('שירה') ||
    normalized.includes('יעל') ||
    normalized.includes('מיכל') ||
    normalized.includes('אילה') ||
    normalized.includes('רוני') ||
    normalized.includes('הילה') ||
    normalized.endsWith('ה') ||
    normalized.endsWith('ת');

  const isMaleAdultHint =
    normalized.includes('אבא') ||
    normalized.includes('סבא') ||
    normalized.includes('דוד');

  let avatarSrc: string;
  if (member.role === 'ילד/ה') {
    avatarSrc = isFemaleHint || index % 2 === 0 ? avatarGirlImg : avatarBoyImg;
  } else if (isMaleAdultHint) {
    avatarSrc = avatarFatherImg;
  } else if (normalized.includes('אמא') || isFemaleHint) {
    avatarSrc = avatarMotherImg;
  } else {
    avatarSrc = index % 2 === 0 ? avatarMotherImg : avatarFatherImg;
  }

  return {
    avatarSrc,
    ...palette,
  };
}
