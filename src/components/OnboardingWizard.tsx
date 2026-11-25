import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  CleaningLevel,
  FamilyMember,
  FamilyRole,
  Room,
} from '../types';
import {
  ROOM_CATALOG,
  calculateDaysRemaining,
  getDefaultTargetDateISO,
} from '../data/mockData';
import { RoomIcon } from './RoomIcon';

interface OnboardingWizardProps {
  isOpen: boolean;
  isFirstTime: boolean;
  initialRooms: Room[];
  initialFamilyMembers: FamilyMember[];
  initialTargetDate: string;
  initialCleaningLevel: CleaningLevel;
  onClose: () => void;
  onSkipToDefaults: () => void;
  onFinish: (result: {
    selectedStandardRoomIds: string[];
    customRooms: Room[];
    familyMembers: FamilyMember[];
    targetDate: string;
    cleaningLevel: CleaningLevel;
  }) => void;
}

const CLEANING_LEVEL_OPTIONS: Array<{
  id: CleaningLevel;
  title: string;
  description: string;
}> = [
  {
    id: 'חמץ בלבד',
    title: 'חמץ בלבד',
    description: 'ממוקד ומהיר — רק משימות חובת ביעור והכשרת חמץ חיוניות.',
  },
  {
    id: 'מאוזן',
    title: 'מאוזן (מומלץ)',
    description: 'שילוב נעים של ביעור חמץ מלא יחד עם ניקיון אביבי שפוי.',
  },
  {
    id: 'יסודי',
    title: 'יסודי',
    description: 'ניקוי מקיף של כל פינה, חלון, ארון ומגירה בכל רחבי הבית.',
  },
];

