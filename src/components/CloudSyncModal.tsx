import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Cloud,
  CloudOff,
  Copy,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Share2,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  generateFamilyCode,
  getFriendlyCloudErrorMessage,
  isValidFamilyCodeFormat,
  normalizeFamilyCode,
} from '../firebase';

interface CloudSyncModalProps {
  isOpen: boolean;
  user: User | null;
  isAuthReady: boolean;
  activeFamilyCode: string | null;
  memberCount: number;
  isSyncing: boolean;
  syncError: string;
  onClose: () => void;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onCreateFamily: (code: string) => Promise<void>;
  onJoinFamily: (code: string) => Promise<void>;
  onLeaveFamily: () => Promise<void>;
}

export function CloudSyncModal({
  isOpen,
  user,
  isAuthReady,
  activeFamilyCode,
  memberCount,
  isSyncing,
  syncError,
  onClose,
  onSignInGoogle,
  onSignOut,
  onCreateFamily,
  onJoinFamily,
  onLeaveFamily,
}: CloudSyncModalProps) {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [customNewCode, setCustomNewCode] = useState(() => generateFamilyCode());
  const [localError, setLocalError] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLocalError('');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleGoogleLogin = async () => {
    setLocalError('');
    setBusyAction('login');
    try {
      await onSignInGoogle();
    } catch (err) {
      setLocalError(getFriendlyCloudErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeFamilyCode(customNewCode);
    if (!isValidFamilyCodeFormat(normalized)) {
      setLocalError(
        'קוד המשפחה חייב לכלול 4–24 אותיות באנגלית או ספרות (למשל PESACH-42).'
      );
      return;
    }

    setLocalError('');
    setBusyAction('create');
    try {
      await onCreateFamily(normalized);
    } catch (err) {
      setLocalError(getFriendlyCloudErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleJoinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeFamilyCode(joinCodeInput);
    if (!isValidFamilyCodeFormat(normalized)) {
      setLocalError('הזינו קוד משפחה תקין בן 4–24 תווים באנגלית או ספרות.');
      return;
    }

    setLocalError('');
    setBusyAction('join');
    try {
      await onJoinFamily(normalized);
      setJoinCodeInput('');
    } catch (err) {
      setLocalError(getFriendlyCloudErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyCode = async () => {
    if (!activeFamilyCode) return;
    try {
      await navigator.clipboard.writeText(activeFamilyCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const whatsappInviteUrl = activeFamilyCode
    ? `https://wa.me/?text=${encodeURIComponent(
        `בואו נסנכרן את ההכנות לפסח בקליןפסח בזמן אמת! 🌿✨\nקוד המשפחה שלנו: ${activeFamilyCode}`
      )}`
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-sync-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2D312E]/45 dark:bg-black/65 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 p-6 sm:p-7 shadow-2xl text-[#2D312E] dark:text-[#FAF8F5]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E1ECE8] dark:bg-[#2F4A41] text-[#456B5E] dark:text-[#E5C17A] flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="cloud-sync-title"
                    className="font-display text-xl sm:text-2xl font-bold"
                  >
                    סנכרון משפחתי חי בענן
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8]">
                    עדכון בזמן אמת בין המכשירים של בני הבית ב-Cloud Firestore
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="סגור חלונית סנכרון"
                className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:bg-[#EFECE6] dark:hover:bg-[#273630] cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {!isAuthReady ? (
              <div className="py-10 flex flex-col items-center gap-3 text-sm text-[#5A605C] dark:text-[#C2CEC8]">
                <Loader2 className="w-6 h-6 animate-spin text-[#5E8C7D] dark:text-[#E5C17A]" />
                <span>טוען מצב חיבור לענן...</span>
              </div>
            ) : !user ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 space-y-3">
                  <h3 className="font-display text-base font-bold">
                    שלב 1: התחברות מאובטחת עם Google
                  </h3>
                  <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed">
                    התחברו עם חשבון Google כדי לשמור את כל המשימות, החדרים, רשימת הקניות והנקודות בענן — ולהתחבר יחד עם בן/בת הזוג באמצעות קוד משפחה משותף.
                  </p>
                  <button
                    type="button"
                    disabled={busyAction === 'login'}
                    onClick={() => void handleGoogleLogin()}
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] disabled:opacity-60 text-white text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {busyAction === 'login' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>התחבר עם Google</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Signed-in User Banner */}
                <div className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#5E8C7D] dark:text-[#E5C17A]">
                      מחובר לחשבון Google
                    </p>
                    <p className="text-sm font-bold truncate">
                      {user.displayName || user.email || 'משתמש מחובר'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onSignOut()}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/10 dark:border-white/12 text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>התנתק</span>
                  </button>
                </div>

                {/* Connected Family Code Status */}
                {activeFamilyCode ? (
                  <div className="rounded-2xl bg-[#E1ECE8] dark:bg-[#243E35] border border-[#5E8C7D]/30 dark:border-[#E5C17A]/25 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#3D6357] dark:text-[#E5C17A]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5E8C7D] dark:bg-[#E5C17A] animate-pulse" />
                        <span>
                          {isSyncing
                            ? 'מסנכרן שינויים לענן...'
                            : 'הסנכרון המשפחתי פעיל בזמן אמת'}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#456B5E] dark:text-[#C2CEC8] tabular-nums">
                        <Users className="w-3.5 h-3.5" aria-hidden="true" />
                        {memberCount} מכשירים
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/10 dark:border-white/12 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] block">
                          קוד המשפחה לשיתוף:
                        </span>
                        <span
                          dir="ltr"
                          className="font-display text-xl font-bold tracking-wider text-[#2D312E] dark:text-[#FAF8F5] break-all"
                        >
                          {activeFamilyCode}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCopyCode()}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D7] dark:hover:bg-[#31443D] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#5E8C7D] dark:text-[#E5C17A]" />
                              <span>הועתק!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>העתק</span>
                            </>
                          )}
                        </button>

                        <a
                          href={whatsappInviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>שלח בוואטסאפ</span>
                        </a>
                      </div>
                    </div>

                    <p className="text-xs text-[#456B5E] dark:text-[#C2CEC8] leading-relaxed">
                      שתפו את הקוד עם בן/בת הזוג — כל סימון משימה, הוספת מצרך לרשימת הקניות או עדכון נקודות יופיע מיד אצל כולם.
                    </p>

                    <button
                      type="button"
                      onClick={() => void onLeaveFamily()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9B4D1E] dark:text-[#F4B68C] hover:underline cursor-pointer"
                    >
                      <CloudOff className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>עבור למצב מקומי / החלף קוד משפחה</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Option A: Create Family Room */}
                    <form
                      onSubmit={(e) => void handleCreateSubmit(e)}
                      className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold flex items-center gap-2">
                          <Sparkles
                            className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]"
                            aria-hidden="true"
                          />
                          <span>פתח בית חדש בענן</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCustomNewCode(generateFamilyCode())}
                          className="text-xs font-semibold text-[#5E8C7D] dark:text-[#E5C17A] hover:underline cursor-pointer"
                        >
                          הגרל קוד חדש
                        </button>
                      </div>
                      <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                        ישמור את מצב הבית הנוכחי שלכם בענן וייצור קוד משפחה משותף.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={customNewCode}
                          onChange={(e) =>
                            setCustomNewCode(normalizeFamilyCode(e.target.value))
                          }
                          placeholder="PESACH-4821"
                          className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-[#5E8C7D]"
                        />
                        <button
                          type="submit"
                          disabled={busyAction === 'create'}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] disabled:opacity-55 text-white text-sm font-semibold whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                        >
                          {busyAction === 'create' && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          <span>צור וסנכרן</span>
                        </button>
                      </div>
                    </form>

                    {/* Option B: Join Existing Family Room */}
                    <form
                      onSubmit={(e) => void handleJoinSubmit(e)}
                      className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-4 sm:p-5 space-y-3"
                    >
                      <h3 className="font-display text-base font-bold flex items-center gap-2">
                        <KeyRound
                          className="w-4 h-4 text-[#8FB8CA]"
                          aria-hidden="true"
                        />
                        <span>הצטרף לבית קיים עם קוד משפחה</span>
                      </h3>
                      <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                        קיבלתם קוד מבן/בת הזוג? הזינו אותו כאן כדי להסתנכרן מיד.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={joinCodeInput}
                          onChange={(e) =>
                            setJoinCodeInput(normalizeFamilyCode(e.target.value))
                          }
                          placeholder="הזינו קוד (למשל PESACH-4821)"
                          className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 text-sm font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-[#5E8C7D]"
                        />
                        <button
                          type="submit"
                          disabled={
                            busyAction === 'join' || joinCodeInput.length < 4
                          }
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#8FB8CA] hover:bg-[#7CA9BD] disabled:opacity-50 text-[#1C2A30] text-sm font-bold whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {busyAction === 'join' && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          <span>הצטרף</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {(localError || syncError) && (
              <div className="mt-4 rounded-xl bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C] px-4 py-3 text-xs sm:text-sm font-medium">
                {localError || syncError}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
