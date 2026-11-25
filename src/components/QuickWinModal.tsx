import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Clock,
  Lightbulb,
  RefreshCw,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { CleaningTask, Room } from '../types';
import { getTaskPoints } from '../data/mockData';

interface QuickWinModalProps {
  isOpen: boolean;
  task: CleaningTask | null;
  room: Room | null;
  hasMoreShortTasks: boolean;
  onClose: () => void;
  onPickAnother: () => void;
  onStartTimerForTask: (task: CleaningTask) => void;
  onCompleteTask: (taskId: string) => void;
}

export function QuickWinModal({
  isOpen,
  task,
  room,
  hasMoreShortTasks,
  onClose,
  onPickAnother,
  onStartTimerForTask,
  onCompleteTask,
}: QuickWinModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isChametz = task?.category === 'חובת חמץ';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-win-title"
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
            className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-[20px] bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 p-6 sm:p-7 shadow-2xl text-[#2D312E] dark:text-[#FAF8F5]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#8FB8CA]/30 dark:bg-[#8FB8CA]/20 text-[#1C2A30] dark:text-[#9AC9DB] flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A]">
                    הגרלת משימה מהירה (עד 20 דקות)
                  </span>
                  <h2
                    id="quick-win-title"
                    className="font-display text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5]"
                  >
                    יש לך 15 דקות פנויות!
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="סגור חלונית משימה מהירה"
                className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {task && room ? (
              <div className="space-y-5">
                {/* Selected Task Card */}
                <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#456B5E] dark:text-[#E5C17A]">
                      חדר: {room.name}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        isChametz
                          ? 'bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C]'
                          : 'bg-[#DFECF2] dark:bg-[#1F3A44] text-[#2B5D73] dark:text-[#9AC9DB]'
                      }`}
                    >
                      {task.category}
                    </span>
                  </div>

                  <p className="text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5] leading-snug">
                    {task.title}
                  </p>

                  <div className="flex items-center gap-3 text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8] tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8FB8CA]" aria-hidden="true" />
                      כ-{task.estimatedMinutes} דקות
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#456B5E] dark:text-[#E5C17A]">
                      +{getTaskPoints(task.category)} נקודות
                    </span>
                  </div>

                  {/* Quick Tip */}
                  <div className="pt-3 border-t border-[#2D312E]/8 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#456B5E] dark:text-[#E5C17A] mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-[#8FB8CA]" aria-hidden="true" />
                      <span>טיפ זריז</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed">
                      {task.cleaningTip}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => onStartTimerForTask(task)}
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Timer className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>הפעל טיימר ({task.estimatedMinutes} דק׳) והתחל עכשיו</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteTask(task.id);
                        onClose();
                      }}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]" aria-hidden="true" />
                      <span>סיימתי! סמן כהושלמה</span>
                    </button>

                    {hasMoreShortTasks && (
                      <button
                        type="button"
                        onClick={onPickAnother}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-[#5A605C] dark:text-[#C2CEC8]" aria-hidden="true" />
                        <span>הגרל משימה אחרת</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-6 text-center space-y-3">
                <p className="text-base font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  כל המשימות הקצרות בבית כבר הושלמו!
                </p>
                <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8]">
                  נשאר לך זמן פנוי? אפשר לבחור משימה ארוכה יותר מתוך מפת החדרים או לנוח עם כוס קפה.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  חזרה למסך הבית
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