export function OnboardingWizard({
  isOpen,
  isFirstTime,
  initialRooms,
  initialFamilyMembers,
  initialTargetDate,
  initialCleaningLevel,
  onClose,
  onSkipToDefaults,
  onFinish,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Rooms
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  const [customRooms, setCustomRooms] = useState<Room[]>([]);
  const [customRoomName, setCustomRoomName] = useState('');

  // Step 2: Family
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<FamilyRole>('מבוגר');

  // Step 3: Target Date & Level
  const [targetDate, setTargetDate] = useState(getDefaultTargetDateISO());
  const [cleaningLevel, setCleaningLevel] = useState<CleaningLevel>('מאוזן');

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setValidationError('');
    setCustomRoomName('');
    setNewMemberName('');

    const standardIds = initialRooms
      .filter((r) => ROOM_CATALOG.some((cat) => cat.id === r.id))
      .map((r) => r.id);
    const existingCustom = initialRooms.filter(
      (r) => !ROOM_CATALOG.some((cat) => cat.id === r.id)
    );

    setSelectedStandardIds(
      standardIds.length > 0
        ? standardIds
        : ['kitchen', 'living', 'master', 'kids', 'balcony', 'car']
    );
    setCustomRooms(existingCustom);
    setMembers(
      initialFamilyMembers.length > 0
        ? initialFamilyMembers
        : [{ id: 'fm-1', name: 'אמא', role: 'מבוגר' }]
    );
    setTargetDate(initialTargetDate || getDefaultTargetDateISO());
    setCleaningLevel(initialCleaningLevel || 'מאוזן');
  }, [
    isOpen,
    initialRooms,
    initialFamilyMembers,
    initialTargetDate,
    initialCleaningLevel,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFirstTime) {
          onSkipToDefaults();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirstTime, onClose, onSkipToDefaults]);

  const toggleStandardRoom = (roomId: string) => {
    setValidationError('');
    setSelectedStandardIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleAddCustomRoom = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = customRoomName.trim();
    if (!trimmed) {
      setValidationError('יש להזין שם לחדר המותאם אישית לפני ההוספה.');
      return;
    }

    const newRoom: Room = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      subtitle: 'חדר מותאם אישית',
      icon: 'custom',
      isLocked: false,
    };

    setCustomRooms((prev) => [...prev, newRoom]);
    setCustomRoomName('');
    setValidationError('');
  };

  const handleRemoveCustomRoom = (roomId: string) => {
    setCustomRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      setValidationError('יש להזין שם לבן או בת המשפחה לפני ההוספה.');
      return;
    }

    const member: FamilyMember = {
      id: `fm-${Date.now()}`,
      name: trimmed,
      role: newMemberRole,
    };

    setMembers((prev) => [...prev, member]);
    setNewMemberName('');
    setValidationError('');
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedStandardIds.length + customRooms.length === 0) {
        setValidationError('יש לבחור לפחות חדר אחד כדי לבנות את המפה.');
        return;
      }
      setValidationError('');
      setStep(2);
      return;
    }

    if (step === 2) {
      if (members.length === 0) {
        setValidationError('הוסיפו לפחות בן משפחה אחד לחלוקת המשימות.');
        return;
      }
      setValidationError('');
      setStep(3);
    }
  };

  const handleSubmitWizard = () => {
    onFinish({
      selectedStandardRoomIds: selectedStandardIds,
      customRooms,
      familyMembers: members,
      targetDate,
      cleaningLevel,
    });
  };

  const daysPreview = calculateDaysRemaining(targetDate);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-wizard-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={isFirstTime ? onSkipToDefaults : onClose}
            className="fixed inset-0 bg-[#2D312E]/45 dark:bg-black/65 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#2D312E] dark:text-[#FAF8F5]"
          >
            {/* Header & Step Progress */}
            <div className="p-6 pb-4 border-b border-[#2D312E]/8 dark:border-white/10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A]">
                    שלב {step} מתוך 3
                  </span>
                  <h2
                    id="onboarding-wizard-title"
                    className="font-display text-2xl sm:text-3xl font-bold text-[#2D312E] dark:text-[#FAF8F5] mt-0.5"
                  >
                    התאמה אישית לבית שלי
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={isFirstTime ? onSkipToDefaults : onClose}
                  aria-label="סגור אשף התאמה אישית"
                  className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* 3-Step Indicator Bar */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { num: 1, label: 'א. חדרי הבית' },
                  { num: 2, label: 'ב. בני המשפחה' },
                  { num: 3, label: 'ג. תאריך ורמה' },
                ].map((s) => (
                  <div key={s.num} className="space-y-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        step >= s.num ? 'bg-[#5E8C7D]' : 'bg-[#EFECE6] dark:bg-[#273630]'
                      }`}
                    />
                    <span
                      className={`block text-xs font-medium ${
                        step === s.num
                          ? 'text-[#2D312E] dark:text-[#FAF8F5] font-semibold'
                          : 'text-[#5A605C] dark:text-[#C2CEC8]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                      אילו חדרים מנקים השנה?
                    </h3>
                    <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] mt-0.5">
                      סמנו את החדרים הקיימים אצלכם בבית או הוסיפו חדר מותאם אישית.
                    </p>
                  </div>

                  {/* Standard Rooms Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ROOM_CATALOG.map((room) => {
                      const isSelected = selectedStandardIds.includes(room.id);
                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => toggleStandardRoom(room.id)}
                          aria-pressed={isSelected}
                          className={`min-h-[56px] p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition-all cursor-pointer text-right ${
                            isSelected
                              ? 'bg-[#DFE9E4] dark:bg-[#243D33] border-[#5E8C7D] text-[#2D312E] dark:text-[#FAF8F5]'
                              : 'bg-[#EFECE6] dark:bg-[#273630] border-[#2D312E]/8 dark:border-white/10 text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#5E8C7D] text-white'
                                  : 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#8FB8CA] dark:text-[#E5C17A]'
                              }`}
                            >
                              <RoomIcon icon={room.icon} className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-semibold truncate">
                              {room.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check
                              className="w-4 h-4 text-[#456B5E] dark:text-[#E5C17A] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Rooms Added */}
                  {customRooms.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8]">
                        חדרים שהוספתם:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {customRooms.map((room) => (
                          <div
                            key={room.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DFE9E4] dark:bg-[#243D33] border border-[#5E8C7D]/40 text-sm font-medium text-[#2D312E] dark:text-[#FAF8F5]"
                          >
                            <span>{room.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomRoom(room.id)}
                              aria-label={`הסר ${room.name}`}
                              className="text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Room Input */}
                  <form
                    onSubmit={handleAddCustomRoom}
                    className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-[#2D312E]/8 dark:border-white/10"
                  >
                      <input
                        type="text"
                        value={customRoomName}
                        onChange={(e) => {
                          setCustomRoomName(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="הוסף חדר מותאם אישית (למשל: חדר עבודה, מרפסת שירות)"
                        className="flex-1 min-w-0 min-h-[44px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60 focus:outline-none focus:ring-2 focus:ring-[#5E8C7D]"
                      />
                      <button
                        type="submit"
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] border border-[#5E8C7D]/40 text-[#456B5E] dark:text-[#E5C17A] text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>הוסף חדר</span>
                      </button>
                    </form>
                  </div>
                )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                      מי משתתף בניקיונות המשפחה?
                    </h3>
                    <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] mt-0.5">
                      הוסיפו את בני הבית כדי לשייך להם משימות ולצבור כוכבים ונקודות יחד.
                    </p>
                  </div>

                  {/* Add Member Form */}
                  <form
                    onSubmit={handleAddMember}
                    className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => {
                          setNewMemberName(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="שם בן/בת המשפחה (למשל: דניאל)"
                        className="flex-1 min-w-0 min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60 focus:outline-none focus:ring-2 focus:ring-[#5E8C7D]"
                      />

                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/10 dark:border-white/10 shrink-0">
                        {(['מבוגר', 'ילד/ה'] as FamilyRole[]).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setNewMemberRole(role)}
                            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              newMemberRole === role
                                ? 'bg-[#5E8C7D] text-white'
                                : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                        <span>הוסף</span>
                      </button>
                    </div>
                  </form>

                  {/* Current Members List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8]">
                      <Users className="w-4 h-4 text-[#8FB8CA]" aria-hidden="true" />
                      <span>בני המשפחה המשתתפים ({members.length}):</span>
                    </div>

                    {members.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-[#5E8C7D] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {member.name.slice(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#2D312E] dark:text-[#FAF8F5] truncate">
                                  {member.name}
                                </p>
                                <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                                  {member.role}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              aria-label={`הסר את ${member.name}`}
                              className="min-w-[38px] min-h-[38px] rounded-lg flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#B84A39] hover:bg-[#FAF8F5] dark:hover:bg-[#1E2B26] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] py-4 text-center">
                        עדיין לא נוספו בני משפחה.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  {/* Target Date */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="wizard-target-date"
                        className="text-base font-bold text-[#2D312E] dark:text-[#FAF8F5] inline-flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4 text-[#8FB8CA]" aria-hidden="true" />
                        <span>תאריך יעד לסיום הניקיונות</span>
                      </label>
                      <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                        בעוד {daysPreview} ימים
                      </span>
                    </div>
                    <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                      ברירת המחדל מוגדרת לי״ג בניסן (ערב בדיקת חמץ — 14 ימים מהיום). ניתן להתאים לכל תאריך שנוח לכם.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        id="wizard-target-date"
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/12 dark:border-white/12 text-sm font-semibold text-[#2D312E] dark:text-[#FAF8F5] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5E8C7D]"
                      />
                      <button
                        type="button"
                        onClick={() => setTargetDate(getDefaultTargetDateISO())}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] transition-colors cursor-pointer"
                      >
                        ברירת מחדל: י״ג בניסן (14 ימים)
                      </button>
                    </div>
                  </div>

                  {/* Cleaning Intensity Level */}
                  <div className="space-y-2.5 pt-2 border-t border-[#2D312E]/8 dark:border-white/10">
                    <h3 className="text-base font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                      רמת הניקיון המבוקשת
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {CLEANING_LEVEL_OPTIONS.map((option) => {
                        const isSelected = cleaningLevel === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setCleaningLevel(option.id)}
                            aria-pressed={isSelected}
                            className={`p-4 rounded-2xl border text-right flex items-start justify-between gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#DFE9E4] dark:bg-[#243D33] border-[#5E8C7D]'
                                : 'bg-[#EFECE6] dark:bg-[#273630] border-[#2D312E]/8 dark:border-white/10 hover:bg-[#E8E4DC] dark:hover:bg-[#2D3E37]'
                            }`}
                          >
                            <div>
                              <p className="text-sm sm:text-base font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                                {option.title}
                              </p>
                              <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8] mt-0.5">
                                {option.description}
                              </p>
                            </div>
                            <span
                              className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                                  : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/20 dark:border-white/20'
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {validationError && (
                <p className="text-sm font-medium text-[#B84A39] dark:text-[#F4B68C] bg-[#F5E1D3]/60 dark:bg-[#492D21] px-4 py-2.5 rounded-xl">
                  {validationError}
                </p>
              )}
            </div>

            {/* Footer Controls */}
            <div className="p-5 sm:px-6 border-t border-[#2D312E]/8 dark:border-white/10 bg-[#FAF8F5] dark:bg-[#1E2B26] flex items-center justify-between gap-3">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError('');
                      setStep((prev) => (prev === 3 ? 2 : 1));
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    <span>הקודם</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={isFirstTime ? onSkipToDefaults : onClose}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] text-sm font-medium transition-colors cursor-pointer"
                  >
                    {isFirstTime ? 'דלג והשתמש בנתוני הדוגמה' : 'ביטול'}
                  </button>
                )}
              </div>

              <div>
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>המשך</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitWizard}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>צור את תוכנית הבית שלי</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
