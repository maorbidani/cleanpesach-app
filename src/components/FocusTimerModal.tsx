import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Coffee, Music2, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { TimerMode } from '../types';
import {
  AmbientSoundscapeType,
  playTaskCompleteChime,
  startAmbientSoundscape,
  stopAmbientSoundscape,
} from '../utils/soundEngine';

export const FOCUS_DURATION_SECONDS = 25 * 60;
export const BREAK_DURATION_SECONDS = 5 * 60;

interface FocusTimerModalProps {
  isOpen: boolean;
  roomName?: string;
  taskTitle?: string;
  mode: TimerMode;
  secondsLeft: number;
  customFocusDurationSeconds?: number | null;
  isRunning: boolean;
  onClose: () => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onSwitchMode: (mode: TimerMode) => void;
}

export function formatTimerSeconds(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function FocusTimerModal({
  isOpen,
  roomName,
  taskTitle,
  mode,
  secondsLeft,
  customFocusDurationSeconds,
  isRunning,
  onClose,
  onToggleRunning,
  onReset,
  onSwitchMode,
}: FocusTimerModalProps) {
  const [isAmbientOn, setIsAmbientOn] = useState(false);
  const [ambientType, setAmbientType] = useState<AmbientSoundscapeType>('rain');
  const prevSecondsRef = useRef(secondsLeft);
  const startedLocallyRef = useRef(false);

  useEffect(() => {
    if (prevSecondsRef.current > 0 && secondsLeft === 0) {
      playTaskCompleteChime();
      if (startedLocallyRef.current) {
        stopAmbientSoundscape();
        startedLocallyRef.current = false;
        setIsAmbientOn(false);
      }
    }
    prevSecondsRef.current = secondsLeft;
  }, [secondsLeft]);

  const handleToggleAmbient = () => {
    setIsAmbientOn((prev) => {
      const next = !prev;
      if (next) {
        startedLocallyRef.current = true;
        startAmbientSoundscape(ambientType);
      } else {
        startedLocallyRef.current = false;
        stopAmbientSoundscape();
      }
      return next;
    });
  };

  const handleSelectAmbientType = (nextType: AmbientSoundscapeType) => {
    setAmbientType(nextType);
    if (isAmbientOn) {
      startedLocallyRef.current = true;
      startAmbientSoundscape(nextType);
    }
  };

  useEffect(() => {
    return () => {
      if (startedLocallyRef.current) {
        stopAmbientSoundscape();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeFocusDuration =
    customFocusDurationSeconds && customFocusDurationSeconds > 0
      ? customFocusDurationSeconds
      : FOCUS_DURATION_SECONDS;

  const totalDuration =
    mode === 'focus' ? activeFocusDuration : BREAK_DURATION_SECONDS;
  const progressRatio = Math.max(0, Math.min(1, secondsLeft / totalDuration));

  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const isFinished = secondsLeft === 0;

  const encouragementText =
    isFinished
      ? mode === 'focus'
        ? 'כל הכבוד! סבב הפוקוס הסתיים — מגיעה לך הפסקה קצרה.'
        : 'ההפסקה הסתיימה! מוכנים לסבב ניקיון רענן נוסף?'
      : mode === 'focus'
      ? 'צעד קטן ועוד צעד – הבית מתחדש!'
      : 'נשימה עמוקה, כוס מים קרים וממשיכים בנחת.';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-timer-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2D312E]/40 dark:bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 p-6 sm:p-7 shadow-xl text-[#2D312E] dark:text-[#FAF8F5]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] block truncate">
                  {taskTitle
                    ? `משימה ממוקדת: ${taskTitle}`
                    : roomName
                    ? `מתמקדים ב: ${roomName}`
                    : 'טיימר פוקוס (פומודורו)'}
                </span>
                <h2
                  id="focus-timer-title"
                  className="font-display text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5] mt-0.5"
                >
                  {mode === 'focus' ? 'זמן פוקוס לניקיון' : 'הפסקה קצרה להתרעננות'}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="מזער או סגור חלונית טיימר"
                className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div
              className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 mb-6"
              role="tablist"
              aria-label="בחירת מצב טיימר"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'focus'}
                onClick={() => onSwitchMode('focus')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'focus'
                    ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                    : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                }`}
              >
                <Timer className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]" aria-hidden="true" />
                <span>{Math.round(activeFocusDuration / 60)} דקות פוקוס</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mode === 'break'}
                onClick={() => onSwitchMode('break')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'break'
                    ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                    : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                }`}
              >
                <Coffee className="w-4 h-4 text-[#8FB8CA]" aria-hidden="true" />
                <span>5 דקות הפסקה</span>
              </button>
            </div>

            {/* Circular Countdown Ring */}
            <div className="flex flex-col items-center justify-center my-2">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 212 212"
                  aria-hidden="true"
                >
                  <circle
                    cx="106"
                    cy="106"
                    r={radius}
                    fill="none"
                    className="stroke-[#EFECE6] dark:stroke-[#273630]"
                    strokeWidth="12"
                  />
                  <circle
                    cx="106"
                    cy="106"
                    r={radius}
                    fill="none"
                    stroke={mode === 'focus' ? '#5E8C7D' : '#8FB8CA'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-[stroke-dashoffset] duration-500 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className="text-5xl font-bold text-[#2D312E] dark:text-[#FAF8F5] tabular-nums tracking-tight"
                    dir="ltr"
                  >
                    {formatTimerSeconds(secondsLeft)}
                  </span>
                  <span className="text-xs font-medium text-[#5A605C] dark:text-[#C2CEC8] mt-1.5">
                    {isFinished
                      ? 'הזמן הסתיים'
                      : isRunning
                      ? mode === 'focus'
                        ? 'בפעולה'
                        : 'בהפסקה'
                      : 'מושהה'}
                  </span>
                </div>
              </div>
            </div>

            {/* Encouragement Quote */}
            <p className="text-center text-sm sm:text-base font-medium text-[#456B5E] dark:text-[#E5C17A] mt-3 mb-6 min-h-[24px] text-balance">
              {encouragementText}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleRunning}
                className={`flex-1 min-h-[48px] px-5 py-2.5 rounded-xl text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  mode === 'focus'
                    ? 'bg-[#5E8C7D] hover:bg-[#4E796B]'
                    : 'bg-[#5A8DA3] hover:bg-[#4A7A8F]'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>השהה</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {secondsLeft < totalDuration && secondsLeft > 0
                        ? 'המשך'
                        : 'התחל'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReset}
                aria-label="אפס טיימר"
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>איפוס</span>
              </button>
            </div>

            {/* Ambient Soundscape Toggle ("🎶 אווירת רוגע") */}
            <div className="mt-4 pt-4 border-t border-[#2D312E]/10 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2D312E] dark:text-[#FAF8F5]">
                  <Music2
                    className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]"
                    aria-hidden="true"
                  />
                  <span>🎶 אווירת רוגע (צלילי רקע)</span>
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isAmbientOn}
                  onClick={handleToggleAmbient}
                  className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isAmbientOn
                      ? 'bg-[#5E8C7D] text-white'
                      : 'bg-[#EFECE6] dark:bg-[#273630] text-[#5A605C] dark:text-[#C2CEC8] border border-[#2D312E]/10 dark:border-white/10'
                  }`}
                >
                  {isAmbientOn ? 'פעיל' : 'כבוי'}
                </button>
              </div>

              {isAmbientOn && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAmbientType('rain')}
                    className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      ambientType === 'rain'
                        ? 'bg-[#DFECF2] dark:bg-[#1F3A44] text-[#2B5D73] dark:text-[#9AC9DB] border border-[#8FB8CA]/50'
                        : 'bg-[#EFECE6] dark:bg-[#273630] text-[#5A605C] dark:text-[#C2CEC8]'
                    }`}
                  >
                    גשם אביב רך
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAmbientType('harmonic')}
                    className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      ambientType === 'harmonic'
                        ? 'bg-[#DFECF2] dark:bg-[#1F3A44] text-[#2B5D73] dark:text-[#9AC9DB] border border-[#8FB8CA]/50'
                        : 'bg-[#EFECE6] dark:bg-[#273630] text-[#5A605C] dark:text-[#C2CEC8]'
                    }`}
                  >
                    תדרי רוגע הרמוניים
                  </button>
                </div>
              )}
            </div>

            {isRunning && (
              <p className="text-center text-xs text-[#5A605C] dark:text-[#C2CEC8] mt-3">
                ניתן לסגור חלונית זו — הטיימר והמוזיקה ימשיכו ברקע.
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
